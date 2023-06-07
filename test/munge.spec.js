import assert from 'node:assert'
import { describe, it } from 'mocha'
import { taiData } from '../src/tai-data.js'
import { munge, MODELS } from '../src/munge.js'
import { Second } from '../src/second.js'
import { Segment } from '../src/segment.js'
import { Rat } from '../src/rat.js'

const JAN = 0
const DEC = 11

describe('MODELS', () => {
  it('pointless symbol string tests', () => {
    assert.strictEqual(MODELS.OVERRUN.description, 'OVERRUN')
    assert.strictEqual(MODELS.BREAK.description, 'BREAK')
    assert.strictEqual(MODELS.STALL.description, 'STALL')
    assert.strictEqual(MODELS.SMEAR.description, 'SMEAR')
  })
})

describe('munge', () => {
  it('fails on a bad model', () => {
    assert.throws(() => munge([
      [Date.UTC(1970, JAN, 1), 0]
    ], 'noop'), /Unrecognised model/)
  })

  describe('overrun model', () => {
    it('disallows disordered rays', () => {
      assert.throws(() => munge([
        [Date.UTC(1979, DEC, 9), 0],
        [Date.UTC(1970, JAN, 1), 0]
      ], MODELS.OVERRUN), /Disordered data/)
    })

    it('disallows zero-length rays', () => {
      assert.throws(() => munge([
        [Date.UTC(1970, JAN, 1), 0],
        [Date.UTC(1970, JAN, 1), 0]
      ], MODELS.OVERRUN), /Disordered data/)
    })

    it('works in the simplest possible case', () => {
      assert.deepStrictEqual(munge([
        [Date.UTC(1970, JAN, 1), 0]
      ], MODELS.OVERRUN), [new Segment(
        { atomic: Second.fromMillis(0), unix: Second.fromMillis(0) }
      )])
    })

    it('works when there is an initial offset', () => {
      assert.deepStrictEqual(munge([
        [7, -4]
      ], MODELS.OVERRUN), [new Segment(
        { atomic: Second.fromMillis(-3_993), unix: Second.fromMillis(7) }
      )])
    })

    it('works with some millisecond-level alterations', () => {
      //                  inserted       removed
      //                       \/         \/
      // TAI:          [3][4][5][6][ 7][ 8][ 9][...]
      // Unix: [...][6][7][8][9][9][10][11][13][...]
      assert.deepStrictEqual(munge([
        [-1_000, -4],
        [9_000, -3], // inserted leap second
        [13_000, -4] // removed leap second
      ], MODELS.OVERRUN), [new Segment(
        { atomic: new Second(-5n, 1n), unix: new Second(-1n, 1n) },
        { atomic: new Second(6n, 1n) }
      ), new Segment(
        { atomic: new Second(6n, 1n), unix: new Second(9n, 1n) },
        { atomic: new Second(9n, 1n) }
      ), new Segment(
        { atomic: new Second(9n, 1n), unix: new Second(13n, 1n) }
      )])
    })

    it('allows a negative ratio somehow', () => {
      // TAI runs way faster than UTC
      assert.deepStrictEqual(munge([
        [Date.UTC(1970, JAN, 1), 0, 40_587, 8.640_0]
      ], MODELS.OVERRUN), [new Segment(
        { atomic: Second.fromMillis(0), unix: Second.fromMillis(0) },
        { atomic: Second.END_OF_TIME },
        { unixPerAtomic: new Rat(10_000n, 10_001n) }
      )])

      // UTC and TAI run at identical rates
      assert.deepStrictEqual(munge([
        [Date.UTC(1970, JAN, 1), 0, 40_587, 0]
      ], MODELS.OVERRUN), [new Segment(
        { atomic: Second.fromMillis(0), unix: Second.fromMillis(0) }
      )])

      // TAI runs way slower than UTC
      assert.deepStrictEqual(munge([
        [Date.UTC(1970, JAN, 1), 0, 40_587, -8.640_0]
      ], MODELS.OVERRUN), [new Segment(
        { atomic: Second.fromMillis(0), unix: Second.fromMillis(0) },
        { atomic: Second.END_OF_TIME },
        { unixPerAtomic: new Rat(10_000n, 9_999n) }
      )])

      // TAI moves at one ten-thousandth the rate of UTC!
      // Equivalently, UTC moves 10,000 times the rate of TAI
      assert.deepStrictEqual(munge([
        [Date.UTC(1970, JAN, 1), 0, 40_587, -86_400 + 8.640_0]
      ], MODELS.OVERRUN), [new Segment(
        { atomic: Second.fromMillis(0), unix: Second.fromMillis(0) },
        { atomic: Second.END_OF_TIME },
        { unixPerAtomic: new Rat(10_000n) }
      )])

      // UTC stops
      // There's no way to get this by munging finite data. The drift rate would have to be
      // infinite to get this result.

      // UTC runs backwards
      // Disallowing this, as it makes "unix time on segment" calculations
      // annoying, for no real gain
    })

    it('works with the first line of real data', () => {
      assert.deepStrictEqual(munge([
        [Date.UTC(1961, JAN, 1), 1.422_818_0, 37_300, 0.001_296]
      ], MODELS.OVERRUN), [new Segment(
        { atomic: new Second(-283_996_798_577_182n, 1_000_000n), unix: new Second(-283_996_800n, 1n) },
        { atomic: Second.END_OF_TIME },
        { unixPerAtomic: new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n) }
      )])
    })

    it('generates proper slopes', () => {
      assert.deepStrictEqual(munge(taiData, MODELS.OVERRUN).map(segment => segment.slope.unixPerAtomic),
        [
          // Exact ratio of nanoseconds. TAI adds a millisecond or two per day
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_123_200n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_123_200n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 2_592_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 2_592_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n)
        ])
    })

    it('generates proper Unix time overlaps', () => {
      assert.deepStrictEqual(munge(taiData, MODELS.OVERRUN).map((segment, i, segments) => {
        if (!(i + 1 in segments)) {
          return NaN
        }

        const unix = segments[i + 1].start.unix

        // TAI as of this Unix time, at the END of the CURRENT segment
        const a = unix
          .minusS(segment.start.unix)
          .divideR(segment.slope.unixPerAtomic)
          .plusS(segment.start.atomic)

        // TAI as of this Unix time, at the START of the NEXT segment
        const b = unix
          .minusS(segments[i + 1].start.unix)
          .divideR(segments[i + 1].slope.unixPerAtomic)
          .plusS(segments[i + 1].start.atomic)

        return b.minusS(a)
      }), [
        // Exact ratio of microseconds
        new Second(-50_000n, 1_000_000n),
        new Second(0n, 1_000_000n),
        new Second(100_000n, 1_000_000n),
        new Second(0n, 1_000_000n),
        new Second(100_000n, 1_000_000n),
        new Second(100_000n, 1_000_000n),
        new Second(100_000n, 1_000_000n),
        new Second(100_000n, 1_000_000n),
        new Second(100_000n, 1_000_000n),
        new Second(100_000n, 1_000_000n),
        new Second(0n, 1_000_000n),
        new Second(-100_000n, 1_000_000n),
        new Second(107_758n, 1_000_000n),
        new Second(1_000_000n, 1_000_000n),
        new Second(1_000_000n, 1_000_000n),
        new Second(1_000_000n, 1_000_000n),
        new Second(1_000_000n, 1_000_000n),
        new Second(1_000_000n, 1_000_000n),
        new Second(1_000_000n, 1_000_000n),
        new Second(1_000_000n, 1_000_000n),
        new Second(1_000_000n, 1_000_000n),
        new Second(1_000_000n, 1_000_000n),
        new Second(1_000_000n, 1_000_000n),
        new Second(1_000_000n, 1_000_000n),
        new Second(1_000_000n, 1_000_000n),
        new Second(1_000_000n, 1_000_000n),
        new Second(1_000_000n, 1_000_000n),
        new Second(1_000_000n, 1_000_000n),
        new Second(1_000_000n, 1_000_000n),
        new Second(1_000_000n, 1_000_000n),
        new Second(1_000_000n, 1_000_000n),
        new Second(1_000_000n, 1_000_000n),
        new Second(1_000_000n, 1_000_000n),
        new Second(1_000_000n, 1_000_000n),
        new Second(1_000_000n, 1_000_000n),
        new Second(1_000_000n, 1_000_000n),
        new Second(1_000_000n, 1_000_000n),
        new Second(1_000_000n, 1_000_000n),
        new Second(1_000_000n, 1_000_000n),
        new Second(1_000_000n, 1_000_000n),
        NaN // `Infinity - Infinity`
      ])
    })

    describe('when unixMillis converts to an atomicPicos which fits but an atomicMillis which does not', () => {
      it('at the start of the ray', () => {
        assert.deepStrictEqual(munge([
          [Date.UTC(1970, JAN, 1, 0, 0, 0, 1), -0.000_1]
        ], MODELS.OVERRUN), [new Segment(
          { atomic: new Second(900n, 1_000_000n), unix: Second.fromMillis(1) } // ray start intentionally doesn't include TAI epoch
        )])
      })

      it('at the end of the ray', () => {
        // first ray's end intentionally doesn't include TAI epoch
        assert.deepStrictEqual(munge([
          [Date.UTC(1969, DEC, 31, 23, 59, 59, 999), 0.000_1],
          [Date.UTC(1970, JAN, 1, 0, 0, 0, 1), -0.001_1]
        ], MODELS.OVERRUN), [new Segment(
          { atomic: new Second(-900n, 1_000_000n), unix: Second.fromMillis(-1) },
          { atomic: new Second(-100n, 1_000_000n) }
        ), new Segment(
          { atomic: new Second(-100n, 1_000_000n), unix: Second.fromMillis(1) }
        )])
      })
    })
  })

  describe('break model', () => {
    it('works in the simplest possible case', () => {
      assert.deepStrictEqual(munge([
        [Date.UTC(1970, JAN, 1), 0]
      ], MODELS.BREAK), [new Segment(
        { atomic: Second.fromMillis(0), unix: Second.fromMillis(0) }
      )])
    })

    it('works with some millisecond-level alterations', () => {
      //                  inserted       removed
      //                       \/         \/
      // TAI:          [3][4][5][6][ 7][ 8][ 9][...]
      // Unix: [...][6][7][8][9][9][10][11][13][...]
      assert.deepStrictEqual(munge([
        [-1_000, -4],
        [9_000, -3], // inserted leap second
        [13_000, -4] // removed leap second
      ], MODELS.BREAK), [new Segment(
        { atomic: new Second(-5n, 1n), unix: new Second(-1n, 1n) },
        { atomic: new Second(5n, 1n) }
      ), new Segment(
        // this segment starts a full TAI second after the previous segment ended
        { atomic: new Second(6n, 1n), unix: new Second(9n, 1n) },
        { atomic: new Second(9n, 1n) }
      ), new Segment(
        { atomic: new Second(9n, 1n), unix: new Second(13n, 1n) }
      )])
    })
  })

  describe('stall model', () => {
    it('disallows disordered rays', () => {
      assert.throws(() => munge([
        [Date.UTC(1979, DEC, 9), 0],
        [Date.UTC(1970, JAN, 1), 0]
      ], MODELS.STALL), /Disordered data/)
    })

    it('works in the simplest possible case', () => {
      assert.deepStrictEqual(munge([
        [Date.UTC(1970, JAN, 1), 0]
      ], MODELS.STALL), [new Segment(
        { atomic: Second.fromMillis(0), unix: Second.fromMillis(0) }
      )])
    })

    it('works when there is an initial offset', () => {
      assert.deepStrictEqual(munge([
        [7, -4]
      ], MODELS.STALL), [new Segment(
        { atomic: Second.fromMillis(-3_993), unix: Second.fromMillis(7) }
      )])
    })

    it('works with some millisecond-level alterations', () => {
      //                  inserted       removed
      //                       \/         \/
      // TAI:          [3][4][5][6][ 7][ 8][ 9][...]
      // Unix: [...][6][7][8][9][9][10][11][13][...]
      assert.deepStrictEqual(munge([
        [-1_000, -4],
        [9_000, -3], // inserted leap second
        [13_000, -4] // removed leap second
      ], MODELS.STALL), [new Segment(
        { atomic: new Second(-5n, 1n), unix: new Second(-1n, 1n) },
        { atomic: new Second(5n, 1n) }
      ), new Segment(
        // Stall segment inserted here
        { atomic: new Second(5n, 1n), unix: new Second(9n, 1n) },
        { atomic: new Second(6n, 1n) },
        { unixPerAtomic: new Rat(0n) }
      ), new Segment(
        { atomic: new Second(6n, 1n), unix: new Second(9n, 1n) },
        { atomic: new Second(9n, 1n) }
      ), new Segment(
        { atomic: new Second(9n, 1n), unix: new Second(13n, 1n) }
      )])
    })

    it('allows a negative ratio somehow', () => {
      // TAI runs way faster than UTC
      assert.deepStrictEqual(munge([
        [Date.UTC(1970, JAN, 1), 0, 40_587, 8.640_0]
      ], MODELS.STALL), [new Segment(
        { atomic: Second.fromMillis(0), unix: Second.fromMillis(0) },
        { atomic: Second.END_OF_TIME },
        { unixPerAtomic: new Rat(10_000n, 10_001n) }
      )])

      // UTC and TAI run at identical rates
      assert.deepStrictEqual(munge([
        [Date.UTC(1970, JAN, 1), 0, 40_587, 0]
      ], MODELS.STALL), [new Segment(
        { atomic: Second.fromMillis(0), unix: Second.fromMillis(0) }
      )])

      // TAI runs way slower than UTC
      assert.deepStrictEqual(munge([
        [Date.UTC(1970, JAN, 1), 0, 40_587, -8.640_0]
      ], MODELS.STALL), [new Segment(
        { atomic: Second.fromMillis(0), unix: Second.fromMillis(0) },
        { atomic: Second.END_OF_TIME },
        { unixPerAtomic: new Rat(10_000n, 9_999n) }
      )])

      // TAI moves at one ten-thousandth the rate of UTC!
      // Equivalently, UTC moves 10,000 times the rate of TAI
      assert.deepStrictEqual(munge([
        [Date.UTC(1970, JAN, 1), 0, 40_587, -86_400 + 8.640_0]
      ], MODELS.STALL), [new Segment(
        { atomic: Second.fromMillis(0), unix: Second.fromMillis(0) },
        { atomic: Second.END_OF_TIME },
        { unixPerAtomic: new Rat(10_000n) }
      )])

      // UTC stops
      // There's no way to get this by munging finite data. The drift rate would have to be
      // infinite to get this result.

      // UTC runs backwards
      // Disallowing this, as it makes "unix time on segment" calculations
      // annoying, for no real gain
    })

    it('works with the first line of real data', () => {
      assert.deepStrictEqual(munge([
        [Date.UTC(1961, JAN, 1), 1.422_818_0, 37_300, 0.001_296]
      ], MODELS.STALL), [new Segment(
        { atomic: new Second(-283_996_798_577_182n, 1_000_000n), unix: new Second(-283_996_800n, 1n) },
        { atomic: Second.END_OF_TIME },
        { unixPerAtomic: new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n) }
      )])
    })

    it('generates proper slopes', () => {
      // Note the stalls for the duration of inserted time
      assert.deepStrictEqual(munge(taiData, MODELS.STALL).map(segment => segment.slope.unixPerAtomic),
        [
          // Exact ratio of nanoseconds. TAI adds a millisecond or two per day
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_123_200n),
          new Rat(0n, 86_400_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_123_200n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n),
          new Rat(0n, 86_400_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n),
          new Rat(0n, 86_400_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n),
          new Rat(0n, 86_400_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n),
          new Rat(0n, 86_400_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n),
          new Rat(0n, 86_400_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n),
          new Rat(0n, 86_400_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 2_592_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 2_592_000n),
          new Rat(0n, 86_400_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(0n, 86_400_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(0n, 86_400_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(0n, 86_400_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(0n, 86_400_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(0n, 86_400_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(0n, 86_400_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(0n, 86_400_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(0n, 86_400_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(0n, 86_400_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(0n, 86_400_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(0n, 86_400_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(0n, 86_400_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(0n, 86_400_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(0n, 86_400_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(0n, 86_400_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(0n, 86_400_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(0n, 86_400_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(0n, 86_400_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(0n, 86_400_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(0n, 86_400_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(0n, 86_400_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(0n, 86_400_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(0n, 86_400_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(0n, 86_400_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(0n, 86_400_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(0n, 86_400_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(0n, 86_400_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n)
        ])
    })

    it('generates proper overlaps', () => {
      // See how all inserted time discontinuities disappear with this model,
      // but the removed time remains
      assert.deepStrictEqual(munge(taiData, MODELS.STALL).map((segment, i, segments) => {
        if (!(i + 1 in segments)) {
          return NaN
        }

        const unix = segments[i + 1].start.unix

        // TAI as of this Unix time, at the END of the CURRENT segment
        const a = segment.slope.unixPerAtomic.nu === 0n
          ? segment.end.atomic
          : unix
            .minusS(segment.start.unix)
            .divideR(segment.slope.unixPerAtomic)
            .plusS(segment.start.atomic)

        // TAI  of this Unix time, at the START of the NEXT segment
        const b = segments[i + 1].slope.unixPerAtomic.nu === 0n
          ? segments[i + 1].start.atomic
          : unix
            .minusS(segments[i + 1].start.unix)
            .divideR(segments[i + 1].slope.unixPerAtomic)
            .plusS(segments[i + 1].start.atomic)

        return b.minusS(a)
      }), [
        // Exact ratio expressing milliseconds
        new Second(-50n, 1_000n), // 0.05 TAI seconds removed from UTC
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(-100n, 1_000n), // 0.1 TAI seconds removed from UTC
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        new Second(0n, 1_000n),
        NaN
      ])
    })
  })

  describe('smear model', () => {
    it('works in the simplest possible case', () => {
      assert.deepStrictEqual(munge([
        [Date.UTC(1970, JAN, 1), 0]
      ], MODELS.SMEAR), [new Segment(
        { atomic: Second.fromMillis(0), unix: Second.fromMillis(0) }
      )])
    })

    it('works when one second is inserted', () => {
      assert.deepStrictEqual(munge([
        [0, 0],
        [86_400_000, 1] // inserted leap second after one day
      ], MODELS.SMEAR), [new Segment(
        { atomic: Second.fromMillis(0), unix: Second.fromMillis(0) },
        { atomic: new Second(43_200n, 1n) } // midday
      ), new Segment(
        { atomic: new Second(43_200n, 1n), unix: new Second(43_200n, 1n) }, // midday
        { atomic: new Second(129_601n, 1n) }, // midday
        { unixPerAtomic: new Rat(86_400n, 86_401n) } // A full Unix day elapses, but a full TAI day plus one second elapses
      ), new Segment(
        { atomic: new Second(129_601n, 1n), unix: new Second(129_600n, 1n) } // midday
      )])
    })

    it('works when one second is removed', () => {
      assert.deepStrictEqual(munge([
        [0, 0],
        [86_400_000, -1] // removed leap second after one day
      ], MODELS.SMEAR), [new Segment(
        { atomic: Second.fromMillis(0), unix: Second.fromMillis(0) },
        { atomic: new Second(43_200n, 1n) } // midday
      ), new Segment(
        { atomic: new Second(43_200n, 1n), unix: new Second(43_200n, 1n) }, // midday
        { atomic: new Second(129_599n, 1n) }, // midday
        { unixPerAtomic: new Rat(86_400n, 86_399n) } // A full Unix day elapses, but a full TAI day minus one second elapses
      ), new Segment(
        { atomic: new Second(129_599n, 1n), unix: new Second(129_600n, 1n) } // midday
      )])
    })

    it('generates proper slopes', () => {
      assert.deepStrictEqual(munge(taiData, MODELS.SMEAR).map(segment => segment.slope.unixPerAtomic),
        [
          // Exact ratio of nanoseconds.
          // During Unix-day-long smears, elapsed atomic time is a full day PLUS daily offset
          // PLUS inserted time
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n - 50_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_209_600n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_123_200n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_123_200n + 100_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_123_200n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_209_600n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n + 100_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n + 100_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n + 100_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n + 100_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n + 100_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n + 100_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_944_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 2_592_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 2_592_000n - 100_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 2_592_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n + 109_054_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n + 1_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n + 1_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n + 1_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n + 1_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n + 1_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n + 1_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n + 1_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n + 1_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n + 1_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n + 1_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n + 1_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n + 1_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n + 1_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n + 1_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n + 1_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n + 1_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n + 1_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n + 1_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n + 1_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n + 1_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n + 1_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n + 1_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n + 1_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n + 1_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n + 1_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n + 1_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n + 1_000_000_000n),
          new Rat(86_400_000_000_000n, 86_400_000_000_000n + 0n)
        ])
    })

    it('generates proper overlaps', () => {
      // Due to smearing, there are NEVER overlaps, no removed or inserted time remains
      assert.deepStrictEqual(munge(taiData, MODELS.SMEAR).map((segment, i, segments) => {
        if (!(i + 1 in segments)) {
          return NaN
        }

        const unix = segments[i + 1].start.unix

        // TAI as of this Unix time, at the END of the CURRENT segment
        const a = unix
          .minusS(segment.start.unix)
          .divideR(segment.slope.unixPerAtomic)
          .plusS(segment.start.atomic)

        // TAI as of this Unix time, at the START of the NEXT segment
        const b = unix
          .minusS(segments[i + 1].start.unix)
          .divideR(segments[i + 1].slope.unixPerAtomic)
          .plusS(segments[i + 1].start.atomic)

        return b.minusS(a)
      }), [
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        new Second(0n, 1n),
        NaN
      ])
    })
  })
})

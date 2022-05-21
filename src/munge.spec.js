/* eslint-env jest */

const { taiData } = require('./tai-data')
const { munge, MODELS } = require('./munge')
const { Rat } = require('./rat')
const { Segment } = require('./segment')

const JAN = 0
const DEC = 11

describe('MODELS', () => {
  it('pointless symbol string tests', () => {
    expect(MODELS.OVERRUN.description).toBe('OVERRUN')
    expect(MODELS.BREAK.description).toBe('BREAK')
    expect(MODELS.STALL.description).toBe('STALL')
    expect(MODELS.SMEAR.description).toBe('SMEAR')
  })
})

describe('munge', () => {
  it('fails on a bad model', () => {
    expect(() => munge([
      [Date.UTC(1970, JAN, 1), 0]
    ], 'noop')).toThrowError('Unrecognised model')
  })

  describe('overrun model', () => {
    it('disallows disordered rays', () => {
      expect(() => munge([
        [Date.UTC(1979, DEC, 9), 0],
        [Date.UTC(1970, JAN, 1), 0]
      ], MODELS.OVERRUN)).toThrowError('Disordered data')
    })

    it('disallows zero-length rays', () => {
      expect(() => munge([
        [Date.UTC(1970, JAN, 1), 0],
        [Date.UTC(1970, JAN, 1), 0]
      ], MODELS.OVERRUN)).toThrowError('Disordered data')
    })

    it('works in the simplest possible case', () => {
      expect(munge([
        [Date.UTC(1970, JAN, 1), 0]
      ], MODELS.OVERRUN)).toEqual([new Segment(
        { atomic: new Rat(0n), unix: new Rat(0n) },
        { atomic: Infinity },
        new Rat(1n)
      )])
    })

    it('works when there is an initial offset', () => {
      expect(munge([
        [7, -4]
      ], MODELS.OVERRUN)).toEqual([new Segment(
        { atomic: new Rat(-3_993n, 1_000n), unix: new Rat(7n, 1_000n) },
        { atomic: Infinity },
        new Rat(1n)
      )])
    })

    it('works with some millisecond-level alterations', () => {
      //                  inserted       removed
      //                       \/         \/
      // TAI:          [3][4][5][6][ 7][ 8][ 9][...]
      // Unix: [...][6][7][8][9][9][10][11][13][...]
      expect(munge([
        [-1_000, -4],
        [9_000, -3], // inserted leap second
        [13_000, -4] // removed leap second
      ], MODELS.OVERRUN)).toEqual([new Segment(
        { atomic: new Rat(-5n), unix: new Rat(-1n) },
        { atomic: new Rat(6n) },
        new Rat(1n)
      ), new Segment(
        { atomic: new Rat(6n), unix: new Rat(9n) },
        { atomic: new Rat(9n) },
        new Rat(1n)
      ), new Segment(
        { atomic: new Rat(9n), unix: new Rat(13n) },
        { atomic: Infinity },
        new Rat(1n)
      )])
    })

    it('allows a negative ratio somehow', () => {
      // TAI runs way faster than UTC
      expect(munge([
        [Date.UTC(1970, JAN, 1), 0, 40_587, 8.640_0]
      ], MODELS.OVERRUN)).toEqual([new Segment(
        { atomic: new Rat(0n), unix: new Rat(0n) },
        { atomic: Infinity },
        new Rat(10_000n, 10_001n)
      )])

      // UTC and TAI run at identical rates
      expect(munge([
        [Date.UTC(1970, JAN, 1), 0, 40_587, 0]
      ], MODELS.OVERRUN)).toEqual([new Segment(
        { atomic: new Rat(0n), unix: new Rat(0n) },
        { atomic: Infinity },
        new Rat(1n)
      )])

      // TAI runs way slower than UTC
      expect(munge([
        [Date.UTC(1970, JAN, 1), 0, 40_587, -8.640_0]
      ], MODELS.OVERRUN)).toEqual([new Segment(
        { atomic: new Rat(0n), unix: new Rat(0n) },
        { atomic: Infinity },
        new Rat(10_000n, 9_999n)
      )])

      // TAI moves at one ten-thousandth the rate of UTC!
      // Equivalently, UTC moves 10,000 times the rate of TAI
      expect(munge([
        [Date.UTC(1970, JAN, 1), 0, 40_587, -86_400 + 8.640_0]
      ], MODELS.OVERRUN)).toEqual([new Segment(
        { atomic: new Rat(0n), unix: new Rat(0n) },
        { atomic: Infinity },
        new Rat(10_000n)
      )])

      // UTC stops
      // There's no way to get this by munging finite data. The drift rate would have to be
      // infinite to get this result.

      // TAI runs backwards: wild and highly untested but sure!
      expect(munge([
        [Date.UTC(1970, JAN, 1), 0, 40_587, -86_400 - 8.640_0]
      ], MODELS.OVERRUN)).toEqual([new Segment(
        { atomic: new Rat(0n), unix: new Rat(0n) },
        { atomic: Infinity },
        new Rat(-10_000n)
      )])
    })

    it('works with the first line of real data', () => {
      expect(munge([
        [Date.UTC(1961, JAN, 1), 1.422_818_0, 37_300, 0.001_296]
      ], MODELS.OVERRUN)).toEqual([new Segment(
        { atomic: new Rat(-283_996_798_577_182n, 1_000_000n), unix: new Rat(-283_996_800n) },
        { atomic: Infinity },
        new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n)
      )])
    })

    it('generates proper slopes', () => {
      expect(munge(taiData, MODELS.OVERRUN).map(segment => segment.slope.unixPerAtomic))
        .toEqual([
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
      expect(munge(taiData, MODELS.OVERRUN).map((segment, i, segments) => {
        if (!(i + 1 in segments)) {
          return NaN
        }

        const unix = segments[i + 1].start.unix

        // TAI as of this Unix time, at the END of the CURRENT segment
        const a = unix
          .minus(segment.start.unix)
          .divide(segment.slope.unixPerAtomic)
          .plus(segment.start.atomic)

        // TAI as of this Unix time, at the START of the NEXT segment
        const b = unix
          .minus(segments[i + 1].start.unix)
          .divide(segments[i + 1].slope.unixPerAtomic)
          .plus(segments[i + 1].start.atomic)

        return b.minus(a)
      })).toEqual([
        // Exact ratio of microseconds
        new Rat(-50_000n, 1_000_000n),
        new Rat(0n, 1_000_000n),
        new Rat(100_000n, 1_000_000n),
        new Rat(0n, 1_000_000n),
        new Rat(100_000n, 1_000_000n),
        new Rat(100_000n, 1_000_000n),
        new Rat(100_000n, 1_000_000n),
        new Rat(100_000n, 1_000_000n),
        new Rat(100_000n, 1_000_000n),
        new Rat(100_000n, 1_000_000n),
        new Rat(0n, 1_000_000n),
        new Rat(-100_000n, 1_000_000n),
        new Rat(107_758n, 1_000_000n),
        new Rat(1_000_000n, 1_000_000n),
        new Rat(1_000_000n, 1_000_000n),
        new Rat(1_000_000n, 1_000_000n),
        new Rat(1_000_000n, 1_000_000n),
        new Rat(1_000_000n, 1_000_000n),
        new Rat(1_000_000n, 1_000_000n),
        new Rat(1_000_000n, 1_000_000n),
        new Rat(1_000_000n, 1_000_000n),
        new Rat(1_000_000n, 1_000_000n),
        new Rat(1_000_000n, 1_000_000n),
        new Rat(1_000_000n, 1_000_000n),
        new Rat(1_000_000n, 1_000_000n),
        new Rat(1_000_000n, 1_000_000n),
        new Rat(1_000_000n, 1_000_000n),
        new Rat(1_000_000n, 1_000_000n),
        new Rat(1_000_000n, 1_000_000n),
        new Rat(1_000_000n, 1_000_000n),
        new Rat(1_000_000n, 1_000_000n),
        new Rat(1_000_000n, 1_000_000n),
        new Rat(1_000_000n, 1_000_000n),
        new Rat(1_000_000n, 1_000_000n),
        new Rat(1_000_000n, 1_000_000n),
        new Rat(1_000_000n, 1_000_000n),
        new Rat(1_000_000n, 1_000_000n),
        new Rat(1_000_000n, 1_000_000n),
        new Rat(1_000_000n, 1_000_000n),
        new Rat(1_000_000n, 1_000_000n),
        NaN // `Infinity - Infinity`
      ])
    })

    describe('when unixMillis converts to an atomicPicos which fits but an atomicMillis which does not', () => {
      it('at the start of the ray', () => {
        expect(munge([
          [Date.UTC(1970, JAN, 1, 0, 0, 0, 1), -0.000_1]
        ], MODELS.OVERRUN)).toEqual([new Segment(
          { atomic: new Rat(900n, 1_000_000n), unix: new Rat(1n, 1_000n) }, // ray start intentionally doesn't include TAI epoch
          { atomic: Infinity },
          new Rat(1n)
        )])
      })

      it('at the end of the ray', () => {
        // first ray's end intentionally doesn't include TAI epoch
        expect(munge([
          [Date.UTC(1969, DEC, 31, 23, 59, 59, 999), 0.000_1],
          [Date.UTC(1970, JAN, 1, 0, 0, 0, 1), -0.001_1]
        ], MODELS.OVERRUN)).toEqual([new Segment(
          { atomic: new Rat(-900n, 1_000_000n), unix: new Rat(-1n, 1_000n) },
          { atomic: new Rat(-100n, 1_000_000n) },
          new Rat(1n)
        ), new Segment(
          { atomic: new Rat(-100n, 1_000_000n), unix: new Rat(1n, 1_000n) },
          { atomic: Infinity },
          new Rat(1n)
        )])
      })
    })
  })

  describe('break model', () => {
    it('works in the simplest possible case', () => {
      expect(munge([
        [Date.UTC(1970, JAN, 1), 0]
      ], MODELS.BREAK)).toEqual([new Segment(
        { atomic: new Rat(0n), unix: new Rat(0n) },
        { atomic: Infinity },
        new Rat(1n)
      )])
    })

    it('works with some millisecond-level alterations', () => {
      //                  inserted       removed
      //                       \/         \/
      // TAI:          [3][4][5][6][ 7][ 8][ 9][...]
      // Unix: [...][6][7][8][9][9][10][11][13][...]
      expect(munge([
        [-1_000, -4],
        [9_000, -3], // inserted leap second
        [13_000, -4] // removed leap second
      ], MODELS.BREAK)).toEqual([new Segment(
        { atomic: new Rat(-5n), unix: new Rat(-1n) },
        { atomic: new Rat(5n) },
        new Rat(1n)
      ), new Segment(
        // this segment starts a full TAI second after the previous segment ended
        { atomic: new Rat(6n), unix: new Rat(9n) },
        { atomic: new Rat(9n) },
        new Rat(1n)
      ), new Segment(
        { atomic: new Rat(9n), unix: new Rat(13n) },
        { atomic: Infinity },
        new Rat(1n)
      )])
    })
  })

  describe('stall model', () => {
    it('disallows disordered rays', () => {
      expect(() => munge([
        [Date.UTC(1979, DEC, 9), 0],
        [Date.UTC(1970, JAN, 1), 0]
      ], MODELS.STALL)).toThrowError('Disordered data')
    })

    it('works in the simplest possible case', () => {
      expect(munge([
        [Date.UTC(1970, JAN, 1), 0]
      ], MODELS.STALL)).toEqual([new Segment(
        { atomic: new Rat(0n), unix: new Rat(0n) },
        { atomic: Infinity },
        new Rat(1n)
      )])
    })

    it('works when there is an initial offset', () => {
      expect(munge([
        [7, -4]
      ], MODELS.STALL)).toEqual([new Segment(
        { atomic: new Rat(-3_993n, 1_000n), unix: new Rat(7n, 1_000n) },
        { atomic: Infinity },
        new Rat(1n)
      )])
    })

    it('works with some millisecond-level alterations', () => {
      //                  inserted       removed
      //                       \/         \/
      // TAI:          [3][4][5][6][ 7][ 8][ 9][...]
      // Unix: [...][6][7][8][9][9][10][11][13][...]
      expect(munge([
        [-1_000, -4],
        [9_000, -3], // inserted leap second
        [13_000, -4] // removed leap second
      ], MODELS.STALL)).toEqual([new Segment(
        { atomic: new Rat(-5n), unix: new Rat(-1n) },
        { atomic: new Rat(5n) },
        new Rat(1n)
      ), new Segment(
        // Stall segment inserted here
        { atomic: new Rat(5n), unix: new Rat(9n) },
        { atomic: new Rat(6n) },
        new Rat(0n)
      ), new Segment(
        { atomic: new Rat(6n), unix: new Rat(9n) },
        { atomic: new Rat(9n) },
        new Rat(1n)
      ), new Segment(
        { atomic: new Rat(9n), unix: new Rat(13n) },
        { atomic: Infinity },
        new Rat(1n)
      )])
    })

    it('allows a negative ratio somehow', () => {
      // TAI runs way faster than UTC
      expect(munge([
        [Date.UTC(1970, JAN, 1), 0, 40_587, 8.640_0]
      ], MODELS.STALL)).toEqual([new Segment(
        { atomic: new Rat(0n), unix: new Rat(0n) },
        { atomic: Infinity },
        new Rat(10_000n, 10_001n)
      )])

      // UTC and TAI run at identical rates
      expect(munge([
        [Date.UTC(1970, JAN, 1), 0, 40_587, 0]
      ], MODELS.STALL)).toEqual([new Segment(
        { atomic: new Rat(0n), unix: new Rat(0n) },
        { atomic: Infinity },
        new Rat(1n)
      )])

      // TAI runs way slower than UTC
      expect(munge([
        [Date.UTC(1970, JAN, 1), 0, 40_587, -8.640_0]
      ], MODELS.STALL)).toEqual([new Segment(
        { atomic: new Rat(0n), unix: new Rat(0n) },
        { atomic: Infinity },
        new Rat(10_000n, 9_999n)
      )])

      // TAI moves at one ten-thousandth the rate of UTC!
      // Equivalently, UTC moves 10,000 times the rate of TAI
      expect(munge([
        [Date.UTC(1970, JAN, 1), 0, 40_587, -86_400 + 8.640_0]
      ], MODELS.STALL)).toEqual([new Segment(
        { atomic: new Rat(0n), unix: new Rat(0n) },
        { atomic: Infinity },
        new Rat(10_000n)
      )])

      // UTC stops
      // There's no way to get this by munging finite data. The drift rate would have to be
      // infinite to get this result.

      // TAI runs backwards: wild and highly untested but sure!
      expect(munge([
        [Date.UTC(1970, JAN, 1), 0, 40_587, -86_400 - 8.640_0]
      ], MODELS.STALL)).toEqual([new Segment(
        { atomic: new Rat(0n), unix: new Rat(0n) },
        { atomic: Infinity },
        new Rat(-10_000n)
      )])
    })

    it('works with the first line of real data', () => {
      expect(munge([
        [Date.UTC(1961, JAN, 1), 1.422_818_0, 37_300, 0.001_296]
      ], MODELS.STALL)).toEqual([new Segment(
        { atomic: new Rat(-283_996_798_577_182n, 1_000_000n), unix: new Rat(-283_996_800n) },
        { atomic: Infinity },
        new Rat(86_400_000_000_000n, 86_400_000_000_000n + 1_296_000n)
      )])
    })

    it('generates proper slopes', () => {
      // Note the stalls for the duration of inserted time
      expect(munge(taiData, MODELS.STALL).map(segment => segment.slope.unixPerAtomic))
        .toEqual([
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
      expect(munge(taiData, MODELS.STALL).map((segment, i, segments) => {
        if (!(i + 1 in segments)) {
          return NaN
        }

        const unix = segments[i + 1].start.unix

        // TAI as of this Unix time, at the END of the CURRENT segment
        const a = segment.slope.unixPerAtomic.nu === 0n
          ? segment.end.atomic
          : unix
            .minus(segment.start.unix)
            .divide(segment.slope.unixPerAtomic)
            .plus(segment.start.atomic)

        // TAI  of this Unix time, at the START of the NEXT segment
        const b = segments[i + 1].slope.unixPerAtomic.nu === 0n
          ? segments[i + 1].start.atomic
          : unix
            .minus(segments[i + 1].start.unix)
            .divide(segments[i + 1].slope.unixPerAtomic)
            .plus(segments[i + 1].start.atomic)

        return b.minus(a)
      })).toEqual([
        // Exact ratio of milliseconds
        new Rat(-50n, 1_000n), // 0.05 TAI seconds removed from UTC
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(-100n, 1_000n), // 0.1 TAI seconds removed from UTC
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        new Rat(0n, 1_000n),
        NaN
      ])
    })
  })

  describe('smear model', () => {
    it('works in the simplest possible case', () => {
      expect(munge([
        [Date.UTC(1970, JAN, 1), 0]
      ], MODELS.SMEAR)).toEqual([new Segment(
        { atomic: new Rat(0n), unix: new Rat(0n) },
        { atomic: Infinity },
        new Rat(1n)
      )])
    })

    it('works when one second is inserted', () => {
      expect(munge([
        [0, 0],
        [86_400_000, 1] // inserted leap second after one day
      ], MODELS.SMEAR)).toEqual([new Segment(
        { atomic: new Rat(0n), unix: new Rat(0n) },
        { atomic: new Rat(43_200n) }, // midday
        new Rat(1n) // perfectly diagonal
      ), new Segment(
        { atomic: new Rat(43_200n), unix: new Rat(43_200n) }, // midday
        { atomic: new Rat(129_601n) }, // midday
        new Rat(86_400n, 86_401n) // A full Unix day elapses, but a full TAI day plus one second elapses
      ), new Segment(
        { atomic: new Rat(129_601n), unix: new Rat(129_600n) }, // midday
        { atomic: Infinity },
        new Rat(1n) // perfectly diagonal
      )])
    })

    it('works when one second is removed', () => {
      expect(munge([
        [0, 0],
        [86_400_000, -1] // removed leap second after one day
      ], MODELS.SMEAR)).toEqual([new Segment(
        { atomic: new Rat(0n), unix: new Rat(0n) },
        { atomic: new Rat(43_200n) }, // midday
        new Rat(1n) // perfectly diagonal
      ), new Segment(
        { atomic: new Rat(43_200n), unix: new Rat(43_200n) }, // midday
        { atomic: new Rat(129_599n) }, // midday
        new Rat(86_400n, 86_399n) // A full Unix day elapses, but a full TAI day minus one second elapses
      ), new Segment(
        { atomic: new Rat(129_599n), unix: new Rat(129_600n) }, // midday
        { atomic: Infinity },
        new Rat(1n) // perfectly diagonal
      )])
    })

    it('generates proper slopes', () => {
      expect(munge(taiData, MODELS.SMEAR).map(segment => segment.slope.unixPerAtomic))
        .toEqual([
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
      expect(munge(taiData, MODELS.SMEAR).map((segment, i, segments) => {
        if (!(i + 1 in segments)) {
          return NaN
        }

        const unix = segments[i + 1].start.unix

        // TAI as of this Unix time, at the END of the CURRENT segment
        const a = unix
          .minus(segment.start.unix)
          .divide(segment.slope.unixPerAtomic)
          .plus(segment.start.atomic)

        // TAI as of this Unix time, at the START of the NEXT segment
        const b = unix
          .minus(segments[i + 1].start.unix)
          .divide(segments[i + 1].slope.unixPerAtomic)
          .plus(segments[i + 1].start.atomic)

        return b.minus(a)
      })).toEqual([
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        new Rat(0n),
        NaN
      ])
    })
  })
})

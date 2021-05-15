/* eslint-env jest */

const { taiData } = require('./tai-data')
const { munge, SEGMENT_MODELS } = require('./munge')
const { Rat } = require('./rat')
const { Segment } = require('./segment')

const JAN = 0
const DEC = 11

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
      ], SEGMENT_MODELS.OVERRUN)).toThrowError('Disordered data')
    })

    it('works in the simplest possible case', () => {
      expect(munge([
        [Date.UTC(1970, JAN, 1), 0]
      ], SEGMENT_MODELS.OVERRUN)).toEqual([new Segment(
        { atomicPicos: 0n, unixMillis: 0 },
        { atomicPicos: Infinity },
        { unixMillis: 1 },
        { atomicPicos: 1_000_000_000n }
      )])
    })

    it('works when there is an initial offset', () => {
      expect(munge([
        [7, -4]
      ], SEGMENT_MODELS.OVERRUN)).toEqual([new Segment(
        { unixMillis: 7, atomicPicos: -3_993_000_000_000n },
        { atomicPicos: Infinity },
        { unixMillis: 1 },
        { atomicPicos: 1_000_000_000n }
      )])
    })

    it('works with some millisecond-level alterations', () => {
      //                  inserted       removed
      //                       \/         \/
      // TAI:          [3][4][5][6][ 7][ 8][ 9][...]
      // Unix: [...][6][7][8][9][9][10][11][13][...]
      expect(munge([
        [-1000, -4],
        [9000, -3], // inserted leap second
        [13000, -4] // removed leap second
      ], SEGMENT_MODELS.OVERRUN)).toEqual([new Segment(
        { unixMillis: -1000, atomicPicos: -5_000_000_000_000n },
        { atomicPicos: 6_000_000_000_000n },
        { unixMillis: 1 },
        { atomicPicos: 1_000_000_000n }
      ), new Segment(
        { unixMillis: 9000, atomicPicos: 6_000_000_000_000n },
        { atomicPicos: 9_000_000_000_000n },
        { unixMillis: 1 },
        { atomicPicos: 1_000_000_000n }
      ), new Segment(
        { unixMillis: 13000, atomicPicos: 9_000_000_000_000n },
        { atomicPicos: Infinity },
        { unixMillis: 1 },
        { atomicPicos: 1_000_000_000n }
      )])
    })

    it('fails on a bad drift rate', () => {
      expect(() => munge([
        [Date.UTC(1961, JAN, 1), 1.422_818_0, 37_300, 0.001]
      ], SEGMENT_MODELS.OVERRUN)).toThrowError('Could not compute precise drift rate')
    })

    it('allows a negative ratio somehow', () => {
      // TAI runs way faster than UTC
      expect(munge([
        [Date.UTC(1970, JAN, 1), 0, 40_587, 8.640_0]
      ], SEGMENT_MODELS.OVERRUN)).toEqual([new Segment(
        { unixMillis: 0, atomicPicos: 0n },
        { atomicPicos: Infinity },
        { unixMillis: 1 },
        { atomicPicos: 1000_100_000n }
      )])

      // UTC and TAI run at identical rates
      expect(munge([
        [Date.UTC(1970, JAN, 1), 0, 40_587, 0]
      ], SEGMENT_MODELS.OVERRUN)).toEqual([new Segment(
        { unixMillis: 0, atomicPicos: 0n },
        { atomicPicos: Infinity },
        { unixMillis: 1 },
        { atomicPicos: 1_000_000_000n }
      )])

      // TAI runs way slower than UTC
      expect(munge([
        [Date.UTC(1970, JAN, 1), 0, 40_587, -8.640_0]
      ], SEGMENT_MODELS.OVERRUN)).toEqual([new Segment(
        { unixMillis: 0, atomicPicos: 0n },
        { atomicPicos: Infinity },
        { unixMillis: 1 },
        { atomicPicos: 999_900_000n }
      )])

      // TAI moves at one ten-thousandth the rate of UTC!
      // Equivalently, UTC moves 10,000 times the rate of TAI
      expect(munge([
        [Date.UTC(1970, JAN, 1), 0, 40_587, -86_400 + 8.640_0]
      ], SEGMENT_MODELS.OVERRUN)).toEqual([new Segment(
        { unixMillis: 0, atomicPicos: 0n },
        { atomicPicos: Infinity },
        { unixMillis: 1 },
        { atomicPicos: 100_000n }
      )])

      // UTC stops
      // There's no way to get this by munging finite data. The drift rate would have to be
      // infinite to get this result.

      // TAI runs backwards: wild and highly untested but sure!
      expect(munge([
        [Date.UTC(1970, JAN, 1), 0, 40_587, -86_400 - 8.640_0]
      ], SEGMENT_MODELS.OVERRUN)).toEqual([new Segment(
        { unixMillis: 0, atomicPicos: 0n },
        { atomicPicos: Infinity },
        { unixMillis: 1 },
        { atomicPicos: -100_000n }
      )])
    })

    it('works with the first line of real data', () => {
      expect(munge([
        [Date.UTC(1961, JAN, 1), 1.422_818_0, 37_300, 0.001_296]
      ], SEGMENT_MODELS.OVERRUN)).toEqual([new Segment(
        { unixMillis: -283_996_800_000, atomicPicos: -283_996_798_577_182_000_000n },
        { atomicPicos: Infinity },
        { unixMillis: 1 },
        { atomicPicos: 1000_000_015n }
      )])
    })

    it('generates proper drift rates', () => {
      expect(munge(taiData, SEGMENT_MODELS.OVERRUN).map(segment => segment.slope.unixMillisPerAtomicPico))
        .toEqual([
          new Rat(1n, 1_000_000_015n),
          new Rat(1n, 1_000_000_015n),
          new Rat(1n, 1_000_000_013n),
          new Rat(1n, 1_000_000_013n),
          new Rat(1n, 1_000_000_015n),
          new Rat(1n, 1_000_000_015n),
          new Rat(1n, 1_000_000_015n),
          new Rat(1n, 1_000_000_015n),
          new Rat(1n, 1_000_000_015n),
          new Rat(1n, 1_000_000_015n),
          new Rat(1n, 1_000_000_015n),
          new Rat(1n, 1_000_000_030n),
          new Rat(1n, 1_000_000_030n),
          new Rat(1n, 1_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(1n, 1_000_000_000n)
        ])
    })

    it('generates proper Unix time overlaps', () => {
      expect(munge(taiData, SEGMENT_MODELS.OVERRUN).map((segment, i, segments) => {
        if (!(i + 1 in segments)) {
          return NaN
        }

        const unixMillisRatio = segments[i + 1].start.unixMillisRatio

        // TAI picoseconds as of this Unix time, at the END of the CURRENT segment
        const a = unixMillisRatio
          .minus(segment.start.unixMillisRatio)
          .divide(segment.slope.unixMillisPerAtomicPico)
          .plus(segment.start.atomicPicosRatio)

        // TAI picoseconds as of this Unix time, at the START of the NEXT segment
        const b = unixMillisRatio
          .minus(segments[i + 1].start.unixMillisRatio)
          .divide(segments[i + 1].slope.unixMillisPerAtomicPico)
          .plus(segments[i + 1].start.atomicPicosRatio)

        return b.minus(a).trunc()
      })).toEqual([
        -50_000_000_000n,
        0n,
        100_000_000_000n,
        0n,
        100_000_000_000n,
        100_000_000_000n,
        100_000_000_000n,
        100_000_000_000n,
        100_000_000_000n,
        100_000_000_000n,
        0n,
        -100_000_000_000n,
        107_758_000_000n,
        1_000_000_000_000n,
        1_000_000_000_000n,
        1_000_000_000_000n,
        1_000_000_000_000n,
        1_000_000_000_000n,
        1_000_000_000_000n,
        1_000_000_000_000n,
        1_000_000_000_000n,
        1_000_000_000_000n,
        1_000_000_000_000n,
        1_000_000_000_000n,
        1_000_000_000_000n,
        1_000_000_000_000n,
        1_000_000_000_000n,
        1_000_000_000_000n,
        1_000_000_000_000n,
        1_000_000_000_000n,
        1_000_000_000_000n,
        1_000_000_000_000n,
        1_000_000_000_000n,
        1_000_000_000_000n,
        1_000_000_000_000n,
        1_000_000_000_000n,
        1_000_000_000_000n,
        1_000_000_000_000n,
        1_000_000_000_000n,
        1_000_000_000_000n,
        NaN // `Infinity - Infinity`
      ])
    })

    describe('when unixMillis converts to an atomicPicos which fits but an atomicMillis which does not', () => {
      it('at the start of the ray', () => {
        expect(munge([
          [Date.UTC(1970, JAN, 1, 0, 0, 0, 1), -0.0001]
        ], SEGMENT_MODELS.OVERRUN)).toEqual([new Segment(
          { unixMillis: 1, atomicPicos: 900_000_000n }, // ray start intentionally doesn't include TAI epoch
          { atomicPicos: Infinity },
          { unixMillis: 1 },
          { atomicPicos: 1_000_000_000n }
        )])
      })

      it('at the end of the ray', () => {
        // first ray's end intentionally doesn't include TAI epoch
        expect(munge([
          [Date.UTC(1969, DEC, 31, 23, 59, 59, 999), 0.0001],
          [Date.UTC(1970, JAN, 1, 0, 0, 0, 1), -0.0011]
        ], SEGMENT_MODELS.OVERRUN)).toEqual([new Segment(
          { unixMillis: -1, atomicPicos: -900_000_000n },
          { atomicPicos: -100_000_000n },
          { unixMillis: 1 },
          { atomicPicos: 1_000_000_000n }
        ), new Segment(
          { unixMillis: 1, atomicPicos: -100_000_000n },
          { atomicPicos: Infinity },
          { unixMillis: 1 },
          { atomicPicos: 1_000_000_000n }
        )])
      })
    })
  })

  describe('break model', () => {
    it('works in the simplest possible case', () => {
      expect(munge([
        [Date.UTC(1970, JAN, 1), 0]
      ], SEGMENT_MODELS.BREAK)).toEqual([new Segment(
        { atomicPicos: 0n, unixMillis: 0 },
        { atomicPicos: Infinity },
        { unixMillis: 1 },
        { atomicPicos: 1_000_000_000n }
      )])
    })

    it('works with some millisecond-level alterations', () => {
      //                  inserted       removed
      //                       \/         \/
      // TAI:          [3][4][5][6][ 7][ 8][ 9][...]
      // Unix: [...][6][7][8][9][9][10][11][13][...]
      expect(munge([
        [-1000, -4],
        [9000, -3], // inserted leap second
        [13000, -4] // removed leap second
      ], SEGMENT_MODELS.BREAK)).toEqual([new Segment(
        { unixMillis: -1000, atomicPicos: -5_000_000_000_000n },
        { atomicPicos: 5_000_000_000_000n },
        { unixMillis: 1 },
        { atomicPicos: 1_000_000_000n }
      ), new Segment(
        // this segment starts a full TAI second after the previous segment ended
        { unixMillis: 9000, atomicPicos: 6_000_000_000_000n },
        { atomicPicos: 9_000_000_000_000n },
        { unixMillis: 1 },
        { atomicPicos: 1_000_000_000n }
      ), new Segment(
        { unixMillis: 13000, atomicPicos: 9_000_000_000_000n },
        { atomicPicos: Infinity },
        { unixMillis: 1 },
        { atomicPicos: 1_000_000_000n }
      )])
    })
  })

  describe('stall model', () => {
    it('disallows disordered rays', () => {
      expect(() => munge([
        [Date.UTC(1979, DEC, 9), 0],
        [Date.UTC(1970, JAN, 1), 0]
      ], SEGMENT_MODELS.STALL)).toThrowError('Disordered data')
    })

    it('works in the simplest possible case', () => {
      expect(munge([
        [Date.UTC(1970, JAN, 1), 0]
      ], SEGMENT_MODELS.STALL)).toEqual([new Segment(
        { atomicPicos: 0n, unixMillis: 0 },
        { atomicPicos: Infinity },
        { unixMillis: 1 },
        { atomicPicos: 1_000_000_000n }
      )])
    })

    it('works when there is an initial offset', () => {
      expect(munge([
        [7, -4]
      ], SEGMENT_MODELS.STALL)).toEqual([new Segment(
        { unixMillis: 7, atomicPicos: -3_993_000_000_000n },
        { atomicPicos: Infinity },
        { unixMillis: 1 },
        { atomicPicos: 1_000_000_000n }
      )])
    })

    it('works with some millisecond-level alterations', () => {
      //                  inserted       removed
      //                       \/         \/
      // TAI:          [3][4][5][6][ 7][ 8][ 9][...]
      // Unix: [...][6][7][8][9][9][10][11][13][...]
      expect(munge([
        [-1000, -4],
        [9000, -3], // inserted leap second
        [13000, -4] // removed leap second
      ], SEGMENT_MODELS.STALL)).toEqual([new Segment(
        { unixMillis: -1000, atomicPicos: -5_000_000_000_000n },
        { atomicPicos: 5_000_000_000_000n },
        { unixMillis: 1 },
        { atomicPicos: 1_000_000_000n }
      ), new Segment(
        // Stall segment inserted here
        { unixMillis: 9000, atomicPicos: 5_000_000_000_000n },
        { atomicPicos: 6_000_000_000_000n },
        { unixMillis: 0 },
        { atomicPicos: 1_000_000_000_000n }
      ), new Segment(
        { unixMillis: 9000, atomicPicos: 6_000_000_000_000n },
        { atomicPicos: 9_000_000_000_000n },
        { unixMillis: 1 },
        { atomicPicos: 1_000_000_000n }
      ), new Segment(
        { unixMillis: 13000, atomicPicos: 9_000_000_000_000n },
        { atomicPicos: Infinity },
        { unixMillis: 1 },
        { atomicPicos: 1_000_000_000n }
      )])
    })

    it('allows retroactive stalls??', () => {
      expect(munge([
        [0, 0],
        [1000, 1],
        [500, 2.5]
      ], SEGMENT_MODELS.STALL)).toEqual([new Segment(
        { unixMillis: 0, atomicPicos: 0n },
        { atomicPicos: 1_000_000_000_000n },
        { unixMillis: 1 },
        { atomicPicos: 1_000_000_000n }
      ), new Segment(
        // First stall
        { unixMillis: 1000, atomicPicos: 1_000_000_000_000n },
        { atomicPicos: 2_000_000_000_000n },
        { unixMillis: 0 },
        { atomicPicos: 1_000_000_000_000n }
      ), new Segment(
        // Yes this segment now ends before it begins
        { unixMillis: 1000, atomicPicos: 2_000_000_000_000n },
        { atomicPicos: 1_500_000_000_000n },
        { unixMillis: 1 },
        { atomicPicos: 1_000_000_000n }
      ), new Segment(
        // Second stall
        { unixMillis: 500, atomicPicos: 1_500_000_000_000n },
        { atomicPicos: 3_000_000_000_000n },
        { unixMillis: 0 },
        { atomicPicos: 1_500_000_000_000n }
      ), new Segment(
        { unixMillis: 500, atomicPicos: 3_000_000_000_000n },
        { atomicPicos: Infinity },
        { unixMillis: 1 },
        { atomicPicos: 1_000_000_000n }
      )])
    })

    it('allows retroactive breaks??', () => {
      expect(munge([
        [0, 0],
        [1000, 1],
        [500, 2.5]
      ], SEGMENT_MODELS.BREAK)).toEqual([new Segment(
        { unixMillis: 0, atomicPicos: 0n },
        { atomicPicos: 1_000_000_000_000n },
        { unixMillis: 1 },
        { atomicPicos: 1_000_000_000n }
      ), new Segment(
        // Yes this segment now ends before it begins
        { unixMillis: 1000, atomicPicos: 2_000_000_000_000n },
        { atomicPicos: 1_500_000_000_000n },
        { unixMillis: 1 },
        { atomicPicos: 1_000_000_000n }
      ), new Segment(
        { unixMillis: 500, atomicPicos: 3_000_000_000_000n },
        { atomicPicos: Infinity },
        { unixMillis: 1 },
        { atomicPicos: 1_000_000_000n }
      )])
    })

    it('fails on a bad drift rate', () => {
      expect(() => munge([
        [Date.UTC(1961, JAN, 1), 1.422_818_0, 37_300, 0.001]
      ], SEGMENT_MODELS.STALL)).toThrowError('Could not compute precise drift rate')
    })

    it('allows a negative ratio somehow', () => {
      // TAI runs way faster than UTC
      expect(munge([
        [Date.UTC(1970, JAN, 1), 0, 40_587, 8.640_0]
      ], SEGMENT_MODELS.STALL)).toEqual([new Segment(
        { unixMillis: 0, atomicPicos: 0n },
        { atomicPicos: Infinity },
        { unixMillis: 1 },
        { atomicPicos: 1000_100_000n }
      )])

      // UTC and TAI run at identical rates
      expect(munge([
        [Date.UTC(1970, JAN, 1), 0, 40_587, 0]
      ], SEGMENT_MODELS.STALL)).toEqual([new Segment(
        { unixMillis: 0, atomicPicos: 0n },
        { atomicPicos: Infinity },
        { unixMillis: 1 },
        { atomicPicos: 1_000_000_000n }
      )])

      // TAI runs way slower than UTC
      expect(munge([
        [Date.UTC(1970, JAN, 1), 0, 40_587, -8.640_0]
      ], SEGMENT_MODELS.STALL)).toEqual([new Segment(
        { unixMillis: 0, atomicPicos: 0n },
        { atomicPicos: Infinity },
        { unixMillis: 1 },
        { atomicPicos: 999_900_000n }
      )])

      // TAI moves at one ten-thousandth the rate of UTC!
      // Equivalently, UTC moves 10,000 times the rate of TAI
      expect(munge([
        [Date.UTC(1970, JAN, 1), 0, 40_587, -86_400 + 8.640_0]
      ], SEGMENT_MODELS.STALL)).toEqual([new Segment(
        { unixMillis: 0, atomicPicos: 0n },
        { atomicPicos: Infinity },
        { unixMillis: 1 },
        { atomicPicos: 100_000n }
      )])

      // UTC stops
      // There's no way to get this by munging finite data. The drift rate would have to be
      // infinite to get this result.

      // TAI runs backwards: wild and highly untested but sure!
      expect(munge([
        [Date.UTC(1970, JAN, 1), 0, 40_587, -86_400 - 8.640_0]
      ], SEGMENT_MODELS.STALL)).toEqual([new Segment(
        { unixMillis: 0, atomicPicos: 0n },
        { atomicPicos: Infinity },
        { unixMillis: 1 },
        { atomicPicos: -100_000n }
      )])
    })

    it('works with the first line of real data', () => {
      expect(munge([
        [Date.UTC(1961, JAN, 1), 1.422_818_0, 37_300, 0.001_296]
      ], SEGMENT_MODELS.STALL)).toEqual([new Segment(
        { unixMillis: -283_996_800_000, atomicPicos: -283_996_798_577_182_000_000n },
        { atomicPicos: Infinity },
        { unixMillis: 1 },
        { atomicPicos: 1000_000_015n }
      )])
    })

    it('generates proper drift rates', () => {
      // Note the stalls for the duration of inserted time
      expect(munge(taiData, SEGMENT_MODELS.STALL).map(segment => segment.slope.unixMillisPerAtomicPico))
        .toEqual([
          new Rat(1n, 1_000_000_015n),
          new Rat(1n, 1_000_000_015n),
          new Rat(1n, 1_000_000_013n),
          new Rat(0n, 100_000_000_000n),
          new Rat(1n, 1_000_000_013n),
          new Rat(1n, 1_000_000_015n),
          new Rat(0n, 100_000_000_000n),
          new Rat(1n, 1_000_000_015n),
          new Rat(0n, 100_000_000_000n),
          new Rat(1n, 1_000_000_015n),
          new Rat(0n, 100_000_000_000n),
          new Rat(1n, 1_000_000_015n),
          new Rat(0n, 100_000_000_000n),
          new Rat(1n, 1_000_000_015n),
          new Rat(0n, 100_000_000_000n),
          new Rat(1n, 1_000_000_015n),
          new Rat(0n, 100_000_000_000n),
          new Rat(1n, 1_000_000_015n),
          new Rat(1n, 1_000_000_030n),
          new Rat(1n, 1_000_000_030n),
          new Rat(0n, 107_758_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(0n, 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(0n, 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(0n, 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(0n, 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(0n, 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(0n, 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(0n, 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(0n, 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(0n, 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(0n, 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(0n, 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(0n, 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(0n, 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(0n, 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(0n, 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(0n, 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(0n, 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(0n, 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(0n, 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(0n, 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(0n, 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(0n, 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(0n, 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(0n, 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(0n, 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(0n, 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(0n, 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n)
        ])
    })

    it('generates proper overlaps', () => {
      // See how all inserted time discontinuities disappear with this model,
      // but the removed time remains
      expect(munge(taiData, SEGMENT_MODELS.STALL).map((segment, i, segments) => {
        if (!(i + 1 in segments)) {
          return NaN
        }

        const unixMillisRatio = segments[i + 1].start.unixMillisRatio

        // TAI picoseconds as of this Unix time, at the END of the CURRENT segment
        const a = segment.slope.unixMillisPerAtomicPico.nu === 0n
          ? segment.end.atomicPicosRatio
          : unixMillisRatio
            .minus(segment.start.unixMillisRatio)
            .divide(segment.slope.unixMillisPerAtomicPico)
            .plus(segment.start.atomicPicosRatio)

        // TAI picoseconds as of this Unix time, at the START of the NEXT segment
        const b = segments[i + 1].slope.unixMillisPerAtomicPico.nu === 0n
          ? segments[i + 1].start.atomicPicosRatio
          : unixMillisRatio
            .minus(segments[i + 1].start.unixMillisRatio)
            .divide(segments[i + 1].slope.unixMillisPerAtomicPico)
            .plus(segments[i + 1].start.atomicPicosRatio)

        return b.minus(a).trunc()
      })).toEqual([
        -50_000_000_000n, // 0.05 TAI seconds removed from UTC
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        -100_000_000_000n, // 0.1 TAI seconds removed from UTC
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        NaN
      ])
    })

    describe('two inserted leap seconds', () => {
      expect(munge([
        [0, 0],
        [1000, 1],
        [1000, 2]
      ], SEGMENT_MODELS.STALL)).toEqual([new Segment(
        { atomicPicos: 0n, unixMillis: 0 },
        { atomicPicos: 1_000_000_000_000n },
        { unixMillis: 1 },
        { atomicPicos: 1_000_000_000n }
      ), new Segment(
        { atomicPicos: 1_000_000_000_000n, unixMillis: 1000 },
        { atomicPicos: 2_000_000_000_000n },
        { unixMillis: 0 },
        { atomicPicos: 1_000_000_000_000n }
      ), new Segment(
        // Zero-length segment between the two stall
        { atomicPicos: 2_000_000_000_000n, unixMillis: 1000 },
        { atomicPicos: 2_000_000_000_000n },
        { unixMillis: 1 },
        { atomicPicos: 1_000_000_000n }
      ), new Segment(
        { atomicPicos: 2_000_000_000_000n, unixMillis: 1000 },
        { atomicPicos: 3_000_000_000_000n },
        { unixMillis: 0 },
        { atomicPicos: 1_000_000_000_000n }
      ), new Segment(
        { atomicPicos: 3_000_000_000_000n, unixMillis: 1000 },
        { atomicPicos: Infinity },
        { unixMillis: 1 },
        { atomicPicos: 1_000_000_000n }
      )])
    })
  })

  describe('smear model', () => {
    it('works in the simplest possible case', () => {
      expect(munge([
        [Date.UTC(1970, JAN, 1), 0]
      ], SEGMENT_MODELS.SMEAR)).toEqual([new Segment(
        { atomicPicos: 0n, unixMillis: 0 },
        { atomicPicos: Infinity },
        { unixMillis: 1 },
        { atomicPicos: 1_000_000_000n }
      )])
    })

    it('works when one second is inserted', () => {
      expect(munge([
        [0, 0],
        [86_400_000, 1] // inserted leap second after one day
      ], SEGMENT_MODELS.SMEAR)).toEqual([new Segment(
        { atomicPicos: 0n, unixMillis: 0 },
        { atomicPicos: 43_200_000_000_000_000n }, // midday

        // perfectly diagonal
        { unixMillis: 1 },
        { atomicPicos: 1_000_000_000n }
      ), new Segment(
        { atomicPicos: 43_200_000_000_000_000n, unixMillis: 43_200_000 }, // midday
        { atomicPicos: 129_601_000_000_000_000n }, // midday

        // A full Unix day elapses, but a full TAI day plus one second elapses
        { unixMillis: 86_400_000 },
        { atomicPicos: 86_401_000_000_000_000n }
      ), new Segment(
        { atomicPicos: 129_601_000_000_000_000n, unixMillis: 129_600_000 }, // midday
        { atomicPicos: Infinity },

        // perfectly diagonal
        { unixMillis: 1 },
        { atomicPicos: 1_000_000_000n }
      )])
    })

    it('works when one second is removed', () => {
      expect(munge([
        [0, 0],
        [86_400_000, -1] // removed leap second after one day
      ], SEGMENT_MODELS.SMEAR)).toEqual([new Segment(
        { atomicPicos: 0n, unixMillis: 0 },
        { atomicPicos: 43_200_000_000_000_000n }, // midday

        // perfectly diagonal
        { unixMillis: 1 },
        { atomicPicos: 1_000_000_000n }
      ), new Segment(
        { atomicPicos: 43_200_000_000_000_000n, unixMillis: 43_200_000 }, // midday
        { atomicPicos: 129_599_000_000_000_000n }, // midday

        // A full Unix day elapses, but a full TAI day minus one second elapses
        { unixMillis: 86_400_000 },
        { atomicPicos: 86_399_000_000_000_000n }
      ), new Segment(
        { atomicPicos: 129_599_000_000_000_000n, unixMillis: 129_600_000 }, // midday
        { atomicPicos: Infinity },

        // perfectly diagonal
        { unixMillis: 1 },
        { atomicPicos: 1_000_000_000n }
      )])
    })

    it('generates proper drift rates', () => {
      expect(munge(taiData, SEGMENT_MODELS.SMEAR).map(segment => segment.slope.unixMillisPerAtomicPico))
        .toEqual([
          // During Unix-day-long smears, elapsed atomic time is a full day PLUS daily offset
          // PLUS inserted time
          new Rat(1n, 1_000_000_015n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 1_296_000_000n - 50_000_000_000n),
          new Rat(1n, 1_000_000_015n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 1_209_600_000n + 0n),
          new Rat(1n, 1_000_000_013n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 1_123_200_000n + 100_000_000_000n),
          new Rat(1n, 1_000_000_013n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 1_209_600_000n + 0n),
          new Rat(1n, 1_000_000_015n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 1_296_000_000n + 100_000_000_000n),
          new Rat(1n, 1_000_000_015n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 1_296_000_000n + 100_000_000_000n),
          new Rat(1n, 1_000_000_015n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 1_296_000_000n + 100_000_000_000n),
          new Rat(1n, 1_000_000_015n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 1_296_000_000n + 100_000_000_000n),
          new Rat(1n, 1_000_000_015n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 1_296_000_000n + 100_000_000_000n),
          new Rat(1n, 1_000_000_015n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 1_296_000_000n + 100_000_000_000n),
          new Rat(1n, 1_000_000_015n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 1_944_000_000n + 0n),
          new Rat(1n, 1_000_000_030n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 2_592_000_000n - 100_000_000_000n),
          new Rat(1n, 1_000_000_030n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 0n + 109_054_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 0n + 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 0n + 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 0n + 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 0n + 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 0n + 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 0n + 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 0n + 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 0n + 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 0n + 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 0n + 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 0n + 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 0n + 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 0n + 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 0n + 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 0n + 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 0n + 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 0n + 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 0n + 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 0n + 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 0n + 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 0n + 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 0n + 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 0n + 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 0n + 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 0n + 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 0n + 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n),
          new Rat(86_400_000n, 86_400_000_000_000_000n + 0n + 1_000_000_000_000n),
          new Rat(1n, 1_000_000_000n)
        ])
    })

    it('generates proper overlaps', () => {
      // Due to smearing, there are NEVER overlaps, no removed or inserted time remains
      expect(munge(taiData, SEGMENT_MODELS.SMEAR).map((segment, i, segments) => {
        if (!(i + 1 in segments)) {
          return NaN
        }

        const unixMillisRatio = segments[i + 1].start.unixMillisRatio

        // TAI picoseconds as of this Unix time, at the END of the CURRENT segment
        const a = unixMillisRatio
          .minus(segment.start.unixMillisRatio)
          .divide(segment.slope.unixMillisPerAtomicPico)
          .plus(segment.start.atomicPicosRatio)

        // TAI picoseconds as of this Unix time, at the START of the NEXT segment
        const b = unixMillisRatio
          .minus(segments[i + 1].start.unixMillisRatio)
          .divide(segments[i + 1].slope.unixMillisPerAtomicPico)
          .plus(segments[i + 1].start.atomicPicosRatio)

        return b.minus(a).trunc()
      })).toEqual([
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        NaN
      ])
    })
  })
})

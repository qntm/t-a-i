/* eslint-env jest */

const taiData = require('./tai-data')
const munge = require('./munge')
const { Rat } = require('./rat')
const { Segment } = require('./segment')

const JAN = 0
const DEC = 11

describe('munge', () => {
  it('disallows disordered rays', () => {
    expect(() => munge([
      [Date.UTC(1979, DEC, 9), 0],
      [Date.UTC(1970, JAN, 1), 0]
    ])).toThrowError('Disordered data')
  })

  it('works in the simplest possible case', () => {
    expect(munge([
      [Date.UTC(1970, JAN, 1), 0]
    ])).toEqual([new Segment(
      { atomicPicos: 0n, unixMillis: 0 },
      { atomicPicos: Infinity },
      { unixMillis: 1 },
      { atomicPicos: 1000_000_000n }
    )])
  })

  it('works when there is an initial offset', () => {
    expect(munge([
      [7, -4]
    ])).toEqual([new Segment(
      { unixMillis: 7, atomicPicos: -3_993_000_000_000n },
      { atomicPicos: Infinity },
      { unixMillis: 1 },
      { atomicPicos: 1000_000_000n }
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
    ])).toEqual([new Segment(
      { unixMillis: -1000, atomicPicos: -5_000_000_000_000n },
      { atomicPicos: 6_000_000_000_000n },
      { unixMillis: 1 },
      { atomicPicos: 1000_000_000n }
    ), new Segment(
      { unixMillis: 9000, atomicPicos: 6_000_000_000_000n },
      { atomicPicos: 9_000_000_000_000n },
      { unixMillis: 1 },
      { atomicPicos: 1000_000_000n }
    ), new Segment(
      { unixMillis: 13000, atomicPicos: 9_000_000_000_000n },
      { atomicPicos: Infinity },
      { unixMillis: 1 },
      { atomicPicos: 1000_000_000n }
    )])
  })

  it('fails on a bad drift rate', () => {
    expect(() => munge([
      [Date.UTC(1961, JAN, 1), 1.422_818_0, 37_300, 0.001]
    ])).toThrowError('Could not compute precise drift rate')
  })

  it('allows a negative ratio somehow', () => {
    // TAI runs way faster than UTC
    expect(munge([
      [Date.UTC(1970, JAN, 1), 0, 40_587, 8.640_0]
    ])).toEqual([new Segment(
      { unixMillis: 0, atomicPicos: 0n },
      { atomicPicos: Infinity },
      { unixMillis: 1 },
      { atomicPicos: 1000_100_000n }
    )])

    // UTC and TAI run at identical rates
    expect(munge([
      [Date.UTC(1970, JAN, 1), 0, 40_587, 0]
    ])).toEqual([new Segment(
      { unixMillis: 0, atomicPicos: 0n },
      { atomicPicos: Infinity },
      { unixMillis: 1 },
      { atomicPicos: 1000_000_000n }
    )])

    // TAI runs way slower than UTC
    expect(munge([
      [Date.UTC(1970, JAN, 1), 0, 40_587, -8.640_0]
    ])).toEqual([new Segment(
      { unixMillis: 0, atomicPicos: 0n },
      { atomicPicos: Infinity },
      { unixMillis: 1 },
      { atomicPicos: 999_900_000n }
    )])

    // TAI moves at one ten-thousandth the rate of UTC!
    // Equivalently, UTC moves 10,000 times the rate of TAI
    expect(munge([
      [Date.UTC(1970, JAN, 1), 0, 40_587, -86_400 + 8.640_0]
    ])).toEqual([new Segment(
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
    ])).toEqual([new Segment(
      { unixMillis: 0, atomicPicos: 0n },
      { atomicPicos: Infinity },
      { unixMillis: 1 },
      { atomicPicos: -100_000n }
    )])
  })

  it('works with the first line of real data', () => {
    expect(munge([
      [Date.UTC(1961, JAN, 1), 1.422_818_0, 37_300, 0.001_296]
    ])).toEqual([new Segment(
      { unixMillis: -283_996_800_000, atomicPicos: -283_996_798_577_182_000_000n },
      { atomicPicos: Infinity },
      { unixMillis: 1 },
      { atomicPicos: 1000_000_015n }
    )])
  })

  it('generates proper drift rates', () => {
    expect(munge(taiData).map(segment => segment.slope.unixMillisPerAtomicPico))
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

  it('generates proper overlaps', () => {
    expect(munge(taiData).map((segment, i, segments) =>
      // ray end minus overlap start
      i + 1 in segments
        ? (
            segments[i + 1].start.atomicPicosRatio.trunc() -
            segment.unixMillisToAtomicPicos(segments[i + 1].start.unixMillisRatio.trunc())
          )
        : NaN
    )).toEqual([
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
})

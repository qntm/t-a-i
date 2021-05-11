/* eslint-env jest */

const taiData = require('./tai-data')
const munge = require('./munge')

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
    ])).toEqual([{
      start: {
        atomicPicos: 0n,
        unixMillis: 0
      },
      end: {
        atomicPicos: Infinity
      },
      dx: { atomicPicos: 1000_000_000n },
      dy: { unixMillis: 1 }
    }])
  })

  it('works when there is an initial offset', () => {
    expect(munge([
      [7, -4]
    ])).toEqual([{
      start: {
        unixMillis: 7,
        atomicPicos: -3_993_000_000_000n
      },
      end: {
        atomicPicos: Infinity
      },
      dx: { atomicPicos: 1000_000_000n },
      dy: { unixMillis: 1 }
    }])
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
    ])).toEqual([{
      start: {
        unixMillis: -1000,
        atomicPicos: -5_000_000_000_000n
      },
      end: {
        atomicPicos: 6_000_000_000_000n
      },
      dx: { atomicPicos: 1000_000_000n },
      dy: { unixMillis: 1 }
    }, {
      start: {
        unixMillis: 9000,
        atomicPicos: 6_000_000_000_000n
      },
      end: {
        atomicPicos: 9_000_000_000_000n
      },
      dx: { atomicPicos: 1000_000_000n },
      dy: { unixMillis: 1 }
    }, {
      start: {
        unixMillis: 13000,
        atomicPicos: 9_000_000_000_000n
      },
      end: {
        atomicPicos: Infinity
      },
      dx: { atomicPicos: 1000_000_000n },
      dy: { unixMillis: 1 }
    }])
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
    ])).toEqual([{
      start: { unixMillis: 0, atomicPicos: 0n },
      end: { atomicPicos: Infinity },
      dx: { atomicPicos: 1000_100_000n },
      dy: { unixMillis: 1 }
    }])

    // UTC and TAI run at identical rates
    expect(munge([
      [Date.UTC(1970, JAN, 1), 0, 40_587, 0]
    ])).toEqual([{
      start: { unixMillis: 0, atomicPicos: 0n },
      end: { atomicPicos: Infinity },
      dx: { atomicPicos: 1000_000_000n },
      dy: { unixMillis: 1 }
    }])

    // TAI runs way slower than UTC
    expect(munge([
      [Date.UTC(1970, JAN, 1), 0, 40_587, -8.640_0]
    ])).toEqual([{
      start: { unixMillis: 0, atomicPicos: 0n },
      end: { atomicPicos: Infinity },
      dx: { atomicPicos: 999_900_000n },
      dy: { unixMillis: 1 }
    }])

    // TAI moves at one ten-thousandth the rate of UTC!
    // Equivalently, UTC moves 10,000 times the rate of TAI
    expect(munge([
      [Date.UTC(1970, JAN, 1), 0, 40_587, -86_400 + 8.640_0]
    ])).toEqual([{
      start: { unixMillis: 0, atomicPicos: 0n },
      end: { atomicPicos: Infinity },
      dx: { atomicPicos: 100_000n },
      dy: { unixMillis: 1 }
    }])

    // TAI does not move at ALL
    // Equivalently, UTC moves infinitely quickly.
    // Technically we do still allow this, although conversions from TAI to UTC cause divide-by-
    // zero errors.
    expect(munge([
      [Date.UTC(1970, JAN, 1), 0, 40_587, -86_400]
    ])).toEqual([{
      start: { unixMillis: 0, atomicPicos: 0n },
      end: { atomicPicos: Infinity },
      dx: { atomicPicos: 0n },
      dy: { unixMillis: 1 }
    }])

    // TAI runs backwards: wild and highly untested but sure!
    expect(munge([
      [Date.UTC(1970, JAN, 1), 0, 40_587, -86_400 - 8.640_0]
    ])).toEqual([{
      start: {
        unixMillis: 0,
        atomicPicos: 0n
      },
      end: { atomicPicos: Infinity },
      dx: { atomicPicos: -100_000n },
      dy: { unixMillis: 1 }
    }])
  })

  it('works with the first line of real data', () => {
    expect(munge([
      [Date.UTC(1961, JAN, 1), 1.422_818_0, 37_300, 0.001_296]
    ])).toEqual([{
      start: {
        unixMillis: -283_996_800_000,
        atomicPicos: -283_996_798_577_182_000_000n
      },
      end: {
        atomicPicos: Infinity
      },
      dx: { atomicPicos: 1000_000_015n },
      dy: { unixMillis: 1 }
    }])
  })

  it('generates proper drift rates', () => {
    expect(munge(taiData).map(segment => segment.dx.atomicPicos)).toEqual([
      1_000_000_015n,
      1_000_000_015n,
      1_000_000_013n,
      1_000_000_013n,
      1_000_000_015n,
      1_000_000_015n,
      1_000_000_015n,
      1_000_000_015n,
      1_000_000_015n,
      1_000_000_015n,
      1_000_000_015n,
      1_000_000_030n,
      1_000_000_030n,
      1_000_000_000n,
      1_000_000_000n,
      1_000_000_000n,
      1_000_000_000n,
      1_000_000_000n,
      1_000_000_000n,
      1_000_000_000n,
      1_000_000_000n,
      1_000_000_000n,
      1_000_000_000n,
      1_000_000_000n,
      1_000_000_000n,
      1_000_000_000n,
      1_000_000_000n,
      1_000_000_000n,
      1_000_000_000n,
      1_000_000_000n,
      1_000_000_000n,
      1_000_000_000n,
      1_000_000_000n,
      1_000_000_000n,
      1_000_000_000n,
      1_000_000_000n,
      1_000_000_000n,
      1_000_000_000n,
      1_000_000_000n,
      1_000_000_000n,
      1_000_000_000n
    ])
  })

  it('generates proper overlaps', () => {
    expect(munge(taiData).map((segment, i, segments) =>
      // ray end minus overlap start
      i + 1 in segments
        ? (
            segments[i + 1].start.atomicPicos -
            segment.unixMillisToAtomicPicos(segments[i + 1].start.unixMillis)
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

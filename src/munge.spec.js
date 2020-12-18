/* eslint-env jest */

const taiData = require('./tai-data')
const munge = require('./munge')

const JAN = 0

describe('munge', () => {
  it('works in the simplest possible case', () => {
    expect(munge([
      [Date.UTC(1970, JAN, 1), 0]
    ])).toEqual([{
      start: {
        atomicPicos: 0n,
        unixMillis: 0
      },
      ratio: {
        atomicPicosPerUnixMilli: 1000_000_000n
      },
      offsetAtUnixEpoch: {
        atomicPicos: 0n
      }
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
      ratio: {
        atomicPicosPerUnixMilli: 1_000_000_000n
      },
      offsetAtUnixEpoch: {
        atomicPicos: -4_000_000_000_000n
      }
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
      ratio: {
        atomicPicosPerUnixMilli: 1_000_000_000n
      },
      offsetAtUnixEpoch: {
        atomicPicos: -4_000_000_000_000n
      }
    }, {
      start: {
        unixMillis: 9000,
        atomicPicos: 6_000_000_000_000n
      },
      ratio: {
        atomicPicosPerUnixMilli: 1_000_000_000n
      },
      offsetAtUnixEpoch: {
        atomicPicos: -3_000_000_000_000n
      }
    }, {
      start: {
        unixMillis: 13000,
        atomicPicos: 9_000_000_000_000n
      },
      ratio: {
        atomicPicosPerUnixMilli: 1_000_000_000n
      },
      offsetAtUnixEpoch: {
        atomicPicos: -4_000_000_000_000n
      }
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
      ratio: { atomicPicosPerUnixMilli: 1_000_100_000n },
      offsetAtUnixEpoch: { atomicPicos: 0n }
    }])

    // UTC and TAI run at identical rates
    expect(munge([
      [Date.UTC(1970, JAN, 1), 0, 40_587, 0]
    ])).toEqual([{
      start: { unixMillis: 0, atomicPicos: 0n },
      ratio: { atomicPicosPerUnixMilli: 1_000_000_000n },
      offsetAtUnixEpoch: { atomicPicos: 0n }
    }])

    // TAI runs way slower than UTC
    expect(munge([
      [Date.UTC(1970, JAN, 1), 0, 40_587, -8.640_0]
    ])).toEqual([{
      start: { unixMillis: 0, atomicPicos: 0n },
      ratio: { atomicPicosPerUnixMilli: 999_900_000n },
      offsetAtUnixEpoch: { atomicPicos: 0n }
    }])

    // TAI moves at one ten-thousandth the rate of UTC!
    // Equivalently, UTC moves 10,000 times the rate of TAI
    expect(munge([
      [Date.UTC(1970, JAN, 1), 0, 40_587, -86_400 + 8.640_0]
    ])).toEqual([{
      start: { unixMillis: 0, atomicPicos: 0n },
      ratio: { atomicPicosPerUnixMilli: 100_000n },
      offsetAtUnixEpoch: { atomicPicos: 0n }
    }])

    // TAI does not move at ALL
    // Equivalently, UTC moves infinitely quickly.
    // Technically we do still allow this, although conversions from TAI to UTC cause divide-by-
    // zero errors.
    expect(munge([
      [Date.UTC(1970, JAN, 1), 0, 40_587, -86_400]
    ])).toEqual([{
      start: { unixMillis: 0, atomicPicos: 0n },
      ratio: { atomicPicosPerUnixMilli: 0n },
      offsetAtUnixEpoch: { atomicPicos: 0n }
    }])

    // TAI runs backwards: wild and highly untested but sure!
    expect(munge([
      [Date.UTC(1970, JAN, 1), 0, 40_587, -86_400 - 8.640_0]
    ])).toEqual([{
      start: { unixMillis: 0, atomicPicos: 0n },
      ratio: { atomicPicosPerUnixMilli: -100_000n },
      offsetAtUnixEpoch: { atomicPicos: 0n }
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
      ratio: {
        atomicPicosPerUnixMilli: 1_000_000_015n
      },
      offsetAtUnixEpoch: {
        atomicPicos: 5_682_770_000_000n
      }
    }])
  })

  it('generates proper offsets at the Unix epoch', () => {
    expect(munge(taiData).map(block => block.offsetAtUnixEpoch.atomicPicos)).toEqual([
      5_682_770_000_000n,
      5_632_770_000_000n,
      5_127_848_400_000n,
      5_227_848_400_000n,
      5_606_626_000_000n,
      5_706_626_000_000n,
      5_806_626_000_000n,
      5_906_626_000_000n,
      6_006_626_000_000n,
      6_106_626_000_000n,
      6_206_626_000_000n,
      8_100_082_000_000n,
      8_000_082_000_000n,
      10_000_000_000_000n,
      11_000_000_000_000n,
      12_000_000_000_000n,
      13_000_000_000_000n,
      14_000_000_000_000n,
      15_000_000_000_000n,
      16_000_000_000_000n,
      17_000_000_000_000n,
      18_000_000_000_000n,
      19_000_000_000_000n,
      20_000_000_000_000n,
      21_000_000_000_000n,
      22_000_000_000_000n,
      23_000_000_000_000n,
      24_000_000_000_000n,
      25_000_000_000_000n,
      26_000_000_000_000n,
      27_000_000_000_000n,
      28_000_000_000_000n,
      29_000_000_000_000n,
      30_000_000_000_000n,
      31_000_000_000_000n,
      32_000_000_000_000n,
      33_000_000_000_000n,
      34_000_000_000_000n,
      35_000_000_000_000n,
      36_000_000_000_000n,
      37_000_000_000_000n
    ])
  })

  it('generates proper drift rates', () => {
    expect(munge(taiData).map(block => block.ratio.atomicPicosPerUnixMilli)).toEqual([
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
    expect(munge(taiData).map((block, i, arr) =>
      // block end minus overlap start
      i + 1 in arr
        ? (
            arr[i + 1].start.atomicPicos -
          BigInt(arr[i + 1].start.unixMillis) * block.ratio.atomicPicosPerUnixMilli -
          block.offsetAtUnixEpoch.atomicPicos
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

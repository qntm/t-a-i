/* eslint-env jest */

const taiData = require('./tai-data')
const munge = require('./munge')

const JAN = 0

describe('munge', () => {
  it('works in the simplest possible case', () => {
    expect(munge([
      [BigInt(Date.UTC(1970, JAN, 1)), 0n]
    ])).toEqual([{
      blockStart: {
        atomicPicos: 0n,
        unixMillis: 0n
      },
      blockEnd: {
        atomicPicos: Infinity
      },
      ratio: {
        atomicPicosPerUnixMilli: 1000_000_000n
      },
      offsetAtUnixEpoch: {
        atomicPicos: 0n
      },
      overlapStart: {
        atomicPicos: Infinity
      }
    }])
  })

  it('works when there is an initial offset', () => {
    expect(munge([
      [7n, -4_000_000_000_000n]
    ])).toEqual([{
      blockStart: {
        unixMillis: 7n,
        atomicPicos: -3_993_000_000_000n
      },
      blockEnd: {
        atomicPicos: Infinity
      },
      ratio: {
        atomicPicosPerUnixMilli: 1_000_000_000n
      },
      offsetAtUnixEpoch: {
        atomicPicos: -4_000_000_000_000n
      },
      overlapStart: {
        atomicPicos: Infinity
      }
    }])
  })

  it('works with some millisecond-level alterations', () => {
    //                  inserted       removed
    //                       \/         \/
    // TAI:          [3][4][5][6][ 7][ 8][ 9][...]
    // Unix: [...][6][7][8][9][9][10][11][13][...]
    expect(munge([
      [-1000n, -4_000_000_000_000n],
      [9000n, -3_000_000_000_000n], // inserted leap millisecond
      [13000n, -4_000_000_000_000n] // removed leap millisecond
    ])).toEqual([{
      blockStart: {
        unixMillis: -1000n,
        atomicPicos: -5_000_000_000_000n
      },
      blockEnd: {
        atomicPicos: 6_000_000_000_000n
      },
      ratio: {
        atomicPicosPerUnixMilli: 1_000_000_000n
      },
      offsetAtUnixEpoch: {
        atomicPicos: -4_000_000_000_000n
      },
      overlapStart: {
        atomicPicos: 5_000_000_000_000n
      }
    }, {
      blockStart: {
        unixMillis: 9000n,
        atomicPicos: 6_000_000_000_000n
      },
      blockEnd: {
        atomicPicos: 9_000_000_000_000n
      },
      ratio: {
        atomicPicosPerUnixMilli: 1_000_000_000n
      },
      offsetAtUnixEpoch: {
        atomicPicos: -3_000_000_000_000n
      },
      overlapStart: {
        atomicPicos: 10_000_000_000_000n
      }
    }, {
      blockStart: {
        unixMillis: 13000n,
        atomicPicos: 9_000_000_000_000n
      },
      blockEnd: {
        atomicPicos: Infinity
      },
      ratio: {
        atomicPicosPerUnixMilli: 1_000_000_000n
      },
      offsetAtUnixEpoch: {
        atomicPicos: -4_000_000_000_000n
      },
      overlapStart: {
        atomicPicos: Infinity
      }
    }])
  })

  it('fails on a bad drift rate', () => {
    expect(() => munge([
      [BigInt(Date.UTC(1961, JAN, 1)), 1_422_818_000_000n, 37_300n, 0.001]
    ])).toThrowError('Could not compute precise drift rate')
  })

  it('works with the first line of real data', () => {
    expect(munge([
      [BigInt(Date.UTC(1961, JAN, 1)), 1_422_818_000_000n, 37_300n, 0.001_296]
    ])).toEqual([{
      blockStart: {
        unixMillis: -283_996_800_000n,
        atomicPicos: -283_996_798_577_182_000_000n
      },
      blockEnd: {
        atomicPicos: Infinity
      },
      ratio: {
        atomicPicosPerUnixMilli: 1_000_000_015n
      },
      offsetAtUnixEpoch: {
        atomicPicos: 5_682_770_000_000n
      },
      overlapStart: {
        atomicPicos: Infinity
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
    expect(munge(taiData).map(block => block.blockEnd.atomicPicos - block.overlapStart.atomicPicos)).toEqual([
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

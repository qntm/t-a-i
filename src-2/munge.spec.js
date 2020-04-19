const data = require('./data')
const munge = require('./munge')

const JAN = 0

describe('munge', () => {
  it('works in the simplest possible case', () => {
    expect(munge([
      [Date.UTC(1970, JAN, 1), 0n]
    ])).toEqual([{
      blockStart_atomicPicos: 0n,
      blockStart_unixMillis: 0n,
      blockEnd_atomicPicos: Infinity,
      ratio_atomicPicosPerUnixMilli: 1000000000n,
      offsetAtUnixEpoch_atomicPicos: 0n
    }])
  })

  it('works when there is an initial offset', () => {
    expect(munge([
      [7, -4000000000000n]
    ])).toEqual([{
      blockStart_unixMillis: 7n,
      blockStart_atomicPicos: -3993000000000n,
      blockEnd_atomicPicos: Infinity,
      ratio_atomicPicosPerUnixMilli: 1000000000n,
      offsetAtUnixEpoch_atomicPicos: -4000000000000n
    }])
  })

  it('works with some millisecond-level alterations', () => {
    //                  inserted       removed
    //                       \/         \/
    // TAI:          [3][4][5][6][ 7][ 8][ 9][...]
    // Unix: [...][6][7][8][9][9][10][11][13][...]
    expect(munge([
      [-1000, -4000000000000n],
      [9000, -3000000000000n], // inserted leap millisecond
      [13000, -4000000000000n]  // removed leap millisecond
    ])).toEqual([{
      blockStart_unixMillis: -1000n,
      blockStart_atomicPicos: -5000000000000n,
      blockEnd_atomicPicos: 6000000000000n,
      ratio_atomicPicosPerUnixMilli: 1000000000n,
      offsetAtUnixEpoch_atomicPicos: -4000000000000n
    }, {
      blockStart_unixMillis: 9000n,
      blockStart_atomicPicos: 6000000000000n,
      blockEnd_atomicPicos: 9000000000000n,
      ratio_atomicPicosPerUnixMilli: 1000000000n,
      offsetAtUnixEpoch_atomicPicos: -3000000000000n
    }, {
      blockStart_unixMillis: 13000n,
      blockStart_atomicPicos: 9000000000000n,
      blockEnd_atomicPicos: Infinity,
      ratio_atomicPicosPerUnixMilli: 1000000000n,
      offsetAtUnixEpoch_atomicPicos: -4000000000000n
    }])
  })

  it('works with the first line of real data', () => {
    expect(munge([
      [Date.UTC(1961, JAN, 1), 1422818000000n, 37300n, 1296000000n],
    ])).toEqual([{
      blockStart_unixMillis: -283996800000n,
      blockStart_atomicPicos: -283996798577182000000n,
      blockEnd_atomicPicos: Infinity,
      ratio_atomicPicosPerUnixMilli: 1000000015n,
      offsetAtUnixEpoch_atomicPicos: 5682770000000n
    }])
  })

  it('generates proper offsets at the Unix epoch', () => {
    expect(munge(data).map(block => block.offsetAtUnixEpoch_atomicPicos)).toEqual([
      5682770000000n,
      5632770000000n,
      5127848400000n,
      5227848400000n,
      5606626000000n,
      5706626000000n,
      5806626000000n,
      5906626000000n,
      6006626000000n,
      6106626000000n,
      6206626000000n,
      8100082000000n,
      8000082000000n,
      10000000000000n,
      11000000000000n,
      12000000000000n,
      13000000000000n,
      14000000000000n,
      15000000000000n,
      16000000000000n,
      17000000000000n,
      18000000000000n,
      19000000000000n,
      20000000000000n,
      21000000000000n,
      22000000000000n,
      23000000000000n,
      24000000000000n,
      25000000000000n,
      26000000000000n,
      27000000000000n,
      28000000000000n,
      29000000000000n,
      30000000000000n,
      31000000000000n,
      32000000000000n,
      33000000000000n,
      34000000000000n,
      35000000000000n,
      36000000000000n,
      37000000000000n
    ])
  })

  it('generates proper drift rates', () => {
    console.log(munge(data))
    expect(munge(data).map(block => block.ratio_atomicPicosPerUnixMilli)).toEqual([
      1000000015n,
      1000000015n,
      1000000013n,
      1000000013n,
      1000000015n,
      1000000015n,
      1000000015n,
      1000000015n,
      1000000015n,
      1000000015n,
      1000000015n,
      1000000030n,
      1000000030n,
      1000000000n,
      1000000000n,
      1000000000n,
      1000000000n,
      1000000000n,
      1000000000n,
      1000000000n,
      1000000000n,
      1000000000n,
      1000000000n,
      1000000000n,
      1000000000n,
      1000000000n,
      1000000000n,
      1000000000n,
      1000000000n,
      1000000000n,
      1000000000n,
      1000000000n,
      1000000000n,
      1000000000n,
      1000000000n,
      1000000000n,
      1000000000n,
      1000000000n,
      1000000000n,
      1000000000n,
      1000000000n
    ])
  })
})

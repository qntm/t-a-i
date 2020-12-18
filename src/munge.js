// So what do we ACTUALLY need from our data?

const NOV = 10

const picosPerSecond = 1000 * 1000 * 1000 * 1000
const picosPerMilli = 1000n * 1000n * 1000n
const millisPerDay = 24 * 60 * 60 * 1000

const mjdEpoch = {
  unixMillis: Date.UTC(1858, NOV, 17)
}

// Input some raw TAI-UTC data, output the same data but with some extremely useful extra values
// computed
module.exports = data => {
  const munged = data.map(datum => {
    const block = {
      start: {},
      offsetAtRoot: {},
      root: {},
      driftRate: {}
    };

    [
      block.start.unixMillis,
      block.offsetAtRoot.atomicSeconds,
      block.root.mjds = 0,
      block.driftRate.atomicSecondsPerUnixDay = 0
    ] = datum

    block.root.unixMillis = mjdEpoch.unixMillis + block.root.mjds * millisPerDay

    // `8.640_0 * 1000_000_000_000` evaluates to `8_640_000_000_000.001` so we must round
    block.driftRate.atomicPicosPerUnixDay = BigInt(Math.round(block.driftRate.atomicSecondsPerUnixDay * picosPerSecond))
    block.driftRate.atomicPicosPerUnixMilli = block.driftRate.atomicPicosPerUnixDay / BigInt(millisPerDay)
    // Typically 15n

    if (block.driftRate.atomicPicosPerUnixMilli * BigInt(millisPerDay) !== block.driftRate.atomicPicosPerUnixDay) {
      // Rounding occurred
      throw Error('Could not compute precise drift rate')
    }

    block.ratio = {}
    block.ratio.atomicPicosPerUnixMilli = picosPerMilli + block.driftRate.atomicPicosPerUnixMilli
    // Typically 1_000_000_015n

    if (block.ratio.atomicPicosPerUnixMilli < 0n) {
      throw Error('Universal Time cannot run backwards yet')
    }

    // `4.313_170_0 * 1000_000_000_000` evaluates to `4_313_170_000_000.000_5` so we must round
    block.offsetAtRoot.atomicPicos = BigInt(Math.round(block.offsetAtRoot.atomicSeconds * picosPerSecond))

    block.offsetAtUnixEpoch = {}
    block.offsetAtUnixEpoch.atomicPicos = block.offsetAtRoot.atomicPicos -
      BigInt(block.root.unixMillis) * block.driftRate.atomicPicosPerUnixMilli

    block.start.atomicPicos = BigInt(block.start.unixMillis) * block.ratio.atomicPicosPerUnixMilli +
      block.offsetAtUnixEpoch.atomicPicos 

    return block
  })

  munged.forEach((block, i, arr) => {
    if (i + 1 in arr) {
      if (arr[i + 1].start.atomicPicos < block.start.atomicPicos) {
        throw Error('Disordered blocks are not supported yet')
      }

      if (arr[i + 1].start.atomicPicos === block.start.atomicPicos) {
        throw Error('Zero-length blocks are not supported yet')
      }
    }
  })

  return munged
}

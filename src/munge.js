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
    const blockStart = {}
    const offsetAtRoot = {}
    const root = {}
    const driftRate = {};

    [
      blockStart.unixMillis,
      offsetAtRoot.atomicSeconds,
      root.mjds = 0,
      driftRate.atomicSecondsPerUnixDay = 0
    ] = datum

    root.unixMillis = mjdEpoch.unixMillis + root.mjds * millisPerDay

    // `8.640_0 * 1000_000_000_000` evaluates to `8_640_000_000_000.001` so we must round
    driftRate.atomicPicosPerUnixDay = BigInt(Math.round(driftRate.atomicSecondsPerUnixDay * picosPerSecond))
    driftRate.atomicPicosPerUnixMilli = driftRate.atomicPicosPerUnixDay / BigInt(millisPerDay)
    // Typically 15n

    if (driftRate.atomicPicosPerUnixMilli * BigInt(millisPerDay) !== driftRate.atomicPicosPerUnixDay) {
      // Rounding occurred
      throw Error('Could not compute precise drift rate')
    }

    const ratio = {}
    ratio.atomicPicosPerUnixMilli = picosPerMilli + driftRate.atomicPicosPerUnixMilli
    // Typically 1_000_000_015n

    if (ratio.atomicPicosPerUnixMilli < 0n) {
      throw Error('Universal Time cannot run backwards yet')
    }

    // `4.313_170_0 * 1000_000_000_000` evaluates to `4_313_170_000_000.000_5` so we must round
    offsetAtRoot.atomicPicos = BigInt(Math.round(offsetAtRoot.atomicSeconds * picosPerSecond))

    const offsetAtUnixEpoch = {}
    offsetAtUnixEpoch.atomicPicos = offsetAtRoot.atomicPicos - BigInt(root.unixMillis) * driftRate.atomicPicosPerUnixMilli

    blockStart.atomicPicos = BigInt(blockStart.unixMillis) * ratio.atomicPicosPerUnixMilli +
      offsetAtUnixEpoch.atomicPicos 

    return {
      blockStart,
      ratio,
      offsetAtUnixEpoch
    }
  })

  munged.forEach((block, i, arr) => {
    // Block end is exclusive: this is the earliest precise count which is NOT in the block.
    // If the ratio is such that Universal Time runs backwards relative to TAI, or if the blocks are
    // not given in increasing order of start time, it is possible that `blockEnd` could be *before*
    // `blockStart`.
    // TODO: figure out what to do about those possible cases
    block.blockEnd = {}
    block.blockEnd.atomicPicos = i + 1 in arr
      ? arr[i + 1].blockStart.atomicPicos
      : Infinity

    // This can be before, exactly at, or after `blockEnd`. Before is the case we care about most.
    block.overlapStart = {}
    block.overlapStart.atomicPicos = i + 1 in arr
      ? BigInt(arr[i + 1].blockStart.unixMillis) * block.ratio.atomicPicosPerUnixMilli +
        block.offsetAtUnixEpoch.atomicPicos
      : Infinity
  })

  return munged
}

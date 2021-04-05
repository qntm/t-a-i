// So what do we ACTUALLY need from our data?

const NOV = 10

const picosPerSecond = 1000 * 1000 * 1000 * 1000
const picosPerMilli = 1000n * 1000n * 1000n
const millisPerDay = 24 * 60 * 60 * 1000

const mjdEpoch = {
  unixMillis: Date.UTC(1858, NOV, 17)
}

// Input some raw TAI-UTC data, output the same data but altered to be more consumable for our
// purposes: start point is expressed both in Unix milliseconds and TAI picoseconds, ratio between
// TAI picoseconds and UTC milliseconds is given as a precise BigInt, and the root is moved to the
// Unix epoch
module.exports = data => {
  const munged = data.map(datum => {
    const start = {}
    const offsetAtRoot = {}
    const root = {}
    const driftRate = {};

    [
      start.unixMillis,
      offsetAtRoot.atomicSeconds,
      root.mjds = 0,
      driftRate.atomicSecondsPerUnixDay = 0
    ] = datum

    root.unixMillis = mjdEpoch.unixMillis + root.mjds * millisPerDay

    // `4.313_170_0 * 1000_000_000_000` evaluates to `4_313_170_000_000.000_5` so we must round
    offsetAtRoot.atomicPicos = BigInt(Math.round(offsetAtRoot.atomicSeconds * picosPerSecond))

    // `8.640_0 * 1000_000_000_000` evaluates to `8_640_000_000_000.001` so we must round
    driftRate.atomicPicosPerUnixDay = BigInt(Math.round(driftRate.atomicSecondsPerUnixDay * picosPerSecond))
    driftRate.atomicPicosPerUnixMilli = driftRate.atomicPicosPerUnixDay / BigInt(millisPerDay)
    // Typically 15n

    if (driftRate.atomicPicosPerUnixMilli * BigInt(millisPerDay) !== driftRate.atomicPicosPerUnixDay) {
      // Rounding occurred
      throw Error('Could not compute precise drift rate')
    }

    const ratio = {
      atomicPicosPerUnixMilli: picosPerMilli + driftRate.atomicPicosPerUnixMilli
      // Typically 1_000_000_015n
    }

    const offsetAtUnixEpoch = {
      atomicPicos: offsetAtRoot.atomicPicos -
        BigInt(root.unixMillis) * driftRate.atomicPicosPerUnixMilli
    }

    start.atomicPicos = BigInt(start.unixMillis) * ratio.atomicPicosPerUnixMilli +
      offsetAtUnixEpoch.atomicPicos

    return {
      start,
      ratio,
      offsetAtUnixEpoch
    }
  })

  // `end` is the first TAI instant when this ray ceases to be applicable.
  // `end` can equal or come before `start`, indicating that this ray has no validity at all
  let end = {
    atomicPicos: Infinity
  }
  for (let rayId = munged.length - 1; rayId >= 0; rayId--) {
    munged[rayId].end = end
    if (munged[rayId].start.atomicPicos < end.atomicPicos) {
      end = {
        atomicPicos: munged[rayId].start.atomicPicos
      }
    }
  }

  return munged
}

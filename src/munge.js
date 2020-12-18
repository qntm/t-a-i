// So what do we ACTUALLY need from our data?

const NOV = 10

const picosPerSecond = 1000 * 1000 * 1000 * 1000
const picosPerMilli = 1000n * 1000n * 1000n
const millisPerDay = 24n * 60n * 60n * 1000n

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

    root.unixMillis = BigInt(mjdEpoch.unixMillis) + BigInt(root.mjds) * millisPerDay

    driftRate.atomicPicosPerUnixDay = BigInt(driftRate.atomicSecondsPerUnixDay * picosPerSecond)
    driftRate.atomicPicosPerUnixMilli = driftRate.atomicPicosPerUnixDay / millisPerDay
    // Typically 15n

    if (driftRate.atomicPicosPerUnixMilli * millisPerDay !== driftRate.atomicPicosPerUnixDay) {
      // Rounding occurred
      throw Error('Could not compute precise drift rate')
    }

    const ratio = {
      atomicPicosPerUnixMilli: picosPerMilli + driftRate.atomicPicosPerUnixMilli
      // Typically 1_000_000_015n
    }

    // `4.313_170_0 * 1000_000_000_000` evaluates to `4_313_170_000_000.000_5` so we must round
    offsetAtRoot.atomicPicos = BigInt(Math.round(offsetAtRoot.atomicSeconds * picosPerSecond))

    const offsetAtUnixEpoch = {
      atomicPicos: offsetAtRoot.atomicPicos - root.unixMillis * driftRate.atomicPicosPerUnixMilli
    }

    blockStart.atomicPicos = offsetAtUnixEpoch.atomicPicos +
      blockStart.unixMillis * ratio.atomicPicosPerUnixMilli

    return {
      blockStart,
      ratio,
      offsetAtUnixEpoch
    }
  })

  munged.forEach((block, i, arr) => {
    if (i + 1 in arr) {
      // Block end is exclusive: this is the earliest precise count which is NOT in the block.
      block.blockEnd = {
        atomicPicos: arr[i + 1].blockStart.atomicPicos
      }

      // This can be before, exactly at, or after `blockEnd`. Before is the case we care about most.
      block.overlapStart = {
        atomicPicos: arr[i + 1].blockStart.unixMillis * block.ratio.atomicPicosPerUnixMilli +
          block.offsetAtUnixEpoch.atomicPicos
      }
    } else {
      block.blockEnd = {
        atomicPicos: Infinity
      }
      block.overlapStart = {
        atomicPicos: Infinity
      }
    }
  })

  return munged
}

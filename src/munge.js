// So what do we ACTUALLY need from our data?

const NOV = 10

const picosPerMilli = 1000n * 1000n * 1000n
const millisPerDay = 24n * 60n * 60n * 1000n

const mjdEpoch = {
  unixMillis: BigInt(Date.UTC(1858, NOV, 17))
}

// Input some raw TAI-UTC data, output the same data but with some extremely useful extra values
// computed
module.exports = data => {
  const munged = data.map(datum => {
    const [a, b, c = 0n, d = 0n] = datum
    const blockStart = {
      unixMillis: a
    }
    const offsetAtRoot = {
      atomicPicos: b
    }
    const root = {
      mjds: c
    }
    const driftRate = {
      atomicPicosPerUnixDay: d
    }

    root.unixMillis = mjdEpoch.unixMillis + root.mjds * millisPerDay

    driftRate.atomicPicosPerUnixMilli = driftRate.atomicPicosPerUnixDay / millisPerDay
    if (driftRate.atomicPicosPerUnixMilli * millisPerDay !== driftRate.atomicPicosPerUnixDay) {
      // Rounding occurred
      throw Error('Could not compute precise drift rate')
    }
    // Typically 15n

    const ratio = {
      atomicPicosPerUnixMilli: picosPerMilli + driftRate.atomicPicosPerUnixMilli
      // Typically 1_000_000_015n
    }

    const offsetAtUnixEpoch = {
      atomicPicos: offsetAtRoot.atomicPicos - root.unixMillis * driftRate.atomicPicosPerUnixMilli
    }

    blockStart.atomicPicos = offsetAtUnixEpoch.atomicPicos +
      blockStart.unixMillis * ratio.atomicPicosPerUnixMilli

    // The earliest precise atomic millisecond count which IS in the block
    blockStart.atomicMillis = blockStart.atomicPicos / picosPerMilli - 1n
    while (blockStart.atomicMillis * picosPerMilli < blockStart.atomicPicos) {
      blockStart.atomicMillis++
    }

    return {
      blockStart,
      ratio,
      offsetAtUnixEpoch
    }
  })

  munged.forEach((datum, i, arr) => {
    if (i + 1 in arr) {
      // Block end is exclusive: these are the earliest precise counts which are NOT in the block.
      datum.blockEnd = {
        atomicPicos: arr[i + 1].blockStart.atomicPicos,
        atomicMillis: arr[i + 1].blockStart.atomicMillis
      }

      // This is NOT just arr[i + 1].blockStart.unixMillis, there is likely a discontinuity
      datum.blockEnd.unixMillis = (datum.blockEnd.atomicPicos - datum.offsetAtUnixEpoch.atomicPicos) /
        datum.ratio.atomicPicosPerUnixMilli - 1n
      while (
        datum.blockEnd.unixMillis * datum.ratio.atomicPicosPerUnixMilli + datum.offsetAtUnixEpoch.atomicPicos <
          datum.blockEnd.atomicPicos
      ) {
        datum.blockEnd.unixMillis++
      }
    } else {
      datum.blockEnd = {
        atomicPicos: Infinity,
        atomicMillis: Infinity,
        unixMillis: Infinity
      }
    }
  })

  return munged
}

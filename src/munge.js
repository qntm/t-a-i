// So what do we ACTUALLY need from our data?

const segment = require('./segment')

const MODELS = {
  OVERRUN_ARRAY: 0,
  OVERRUN_LAST: 1,
  STALL_RANGE: 2,
  STALL_END: 3
}

// In all models, TAI to Unix conversions are one-to-one (or one-to-NaN). At any given instant in
// TAI, at most one segment applies and at most one Unix time corresponds.
const REAL_MODELS = {
  // Each segment continues until it reaches the TAI start of the next segment, even if that start
  // point is in the past (Unix time) due to inserted time and the result is a backtrack. Unix to
  // TAI conversions are potentially one-to-many but the many are discrete instants in time.
  // When time is removed, the result is an empty array.
  OVERRUN: 0,

  // Rather than overrun, Unix time becomes indeterminate. The segment ends early. Unix to TAI
  // conversions are one-to-one, all discrete instants.
  // When time is removed, the result is NaN.
  BREAK: 1,

  // Rather than overrun, Unix time stops. The segment ends early and a new horizontal segment
  // (dy = 0) appears, linking this "stall point" to the start of the next segment. Unix to TAI
  // conversions are one-to-many and the many are a closed range of TAI times, normally a single
  // instant but sometimes the full inserted TAI time.
  // When time is removed, the result is NaN.
  STALL: 2,

  // Rather than overrun, a new segment is inserted from 12 hours prior to the discontinuity to
  // 12 hours after. (This is done for *all* new segments, including historic ones where time
  // was removed or where there was no discontinuity, all that changed was the slope.)
  // Unix to TAI conversions are always one-to-one.
  // When time is removed, you still get a meaningful result.
  SMEAR: 3
}

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
module.exports.munge = (data, realModel) => {
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

    const dy = {
      unixMillis: 1
    }

    const dx = {
      atomicPicos: picosPerMilli + driftRate.atomicPicosPerUnixMilli
      // Typically 1_000_000_015n
    }

    start.atomicPicos = BigInt(root.unixMillis) * picosPerMilli +
      offsetAtRoot.atomicPicos +
      BigInt(start.unixMillis - root.unixMillis) * dx.atomicPicos / BigInt(dy.unixMillis)

    return {
      start,
      dy,
      dx
    }
  })

  // Check ordering of the data, no funny business please
  if (
    munged.some((datum, i, munged) =>
      i + 1 in munged &&
      munged[i + 1].start.atomicPicos <= datum.start.atomicPicos
    )
  ) {
    throw Error('Disordered data')
  }

  // `end` is the first TAI instant when this segment ceases to be applicable.
  munged.forEach((datum, i, munged) => {
    datum.end = {
      atomicPicos: i + 1 in munged
        ? munged[i + 1].start.atomicPicos
        : Infinity
    }
  })

  if (realModel === REAL_MODELS.OVERRUN) {
    // Do nothing, we're good
  } else if (realModel === REAL_MODELS.BREAK || realModel === REAL_MODELS.STALL) {
    for (let i = 0; i < munged.length; i++) {
      const datum = munged[i]

      if (i + 1 in munged) {
        // Find the "stall point", which is where Unix time starts to double up
        const stall = {
          unixMillis: munged[i + 1].start.unixMillis
        }

        stall.atomicPicos = datum.start.atomicPicos +
          BigInt(stall.unixMillis - datum.start.unixMillis) *
          datum.dx.atomicPicos /
          BigInt(datum.dy.unixMillis)

        if (stall.atomicPicos < datum.end.atomicPicos) {
          // Terminate this segment early
          datum.end = stall // includes unixMillis but we'll ignore that

          if (realModel === REAL_MODELS.STALL) {
            // Insert a new horizontal segment linking that stall point
            // to the start of the next segment
            munged.splice(i + 1, 0, {
              start: stall,
              end: munged[i + 1].start, // includes unixMillis but we'll ignore that
              dy: {
                unixMillis: 0
              },
              dx: {
                atomicPicos: munged[i + 1].start.atomicPicos - stall.atomicPicos
              }
            })

            // Then also skip over it
            i++
          }
        }
      }
    }
  } else {
    throw Error('Unrecognised model')
  }

  return munged.map((datum, i, munged) => new segment.Segment(
    datum.start,
    datum.end,
    datum.dy,
    datum.dx
  ))

  // TODO:
  // REAL_MODELS.SMEAR
}

module.exports.MODELS = MODELS
module.exports.REAL_MODELS = REAL_MODELS

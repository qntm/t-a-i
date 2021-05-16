// So what do we ACTUALLY need from our data?

const segment = require('./segment')

// In all models, TAI to Unix conversions are one-to-one (or one-to-NaN). At any given instant in
// TAI, at most one segment applies and at most one Unix time corresponds.
const SEGMENT_MODELS = {
  // Each segment continues until it reaches the TAI start of the next segment, even if that start
  // point is in the past (Unix time) due to inserted time and the result is a backtrack. Unix to
  // TAI conversions are potentially one-to-many but the many are discrete instants in time.
  // When time is removed, the result is an empty array.
  OVERRUN: 0,

  // Rather than overrun, the segment ends early and Unix time becomes indeterminate. Unix to TAI
  // conversions are one-to-one, all discrete instants.
  // When Unix time is removed, the result is NaN.
  BREAK: 1,

  // Rather than overrun, Unix time stalls. The segment ends early and a new horizontal segment
  // (dy = 0) appears, linking this "stall point" to the start of the next segment. Unix to TAI
  // conversions are one-to-many and the many are a closed range of TAI times, normally a single
  // instant but sometimes the full inserted TAI time.
  // When Unix time is removed, the result is NaN.
  STALL: 2,

  // Rather than overrun, a new segment is inserted from 12 Unix hours prior to the discontinuity to
  // 12 Unix hours after. (This is done for *all* new segments, including historic ones where time
  // was removed or where there was no discontinuity, all that changed was the slope.)
  // Unix to TAI conversions are always one-to-one.
  // When Unix time is removed, you still get a meaningful result.
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
const munge = (data, segmentModel) => {
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
      BigInt(start.unixMillis - root.unixMillis) *
      dx.atomicPicos /
      BigInt(dy.unixMillis)

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

  if (segmentModel === SEGMENT_MODELS.OVERRUN) {
    // Do nothing, we're good
  } else if (
    segmentModel === SEGMENT_MODELS.BREAK ||
    segmentModel === SEGMENT_MODELS.STALL ||
    segmentModel === SEGMENT_MODELS.SMEAR
  ) {
    // Handle continuity between segments by altering segment boundaries
    // and possibly introducing new segments between them.
    for (let i = 0; i < munged.length; i++) {
      if (!(i + 1 in munged)) {
        // Last segment, no continuity to handle
        continue
      }

      const a = munged[i]
      const b = munged[i + 1]

      // Find smear start point, which is on THIS segment.
      // When breaking/stalling, this is the Unix time when the next segment starts.
      // When smearing, this is twelve Unix hours prior to discontinuity.
      const smearStart = {
        unixMillis: segmentModel === SEGMENT_MODELS.SMEAR
          ? b.start.unixMillis - millisPerDay / 2
          : b.start.unixMillis
      }

      smearStart.atomicPicos = a.start.atomicPicos +
        BigInt(smearStart.unixMillis - a.start.unixMillis) *
        a.dx.atomicPicos /
        BigInt(a.dy.unixMillis)

      // Find smear end point, which is on the NEXT segment.
      // When breaking/stalling, this is the start of the next segment.
      // When smearing, this is twelve hours after the discontinuity.
      const smearEnd = {
        unixMillis: segmentModel === SEGMENT_MODELS.SMEAR
          ? b.start.unixMillis + millisPerDay / 2
          : b.start.unixMillis
      }

      smearEnd.atomicPicos = b.start.atomicPicos +
        BigInt(smearEnd.unixMillis - b.start.unixMillis) *
        b.dx.atomicPicos /
        BigInt(b.dy.unixMillis)

      if (smearEnd.atomicPicos <= smearStart.atomicPicos) {
        // No negative-length smears
        continue
      }

      // Create the break.
      // Terminate this segment early, start the next segment late.
      a.end = smearStart // includes unixMillis but we'll ignore that
      b.start = smearEnd

      if (segmentModel === SEGMENT_MODELS.BREAK) {
        // Just leave a gap
        continue
      }

      // Insert a new smear segment linking the two.
      // When breaking/stalling, this is perfectly horizontal (dy.unixMillis = 0)
      munged.splice(i + 1, 0, {
        start: smearStart,
        end: smearEnd, // includes unixMillis but we'll ignore that
        dy: {
          unixMillis: smearEnd.unixMillis - smearStart.unixMillis
        },
        dx: {
          atomicPicos: smearEnd.atomicPicos - smearStart.atomicPicos
        }
      })

      // Then also skip over it
      i++
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
}

module.exports.munge = munge
module.exports.SEGMENT_MODELS = SEGMENT_MODELS

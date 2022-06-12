// So what do we ACTUALLY need from our data?

const { Segment } = require('./segment')
const { Rat } = require('./rat')

// In all models, TAI to Unix conversions are one-to-one (or one-to-NaN). At any given instant in
// TAI, at most one segment applies and at most one Unix time corresponds.
const MODELS = {
  // Each segment continues until it reaches the TAI start of the next segment, even if that start
  // point is in the past (Unix time) due to inserted time and the result is a backtrack. Unix to
  // TAI conversions are potentially one-to-many but the many are discrete instants in time.
  // When time is removed, the result is an empty array.
  OVERRUN: Symbol('OVERRUN'),

  // Rather than overrun, the segment ends early and Unix time becomes indeterminate. Unix to TAI
  // conversions are one-to-one, all discrete instants.
  // When Unix time is removed, the result is NaN.
  BREAK: Symbol('BREAK'),

  // Rather than overrun, Unix time stalls. The segment ends early and a new horizontal segment
  // (dy = 0) appears, linking this "stall point" to the start of the next segment. Unix to TAI
  // conversions are one-to-many and the many are a closed range of TAI times, normally a single
  // instant but sometimes the full inserted TAI time.
  // When Unix time is removed, the result is NaN.
  STALL: Symbol('STALL'),

  // Rather than overrun, a new segment is inserted from 12 Unix hours prior to the discontinuity to
  // 12 Unix hours after. (This is done for *all* new segments, including historic ones where time
  // was removed or where there was no discontinuity, all that changed was the slope.)
  // Unix to TAI conversions are always one-to-one.
  // When Unix time is removed, you still get a meaningful result.
  SMEAR: Symbol('SMEAR')
}

const NOV = 10
const secondsPerDay = new Rat(86_400n, 1n, 1)
const mjdEpoch = {
  unix: Rat.fromMillis(Date.UTC(1858, NOV, 17))
}

// Input some raw TAI-UTC data, output the same data but altered to be more consumable for our
// purposes: start point is expressed both in Unix milliseconds and TAI picoseconds, ratio between
// TAI picoseconds and UTC milliseconds is given as a precise BigInt, and the root is moved to the
// Unix epoch
const munge = (data, model) => {
  const munged = data.map(datum => {
    const start = {}
    const offsetAtRoot = {}
    const root = {}
    const driftRate = {}

    ;[
      start.unixMillis,
      offsetAtRoot.atomicFloat,
      root.mjds = 0,
      driftRate.atomicPerUnixDayFloat = 0
    ] = datum

    // Convert from a millisecond count to a precise ratio of seconds
    start.unix = Rat.fromMillis(start.unixMillis)

    // Convert from a floating point number to a precise ratio
    // Offsets are given in TAI seconds to seven decimal places, e.g. `1.422_818_0`.
    // So we have to do some rounding
    offsetAtRoot.atomic = new Rat(
      BigInt(Math.round(offsetAtRoot.atomicFloat * 10_000_000)),
      BigInt(10_000_000),
      1
    )

    root.unix = mjdEpoch.unix.plus(new Rat(BigInt(root.mjds)).times(secondsPerDay))

    // Convert from a floating point number to a precise ratio
    // Drift rates are given in TAI seconds to seven decimal places, e.g. `0.001_123_2`
    // So we have to do some rounding
    driftRate.atomicPerUnixDay = new Rat(
      BigInt(Math.round(driftRate.atomicPerUnixDayFloat * 10_000_000)),
      BigInt(10_000_000),
      1
    )
    driftRate.atomicPerUnix = driftRate.atomicPerUnixDay.divide(secondsPerDay)

    const slope = {}
    slope.atomicPerUnix = new Rat(1n).plus(driftRate.atomicPerUnix)
    slope.unixPerAtomic = new Rat(1n).divide(slope.atomicPerUnix)

    start.atomic = start.unix
      .minus(root.unix)
      .divide(slope.unixPerAtomic)
      .plus(offsetAtRoot.atomic)
      .plus(root.unix)

    return {
      start,
      slope
    }
  })

  // Check ordering of the data, no funny business please
  // `end` is the first TAI instant when this segment ceases to be applicable.
  munged.forEach((datum, i, munged) => {
    datum.end = {
      atomic: i + 1 in munged
        ? munged[i + 1].start.atomic
        : Rat.INFINITY
    }

    if (datum.end.atomic.le(datum.start.atomic)) {
      throw Error('Disordered data')
    }
  })

  if (model === MODELS.OVERRUN) {
    // Do nothing, we're good
  } else if (
    model === MODELS.BREAK ||
    model === MODELS.STALL ||
    model === MODELS.SMEAR
  ) {
    // Handle continuity between segments by altering segment boundaries
    // and possibly introducing new segments between them.
    for (let i = 0; i in munged; i++) {
      if (!(i + 1 in munged)) {
        // Last segment, no continuity to handle
        continue
      }

      const a = munged[i]
      const b = munged[i + 1]

      // Find smear start point, which is on THIS segment.
      // When breaking/stalling, this is the Unix time when the next segment starts.
      // When smearing, this is twelve Unix hours prior to discontinuity.
      const smearStart = {}

      smearStart.unix = model === MODELS.SMEAR
        ? b.start.unix.minus(secondsPerDay.divide(new Rat(2n)))
        : b.start.unix

      smearStart.atomic = smearStart.unix
        .minus(a.start.unix)
        .divide(a.slope.unixPerAtomic)
        .plus(a.start.atomic)

      // Find smear end point, which is on the NEXT segment.
      // When breaking/stalling, this is the start of the next segment.
      // When smearing, this is twelve hours after the discontinuity.
      const smearEnd = {}

      smearEnd.unix = model === MODELS.SMEAR
        ? b.start.unix.plus(secondsPerDay.divide(new Rat(2n)))
        : b.start.unix

      smearEnd.atomic = smearEnd.unix
        .minus(b.start.unix)
        .divide(b.slope.unixPerAtomic)
        .plus(b.start.atomic)

      if (smearEnd.atomic.le(smearStart.atomic)) {
        // No negative-length or zero-length smears.
        // This handles negative leap seconds correctly.
        continue
      }

      // Create the break.
      // Terminate this segment early, start the next segment late.
      a.end = smearStart // includes unix but we'll ignore that
      b.start = smearEnd

      // This can reduce `a` to length 0, in which case we elide it.
      // No point checking for negative-length segments, those throw an
      // exception later
      if (a.start.atomic.eq(a.end.atomic)) {
        munged.splice(i, 1)
        i--
      }

      if (model === MODELS.BREAK) {
        // Just leave a gap
        continue
      }

      // Insert a new smear segment linking the two.
      // When breaking/stalling, this is perfectly horizontal (slope = 0)
      munged.splice(i + 1, 0, {
        start: smearStart,
        end: smearEnd, // includes unix but we'll ignore that
        slope: {
          unixPerAtomic: smearEnd.unix.minus(smearStart.unix)
            .divide(smearEnd.atomic.minus(smearStart.atomic))
        }
      })

      // Then also skip over it
      i++
    }
  } else {
    throw Error('Unrecognised model')
  }

  return munged.map(datum => new Segment(
    datum.start,
    datum.end,
    datum.slope
  ))
}

module.exports.MODELS = MODELS
module.exports.munge = munge

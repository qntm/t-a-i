// The way to think about this is a 2D graph with TAI on the X axis, UTC on the Y, and a collection
// of numbered *segments*. Each segment starts at a well defined position in both TAI and UTC and
// proceeds diagonally up and to the right, expressing *one* relationship between the two.
// Typically each new segment is either (1) the previous segment translated up or down a little or
// (2) a discrete change in direction/slope of the previous segment with no discontinuity.
// A segment becomes invalid once we reach the TAI start point of the next (numerical) segment. So,
// every TAI time (vertical line) intersects exactly one segment, and maps to exactly 1 UTC time,
// unless it precedes the beginning of TAI.
// A UTC time (horizontal line) can intersect 0, 1, 2 or theoretically many more segments, and hence
// map to multiple TAI times. We can return an array of these, or just the result from the latest
// segment (according to its numbering).

const { Rat } = require('./rat')
const { munge, REAL_MODELS } = require('./munge')

const MODELS = {
  OVERRUN_ARRAY: 0,
  OVERRUN_LAST: 1,
  BREAK: 2,
  STALL_RANGE: 3,
  STALL_END: 4,
  SMEAR: 5
}

const picosPerMilli = 1000n * 1000n * 1000n

const Converter = (data, model) => {
  const realModel = model === MODELS.OVERRUN_ARRAY || model === MODELS.OVERRUN_LAST
    ? REAL_MODELS.OVERRUN
    : model === MODELS.BREAK
      ? REAL_MODELS.BREAK
      : model === MODELS.STALL_RANGE || model === MODELS.STALL_END
        ? REAL_MODELS.STALL
        : model === MODELS.SMEAR
          ? REAL_MODELS.SMEAR
          : undefined

  if (realModel === undefined) {
    throw Error(`Unrecognised model: ${model}`)
  }

  const segments = munge(data, realModel)

  // This conversion always has the same behaviour,
  // and there's no work required in handling the output
  const atomicToUnix = atomicMillis => {
    if (!Number.isInteger(atomicMillis)) {
      throw Error(`Not an integer: ${atomicMillis}`)
    }

    const atomicPicos = BigInt(atomicMillis) * picosPerMilli
    const atomicPicosRatio = new Rat(atomicPicos)

    for (const segment of segments) {
      // input bounds check
      if (!segment.atomicPicosRatioOnSegment(atomicPicosRatio)) {
        continue
      }

      // transformation
      const unixMillisRatio = segment.atomicPicosRatioToUnixMillisRatio(atomicPicosRatio)
      const unixMillis = Number(unixMillisRatio.trunc())

      // Output bounds check.
      // Because every segment starts on a whole number of Unix milliseconds, and we round down,
      // it's currently impossible for this to fail.
      /* istanbul ignore if */
      if (!segment.unixMillisOnSegment(unixMillis)) {
        continue
      }

      return unixMillis
    }

    // Pre-1961 or BREAK model and we hit a break
    return NaN
  }

  const unixToAtomic = unixMillis => {
    if (!Number.isInteger(unixMillis)) {
      throw Error(`Not an integer: ${unixMillis}`)
    }

    const unixMillisRatio = new Rat(BigInt(unixMillis))

    const ranges = []
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]

      // transformation
      const range = segment.unixMillisRatioToAtomicMillisRange(unixMillisRatio)

      if (!Number.isFinite(range.start)) {
        // Horizontal segment does not intersect with this Unix time
        continue
      }

      let { start, end, closed } = range

      if (ranges.length - 1 in ranges) {
        const prev = ranges[ranges.length - 1]

        // Previous range ends where current one starts, so try to combine the two.
        // We can do this even if the previous range was already closed.
        if (prev.end === start) {
          prev.end = end
          prev.closed = closed
          continue
        }

        /* istanbul ignore if */
        if (prev.closed === false) {
          throw Error('Failed to close open range, this should be impossible')
        }
      }

      if (!segment.atomicMillisOnSegment(start)) {
        // Truncation took us off the start of the segment, try to undo that
        start++
        if (start >= end) {
          // Oop, shrunk the range to nothing
          continue
        }
      }

      ranges.push({ start, end, closed })
    }

    /* istanbul ignore if */
    if (ranges.some(range => range.closed !== true)) {
      throw Error('Failed to close all open ranges, this should be impossible')
    }

    if (model === MODELS.OVERRUN_ARRAY) {
      return ranges.map(range => {
        // This should be impossible if the model is implemented correctly
        /* istanbul ignore if */
        if (range.end !== range.start) {
          console.warn('Non-0-length range, using the end')
        }

        return range.end
      })
    }

    if (model !== MODELS.OVERRUN_LAST && ranges.length > 1) {
      // With the OVERRUN_LAST model this happens frequently and we explicitly opted to take the
      // last one, with other models this can only happen in pathological cases
      console.warn('Multiple ranges, using the last one')
    }

    const i = ranges.length - 1
    const range = i in ranges ? ranges[i] : { start: NaN, end: NaN }

    if (model === MODELS.STALL_RANGE) {
      return [range.start, range.end]
    }

    return range.end
  }

  return {
    unixToAtomic,
    atomicToUnix
  }
}

module.exports.MODELS = MODELS
module.exports.Converter = Converter

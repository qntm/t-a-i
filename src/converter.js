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

const { munge, SEGMENT_MODELS } = require('./munge')

const MODELS = {
  OVERRUN_ARRAY: {
    segmentModel: SEGMENT_MODELS.OVERRUN
  },
  OVERRUN_LAST: {
    segmentModel: SEGMENT_MODELS.OVERRUN
  },
  BREAK: {
    segmentModel: SEGMENT_MODELS.BREAK
  },
  STALL_RANGE: {
    segmentModel: SEGMENT_MODELS.STALL
  },
  STALL_END: {
    segmentModel: SEGMENT_MODELS.STALL
  },
  SMEAR: {
    segmentModel: SEGMENT_MODELS.SMEAR
  }
}

const Converter = (data, model) => {
  const segments = munge(data, model.segmentModel)

  // This conversion always has the same behaviour,
  // and there's no work required in handling the output
  const atomicToUnix = atomicMillis => {
    if (!Number.isInteger(atomicMillis)) {
      throw Error(`Not an integer: ${atomicMillis}`)
    }

    for (const segment of segments) {
      // input bounds check
      if (!segment.atomicMillisOnSegment(atomicMillis)) {
        continue
      }

      // transformation
      return segment.atomicMillisToUnixMillis(atomicMillis)
    }

    // Pre-1961, or BREAK model and we hit a break
    return NaN
  }

  const unixToAtomic = unixMillis => {
    if (!Number.isInteger(unixMillis)) {
      throw Error(`Not an integer: ${unixMillis}`)
    }

    const ranges = []
    for (const segment of segments) {
      if (!segment.unixMillisOnSegment(unixMillis)) {
        continue
      }

      // transformation
      const range = segment.unixMillisToAtomicMillisRange(unixMillis)

      if (ranges.length - 1 in ranges) {
        const prev = ranges[ranges.length - 1]

        // Previous range ends where current one starts, so try to combine the two.
        // The previous range should be open but it doesn't actually make a difference.
        if (prev.end === range.start) {
          ranges[ranges.length - 1] = {
            start: prev.start,
            end: range.end,
            closed: range.closed
          }
          continue
        }
      }

      ranges.push(range)
    }

    /* istanbul ignore if */
    if (ranges.some(range => range.closed !== true)) {
      throw Error('Failed to close all open ranges, this should be impossible')
    }

    if (model === MODELS.OVERRUN_ARRAY) {
      return ranges.map(range => {
        /* istanbul ignore if */
        if (range.end !== range.start) {
          throw Error('Non-0-length range, this should be impossible')
        }

        return range.end
      })
    }

    if (ranges.length > 1) {
      /* istanbul ignore else */
      if (model.segmentModel === SEGMENT_MODELS.OVERRUN) {
        // This happens frequently, user explicitly opted to discard the earlier ranges
        // and take only the last one
      } else {
        throw Error('Multiple ranges, this should be impossible')
      }
    }

    const i = ranges.length - 1
    const range = i in ranges ? ranges[i] : { start: NaN, end: NaN }

    if (model === MODELS.STALL_RANGE) {
      return [range.start, range.end]
    }

    if (!Object.is(range.end, range.start)) {
      /* istanbul ignore else */
      if (model === MODELS.STALL_END) {
        // This happens frequently, user explicitly opted to take the stall's end point only,
        // discarding the start point
      } else {
        throw Error('Non-0-length range, this should be impossible')
      }
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

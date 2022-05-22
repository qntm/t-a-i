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

const { MODELS, millisToExact, exactToMillis, munge } = require('./munge')

const Converter = (data, model) => {
  const segments = munge(data, model)

  // This conversion always has the same behaviour,
  // and there's no work required in handling the output
  const atomicToUnix = atomic => {
    for (const segment of segments) {
      if (!segment.atomicOnSegment(atomic)) {
        continue
      }

      return segment.atomicToUnix(atomic)
    }

    // Pre-1961, or BREAK model and we hit a break
    return NaN
  }

  const atomicMillisToUnixMillis = atomicMillis =>
    exactToMillis(atomicToUnix(millisToExact(atomicMillis)))

  const unixToAtomic = unix => {
    const ranges = []
    for (const segment of segments) {
      if (!segment.unixOnSegment(unix)) {
        continue
      }

      const range = segment.unixToAtomicRange(unix)

      if (ranges.length - 1 in ranges) {
        const prev = ranges[ranges.length - 1]

        // Previous range ends where current one starts, so try to combine the two.
        // The previous range should have `closed: false` but it doesn't actually make a difference.
        if (prev.end.eq(range.start)) {
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

    // Always return an array of ranges, caller can prune this output if desired
    return ranges
  }

  const unixMillisToAtomicMillis = (unixMillis, options = {}) => {
    const ranges = unixToAtomic(millisToExact(unixMillis))
      .map(range => [
        exactToMillis(range.start),
        exactToMillis(range.end)
      ])

    if (options.array === true) {
      return options.range === true ? ranges : ranges.map(range => range[1])
    }

    const i = ranges.length - 1
    const lastRange = i in ranges ? ranges[i] : [NaN, NaN]
    return options.range === true ? lastRange : lastRange[1]
  }

  return {
    atomicToUnix,
    atomicMillisToUnixMillis,
    unixToAtomic,
    unixMillisToAtomicMillis
  }
}

module.exports.MODELS = MODELS
module.exports.Converter = Converter

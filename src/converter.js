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

const { munge, MODELS } = require('./munge')
const { Rat } = require('./rat')

const Converter = (data, model) => {
  const segments = munge(data, model)

  // This conversion always has the same behaviour,
  // and there's no work required in handling the output
  const atomicToUnix = atomicMillis => {
    if (!Number.isInteger(atomicMillis)) {
      throw Error(`Not an integer: ${atomicMillis}`)
    }

    const atomicRatio = new Rat(BigInt(atomicMillis), 1000n)

    for (const segment of segments) {
      if (!segment.atomicRatioOnSegment(atomicRatio)) {
        continue
      }

      return Number(segment.atomicRatioToUnixRatio(atomicRatio).times(new Rat(1000n)).trunc())
    }

    // Pre-1961, or BREAK model and we hit a break
    return NaN
  }

  const unixToAtomic = (unixMillis, options = {}) => {
    if (!Number.isInteger(unixMillis)) {
      throw Error(`Not an integer: ${unixMillis}`)
    }

    const unixRatio = new Rat(BigInt(unixMillis), 1000n)
    const unixMillisRatio = new Rat(BigInt(unixMillis))

    const ranges = []
    for (const segment of segments) {
      if (!segment.unixRatioOnSegment(unixRatio)) {
        continue
      }

      const range = segment.unixMillisRatioToAtomicMillisRange(unixMillisRatio)

      if (ranges.length - 1 in ranges) {
        const prev = ranges[ranges.length - 1]

        // Previous range ends where current one starts, so try to combine the two.
        // The previous range should have `closed: false` but it doesn't actually make a difference.
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

    if (options.array === true) {
      return ranges.map(range =>
        options.range === true
          ? [range.start, range.end]
          : range.end
      )
    }

    const i = ranges.length - 1
    const range = i in ranges
      ? ranges[i]
      : { start: NaN, end: NaN }

    return options.range === true
      ? [range.start, range.end]
      : range.end
  }

  return {
    unixToAtomic,
    atomicToUnix
  }
}

module.exports.MODELS = MODELS
module.exports.Converter = Converter

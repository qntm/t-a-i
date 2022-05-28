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

const { MODELS } = require('./munge')
const { Rat } = require('./rat.js')
const { ExactConverter } = require('./exact-converter.js')

const Converter = (data, model) => {
  const exactConverter = ExactConverter(data, model)

  const atomicToUnix = atomicMillis => {
    const unix = exactConverter.atomicToUnix(Rat.fromMillis(atomicMillis))
    return Number.isNaN(unix)
      ? unix
      : unix.toMillis()
  }

  const unixToAtomic = (unixMillis, options = {}) => {
    const ranges = exactConverter.unixToAtomic(Rat.fromMillis(unixMillis))
      .map(range => [
        range.start.toMillis(),
        range.end.toMillis()
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
    unixToAtomic
  }
}

module.exports.MODELS = MODELS
module.exports.Converter = Converter

// The way to think about this is a 2D graph with TAI on the X axis, UTC on the Y, and a collection
// of numbered *segments*. Each segment starts at a well defined position in both TAI and UTC and proceeds
// diagonally up and to the right, expressing *one* relationship between the two.
// Typically each new segment is either (1) the previous segment translated up or down a little or (2) a
// discrete change in direction/slope of the previous segment with no discontinuity.
// A segment becomes invalid once we reach the TAI start point of the next (numerical) segment. So, every
// TAI time (vertical line) intersects exactly one segment, and maps to exactly 1 UTC time, unless it
// precedes the beginning of TAI.
// A UTC time (horizontal line) can intersect 0, 1, 2 or theoretically many more segments, and hence map
// to multiple TAI times. We can return an array of these, or just the result from the latest segment
// (according to its numbering).
// The logic below should work even if these segments proceed horizontally, or UTC runs backwards, or if
// the period of validity of a segment is 0.

const munge = require('./munge')

const MODELS = munge.MODELS

module.exports.MODELS = MODELS

module.exports.Converter = (data, model) => {
  const segments = munge(data, model)

  /// Unix to TAI conversion methods

  const unixToAtomicPicos = unixMillis => {
    if (!Number.isInteger(unixMillis)) {
      throw Error(`Not an integer: ${unixMillis}`)
    }

    const atomicPicosArray = []
    for (const segment of segments) {
      // input bounds check
      if (!segment.unixMillisOnSegment(unixMillis)) {
        continue
      }

      // transformation
      const atomicPicos = segment.unixMillisToAtomicPicos(unixMillis)

      // output bounds check
      /* istanbul ignore if */
      if (!segment.atomicPicosOnSegment(atomicPicos)) {
        continue
      }

      atomicPicosArray.push(atomicPicos)
    }

    if (model === MODELS.OVERRUN_ARRAY) {
      return atomicPicosArray
    }

    const i = atomicPicosArray.length - 1

    return i in atomicPicosArray ? atomicPicosArray[i] : NaN
  }

  const unixToAtomic = unixMillis => {
    if (!Number.isInteger(unixMillis)) {
      throw Error(`Not an integer: ${unixMillis}`)
    }

    const atomicMillisArray = []
    for (const segment of segments) {
      // input bounds check
      if (!segment.unixMillisOnSegment(unixMillis)) {
        continue
      }

      // transformation
      const atomicMillis = segment.unixMillisToAtomicMillis(unixMillis)

      // output bounds check
      if (!segment.atomicMillisOnSegment(atomicMillis)) {
        continue
      }

      atomicMillisArray.push(atomicMillis)
    }

    if (model === MODELS.OVERRUN_ARRAY) {
      return atomicMillisArray
    }

    const i = atomicMillisArray.length - 1

    return i in atomicMillisArray ? atomicMillisArray[i] : NaN
  }

  /// TAI to Unix conversion methods

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
      const unixMillis = segment.atomicMillisToUnixMillis(atomicMillis)

      // output bounds check
      /* istanbul ignore if */
      if (!segment.unixMillisOnSegment(unixMillis)) {
        continue
      }

      // Otherwise assume overrun
      return unixMillis
    }

    // Pre-1961
    return NaN
  }

  if (
    model === MODELS.OVERRUN_ARRAY ||
    model === MODELS.OVERRUN_LAST
  ) {
    return {
      unixToAtomicPicos,
      unixToAtomic,
      atomicToUnix
    }
  }

  throw Error(`Unrecognised model: ${model}`)
}

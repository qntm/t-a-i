// The way to think about this is a 2D graph with TAI on the X axis, UTC on the Y, and a collection
// of numbered *rays*. Each ray starts at a well defined position in both TAI and UTC and proceeds
// diagonally up and to the right, expressing *one* relationship between the two.
// Typically each new ray is either (1) the previous ray translated up or down a little or (2) a
// discrete change in direction/slope of the previous ray with no discontinuity.
// A ray becomes invalid once we reach the TAI start point of the next (numerical) ray. So, every
// TAI time (vertical line) intersects exactly one ray, and maps to exactly 1 UTC time, unless it
// precedes the beginning of TAI.
// A UTC time (horizontal line) can intersect 0, 1, 2 or theoretically many more rays, and hence map
// to multiple TAI times. We can return an array of these, or just the result from the latest ray
// (according to its numbering).
// The logic below should work even if these rays proceed horizontally, or UTC runs backwards, or if
// the period of validity of a ray is 0.

const div = require('./div')
const munge = require('./munge')

const picosPerMilli = 1000n * 1000n * 1000n

const MODELS = {
  OVERRUN_ARRAY: 0,
  OVERRUN_LAST: 1,
  STALL_RANGE: 2,
  STALL_LAST: 3
}

module.exports.MODELS = MODELS

module.exports.Converter = (data, model) => {
  const rays = munge(data)

  /// Helper methods

  // Depending on its parameters, each ray linearly transforms `unixMillis`
  // into a different `atomicPicos`. This value is always exact
  const unixMillisToAtomicPicos = (ray, unixMillis) =>
    BigInt(unixMillis) * ray.ratio.atomicPicosPerUnixMilli +
      ray.offsetAtUnixEpoch.atomicPicos

  // Each ray has an inclusive-exclusive range of validity. TAI picosecond counts not in this range
  // are bad and should be ignored
  const atomicPicosOnRay = (ray, atomicPicos) =>
    ray.start.atomicPicos <= atomicPicos && atomicPicos < ray.end.atomicPicos

  // This result is rounded towards negative infinity. This means that, provided that `atomicPicos`
  // is in the ray, `unixMillis` is also guaranteed to be in the ray.
  const atomicPicosToUnixMillis = (ray, atomicPicos) =>
    Number(div(
      atomicPicos - ray.offsetAtUnixEpoch.atomicPicos,
      ray.ratio.atomicPicosPerUnixMilli
    ))

  /// Unix to TAI conversion methods

  const unixToAtomicPicos = unixMillis => {
    if (!Number.isInteger(unixMillis)) {
      throw Error(`Not an integer: ${unixMillis}`)
    }

    const atomicPicosArray = []
    for (const ray of rays) {
      const atomicPicos = unixMillisToAtomicPicos(ray, unixMillis)
      if (atomicPicosOnRay(ray, atomicPicos)) {
        atomicPicosArray.push(atomicPicos)
      }
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
    for (const ray of rays) {
      const atomicPicos = unixMillisToAtomicPicos(ray, unixMillis)
      const atomicMillis = Number(div(atomicPicos, picosPerMilli)) // rounds to negative infinity

      if (
        // It is CRITICALLY IMPORTANT to perform BOTH of these tests.
        // `unixMillis` and `atomicPicos` may fall at the very start of one ray while
        // `atomicMillis` rounds towards negative infinity and falls at the very end of the
        // previous ray instead. When this happens, we must not return `atomicMillis`
        // - it's not a valid part of EITHER ray.
        atomicPicosOnRay(ray, atomicPicos) &&
        atomicPicosOnRay(ray, BigInt(atomicMillis) * picosPerMilli)
      ) {
        atomicMillisArray.push(atomicMillis)
      }
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

    const atomicPicos = BigInt(atomicMillis) * picosPerMilli

    const rayId = rays.findIndex(ray =>
      atomicPicosOnRay(ray, atomicPicos)
    )

    if (rayId === -1) {
      // Pre-1961
      return NaN
    }

    const unixMillis = atomicPicosToUnixMillis(rays[rayId], atomicPicos)

    // Apply stalling behaviour
    if (model === MODELS.STALL_LAST) {
      return Math.min(
        unixMillis,
        rays[rayId].stall.unixMillis
      )
    }

    // Otherwise assume overrun
    return unixMillis
  }

  if (
    model === MODELS.OVERRUN_ARRAY ||
    model === MODELS.OVERRUN_LAST ||
    model === MODELS.STALL_LAST
  ) {
    return {
      unixToAtomicPicos,
      unixToAtomic,
      atomicToUnix
    }
  }

  throw Error(`Unrecognised model: ${model}`)
}

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
  // into a different `atomicPicos`. This value is always exact, but there is NO BOUNDS CHECKING.
  const unixMillisToAtomicPicos = (ray, unixMillis) =>
    BigInt(unixMillis) * ray.ratio.atomicPicosPerUnixMilli +
      ray.offsetAtUnixEpoch.atomicPicos

  // This value is rounded towards negative infinity. Again, there is no bounds checking. The
  // rounding may round an `atomicPicos` which was in bounds to an `atomicMillis` which is not.
  const unixMillisToAtomicMillis = (ray, unixMillis) =>
    Number(div(unixMillisToAtomicPicos(ray, unixMillis), picosPerMilli))

  // This result is rounded towards negative infinity. Again, there is no bounds checking.
  // However, because (for now) rays always begin on an exact Unix millisecond count,
  // if `atomicPicos` is on the ray, `unixMillis` is too.
  const atomicPicosToUnixMillis = (ray, atomicPicos) =>
    Number(div(
      atomicPicos - ray.offsetAtUnixEpoch.atomicPicos,
      ray.ratio.atomicPicosPerUnixMilli
    ))

  // Likewise rounded to negative infinity, but if `atomicMillis` is on the ray, so is `unixMillis`.
  const atomicMillisToUnixMillis = (ray, atomicMillis) =>
    atomicPicosToUnixMillis(ray, BigInt(atomicMillis) * picosPerMilli)

  // Bounds checks. Each ray has an inclusive-exclusive range of validity.
  // Valid TAI instants are from the computed TAI start of the ray to the computed TAI start of the
  // next ray. Valid Unix instants are the valid TAI instants, transformed linearly from TAI to
  // Unix by the ray.
  const atomicPicosOnRay = (ray, atomicPicos) =>
    ray.start.atomicPicos <= atomicPicos && atomicPicos < ray.end.atomicPicos

  const atomicMillisOnRay = (ray, atomicMillis) =>
    atomicPicosOnRay(ray, BigInt(atomicMillis) * picosPerMilli)

  const unixMillisOnRay = (ray, unixMillis) =>
    atomicPicosOnRay(ray, unixMillisToAtomicPicos(ray, unixMillis))

  /// Unix to TAI conversion methods

  const unixToAtomicPicos = unixMillis => {
    if (!Number.isInteger(unixMillis)) {
      throw Error(`Not an integer: ${unixMillis}`)
    }

    const atomicPicosArray = []
    for (const ray of rays) {
      // input bounds check
      if (!unixMillisOnRay(ray, unixMillis)) {
        continue
      }

      // transformation
      const atomicPicos = unixMillisToAtomicPicos(ray, unixMillis)

      // output bounds check
      /* istanbul ignore if */
      if (!atomicPicosOnRay(ray, atomicPicos)) {
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
    for (const ray of rays) {
      // input bounds check
      if (!unixMillisOnRay(ray, unixMillis)) {
        continue
      }

      // transformation
      const atomicMillis = unixMillisToAtomicMillis(ray, unixMillis)

      // output bounds check
      if (!atomicMillisOnRay(ray, atomicMillis)) {
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

    for (const ray of rays) {
      // input bounds check
      if (!atomicMillisOnRay(ray, atomicMillis)) {
        continue
      }

      // transformation
      const unixMillis = atomicMillisToUnixMillis(ray, atomicMillis)

      // output bounds check
      /* istanbul ignore if */
      if (!unixMillisOnRay(ray, unixMillis)) {
        continue
      }

      // Apply stalling behaviour
      if (model === MODELS.STALL_LAST) {
        return Math.min(
          unixMillis,
          ray.stall.unixMillis
        )
      }

      // Otherwise assume overrun
      return unixMillis
    }

    // Pre-1961
    return NaN
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

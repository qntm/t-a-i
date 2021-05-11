const div = require('./div')

const picosPerMilli = 1000n * 1000n * 1000n

// A segment is a bounded linear relationship between TAI and Unix time.
class Segment {
  constructor (start, end, dy, dx, stall) {
    this.start = start // unixMillis, atomicPicos
    this.end = end // atomicPicos only (unixMillis is inexact in most cases)
    this.dy = dy // unixMillis
    this.dx = dx // atomicPicos
    this.stall = stall // temporary
  }

  // This segment linearly transforms `unixMillis` into a different `atomicPicos`
  // This value is always exact FOR NOW, but there is NO BOUNDS CHECKING.
  // If the line is flat (dy = 0) this throws an exception, currently.
  unixMillisToAtomicPicos (unixMillis) {
    return this.start.atomicPicos +
      div(
        BigInt(unixMillis - this.start.unixMillis) * this.dx.atomicPicos,
        BigInt(this.dy.unixMillis)
      )
  }

  // This value is rounded towards negative infinity. Again, there is no bounds checking. The
  // rounding may round an `atomicPicos` which was in bounds to an `atomicMillis` which is not.
  unixMillisToAtomicMillis (unixMillis) {
    return Number(div(
      this.unixMillisToAtomicPicos(unixMillis),
      picosPerMilli
    ))
  }

  // This result is rounded towards negative infinity. Again, there is no bounds checking.
  // However, because (for now) segments always begin on an exact Unix millisecond count,
  // if `atomicPicos` is on the segment, `unixMillis` is too.
  atomicPicosToUnixMillis (atomicPicos) {
    return this.start.unixMillis +
      Number(div(
        (atomicPicos - this.start.atomicPicos) * BigInt(this.dy.unixMillis),
        this.dx.atomicPicos
      ))
  }

  // Likewise rounded to negative infinity, but if `atomicMillis` is on the ray, so is `unixMillis`.
  atomicMillisToUnixMillis (atomicMillis) {
    return this.atomicPicosToUnixMillis(BigInt(atomicMillis) * picosPerMilli)
  }

  // Bounds checks. Each segment has an inclusive-exclusive range of validity.
  // Valid TAI instants are from the computed TAI start of the segment to the computed TAI end of
  // the segment. Valid Unix instants are the valid TAI instants, transformed linearly from TAI to
  // Unix by the segment.
  atomicPicosOnSegment (atomicPicos) {
    return this.start.atomicPicos <= atomicPicos && atomicPicos < this.end.atomicPicos
  }

  atomicMillisOnSegment (atomicMillis) {
    return this.atomicPicosOnSegment(BigInt(atomicMillis) * picosPerMilli)
  }

  unixMillisOnSegment (unixMillis) {
    return this.atomicPicosOnSegment(this.unixMillisToAtomicPicos(unixMillis))
  }
}

module.exports.Segment = Segment

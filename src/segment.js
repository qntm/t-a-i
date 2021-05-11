const div = require('./div')

const picosPerMilli = 1000n * 1000n * 1000n

// A segment is a bounded linear relationship between TAI and Unix time.
// It should be able to handle arbitrary ratios between the two.
class Segment {
  constructor (start, end, dy, dx) {
    this.start = start // unixMillis, atomicPicos
    this.end = end // atomicPicos only (unixMillis is inexact in most cases)
    this.dy = dy // unixMillis
    this.dx = dx // atomicPicos
  }

  // This segment linearly transforms `unixMillis` into a different `atomicPicos`
  // This value is rounded towards negative infinity. There is NO BOUNDS CHECKING.
  // If the line is flat (dy = 0) this throws an exception, currently.
  unixMillisToAtomicPicos (unixMillis) {
    if (this.dy.unixMillis === 0) {
      if (unixMillis === this.start.unixMillis) {
        // Nailed it
        return [this.start.atomicPicos, this.end.atomicPicos]
      }

      return [NaN, NaN]
    }

    const atomicPicos = div(
      this.start.atomicPicos * BigInt(this.dy.unixMillis) +
        BigInt(unixMillis - this.start.unixMillis) * this.dx.atomicPicos,
      BigInt(this.dy.unixMillis)
    )

    return atomicPicos
  }

  // This value is rounded towards negative infinity. Again, there is no bounds checking. The
  // rounding may round an `atomicPicos` which was in bounds to an `atomicMillis` which is not.
  unixMillisToAtomicMillis (unixMillis) {
    return Number(div(
      this.start.atomicPicos * BigInt(this.dy.unixMillis) +
        BigInt(unixMillis - this.start.unixMillis) * this.dx.atomicPicos,
      BigInt(this.dy.unixMillis) * picosPerMilli
    ))
  }

  // This result is rounded towards negative infinity. Again, there is no bounds checking.
  // However, because (for now) segments always begin on an exact Unix millisecond count,
  // if `atomicMillis` is on the segment, `unixMillis` is too.
  atomicMillisToUnixMillis (atomicMillis) {
    const atomicPicos = BigInt(atomicMillis) * picosPerMilli

    return Number(div(
      BigInt(this.start.unixMillis) * this.dx.atomicPicos +
        (atomicPicos - this.start.atomicPicos) * BigInt(this.dy.unixMillis),
      this.dx.atomicPicos
    ))
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
    const z = BigInt(unixMillis - this.start.unixMillis) * this.dx.atomicPicos

    return z >= 0n && (
      this.end.atomicPicos === Infinity ||
      z < (this.end.atomicPicos - this.start.atomicPicos) * BigInt(this.dy.unixMillis)
    )
  }
}

module.exports.Segment = Segment

const { Rat } = require('./rat')

// A segment is a closed-open linear relationship between TAI and Unix time.
// It should be able to handle arbitrary ratios between the two.
// For precision, we deal with ratios of BigInts.
// Segment validity ranges are inclusive-exclusive.
class Segment {
  constructor (start, end, unixPerAtomic) {
    this.slope = { unixPerAtomic }

    // Start is inclusive.
    this.start = start

    // End is exclusive.
    this.end = { ...end }
    if (end.atomic === Infinity) {
      this.end.unix = Infinity
    } else {
      if (!this.start.atomic.lt(end.atomic)) {
        throw Error('Segment length must be positive')
      }

      this.end.unix = end.atomic
        .minus(this.start.atomic)
        .times(this.slope.unixPerAtomic)
        .plus(this.start.unix)
    }
  }

  unixToAtomicRange (unix) {
    if (this.slope.unixPerAtomic.eq(new Rat(0n))) {
      if (!unix.eq(this.start.unix)) {
        throw Error('This Unix time never happened')
      }

      return {
        start: this.start.atomic,
        end: this.end.atomic,
        open: true
      }
    }

    const atomic = unix
      .minus(this.start.unix)
      .divide(this.slope.unixPerAtomic)
      .plus(this.start.atomic)

    return {
      start: atomic,
      end: atomic
    }
  }

  atomicToUnix (atomic) {
    return atomic
      .minus(this.start.atomic)
      .times(this.slope.unixPerAtomic)
      .plus(this.start.unix)
  }

  // Bounds checks. Each segment has an inclusive-exclusive range of validity.
  // Valid TAI instants are from the computed TAI start of the segment to the computed TAI end of
  // the segment. Valid Unix instants are the valid TAI instants, transformed linearly from TAI to
  // Unix by the segment.

  atomicOnSegment (atomic) {
    return this.start.atomic.le(atomic) && (
      this.end.atomic === Infinity ||
      this.end.atomic
        .gt(atomic)
    )
  }

  unixOnSegment (unix) {
    return this.slope.unixPerAtomic.eq(new Rat(0n))
      ? this.start.unix.eq(unix)
      : this.start.unix.le(unix) && (
        this.end.unix === Infinity ||
        this.end.unix.gt(unix)
      )
  }
}

module.exports.Segment = Segment

const { Rat } = require('./rat')

// A segment is a closed linear relationship between TAI and Unix time.
// It should be able to handle arbitrary ratios between the two.
// For precision, we deal with ratios of BigInts.
// Segment validity ranges are inclusive-exclusive.
class Segment {
  constructor (start, end, unixPerAtomic) {
    this.slope = { unixPerAtomic }

    // Start is inclusive.
    this.start = {}
    this.start.atomicRatio = new Rat(start.atomicPicos, 1_000_000_000_000n)
    this.start.unixRatio = start.unixRatio

    // End is exclusive.
    this.end = {}
    if (end.atomicRatio === Infinity) {
      this.end.atomicRatio = Infinity
      this.end.unixRatio = Infinity
    } else {
      if (!this.start.atomicRatio.lt(end.atomicRatio)) {
        throw Error('Segment length must be positive')
      }

      this.end.atomicRatio = end.atomicRatio
      this.end.unixRatio = end.atomicRatio
        .minus(this.start.atomicRatio)
        .times(this.slope.unixPerAtomic)
        .plus(this.start.unixRatio)
    }
  }

  unixRatioToAtomicRatioRange (unixRatio) {
    if (this.slope.unixPerAtomic.eq(new Rat(0n))) {
      if (!unixRatio.eq(this.start.unixRatio)) {
        throw Error('This Unix time never happened')
      }

      return {
        start: this.start.atomicRatio,
        end: this.end.atomicRatio,
        closed: false
      }
    }

    const atomicRatio = unixRatio
      .minus(this.start.unixRatio)
      .divide(this.slope.unixPerAtomic)
      .plus(this.start.atomicRatio)

    return {
      start: atomicRatio,
      end: atomicRatio,
      closed: true
    }
  }

  atomicRatioToUnixRatio (atomicRatio) {
    return atomicRatio
      .minus(this.start.atomicRatio)
      .times(this.slope.unixPerAtomic)
      .plus(this.start.unixRatio)
  }

  // Bounds checks. Each segment has an inclusive-exclusive range of validity.
  // Valid TAI instants are from the computed TAI start of the segment to the computed TAI end of
  // the segment. Valid Unix instants are the valid TAI instants, transformed linearly from TAI to
  // Unix by the segment.

  atomicRatioOnSegment (atomicRatio) {
    return this.start.atomicRatio.le(atomicRatio) && (
      this.end.atomicRatio === Infinity ||
      this.end.atomicRatio
        .gt(atomicRatio)
    )
  }

  unixRatioOnSegment (unixRatio) {
    return this.slope.unixPerAtomic.eq(new Rat(0n))
      ? this.start.unixRatio.eq(unixRatio)
      : this.start.unixRatio.le(unixRatio) && (
        this.end.unixRatio === Infinity ||
        this.end.unixRatio.gt(unixRatio)
      )
  }
}

module.exports.Segment = Segment

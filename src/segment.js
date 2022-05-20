const { Rat } = require('./rat')

// A segment is a closed linear relationship between TAI and Unix time.
// It should be able to handle arbitrary ratios between the two.
// For precision, we deal with ratios of BigInts.
// Segment validity ranges are inclusive-exclusive.
class Segment {
  constructor (start, end, dy, dx) {
    if (!(start.atomicPicos < end.atomicPicos)) {
      throw Error('Segment length must be positive')
    }

    this.slope = {
      unixMillisPerAtomicPico: new Rat(BigInt(dy.unixMillis), dx.atomicPicos)
    }

    // Start is inclusive.
    // `atomicPicos` and `unixMillis` are exact.
    this.start = {}
    this.start.atomicRatio = new Rat(start.atomicPicos, 1_000_000_000_000n)
    this.start.unixRatio = new Rat(BigInt(start.unixMillis), 1000n)

    // End is exclusive.
    // `atomicPicos` is exact, no exact integer `unixMillis` is possible in most cases
    this.end = {}
    if (end.atomicPicos === Infinity) {
      this.end.atomicRatio = Infinity
      this.end.unixRatio = Infinity
    } else {
      this.end.atomicRatio = new Rat(end.atomicPicos, 1_000_000_000_000n)
      this.end.unixRatio = this.end.atomicRatio
        .minus(this.start.atomicRatio)
        .times(new Rat(1_000_000_000_000n))
        .times(this.slope.unixMillisPerAtomicPico)
        .plus(this.start.unixRatio.times(new Rat(1000n)))
        .divide(new Rat(1000n))
    }
  }

  unixRatioToAtomicRatioRange (unixRatio) {
    const unixMillisRatio = unixRatio.times(new Rat(1000n))
    if (this.slope.unixMillisPerAtomicPico.eq(new Rat(0n))) {
      if (!unixMillisRatio.eq(this.start.unixRatio.times(new Rat(1000n)))) {
        throw Error('This Unix time never happened')
      }

      return {
        start: this.start.atomicRatio,
        end: this.end.atomicRatio,
        closed: false
      }
    }

    const atomicRatio = unixMillisRatio
      .minus(this.start.unixRatio.times(new Rat(1000n)))
      .divide(this.slope.unixMillisPerAtomicPico)
      .divide(new Rat(1_000_000_000_000n))
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
      .times(new Rat(1_000_000_000_000n))
      .times(this.slope.unixMillisPerAtomicPico)
      .plus(this.start.unixRatio.times(new Rat(1000n)))
      .divide(new Rat(1000n))
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
    return this.slope.unixMillisPerAtomicPico.eq(new Rat(0n))
      ? this.start.unixRatio.eq(unixRatio)
      : this.start.unixRatio.le(unixRatio) && (
        this.end.unixRatio === Infinity ||
        this.end.unixRatio.gt(unixRatio)
      )
  }
}

module.exports.Segment = Segment

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
    this.start.atomicPicos = start.atomicPicos
    this.start.atomicPicosRatio = new Rat(this.start.atomicPicos)
    this.start.unixRatio = new Rat(BigInt(start.unixMillis), 1000n)

    // End is exclusive.
    // `atomicPicos` is exact, no exact integer `unixMillis` is possible in most cases
    this.end = {}
    this.end.atomicPicos = end.atomicPicos
    if (this.end.atomicPicos === Infinity) {
      this.end.atomicPicosRatio = Infinity
      this.end.unixRatio = Infinity
    } else {
      this.end.atomicPicosRatio = new Rat(this.end.atomicPicos)
      this.end.unixRatio = this.end.atomicPicosRatio
        .minus(this.start.atomicPicosRatio)
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
        start: this.start.atomicPicosRatio.divide(new Rat(1_000_000_000_000n)),
        end: this.end.atomicPicosRatio.divide(new Rat(1_000_000_000_000n)),
        closed: false
      }
    }

    const atomicRatio = unixMillisRatio
      .minus(this.start.unixRatio.times(new Rat(1000n)))
      .divide(this.slope.unixMillisPerAtomicPico)
      .plus(this.start.atomicPicosRatio)
      .divide(new Rat(1_000_000_000_000n))

    return {
      start: atomicRatio,
      end: atomicRatio,
      closed: true
    }
  }

  atomicRatioToUnixRatio (atomicRatio) {
    return atomicRatio.times(new Rat(1_000_000_000_000n))
      .minus(this.start.atomicPicosRatio)
      .times(this.slope.unixMillisPerAtomicPico)
      .plus(this.start.unixRatio.times(new Rat(1000n)))
      .divide(new Rat(1000n))
  }

  // Bounds checks. Each segment has an inclusive-exclusive range of validity.
  // Valid TAI instants are from the computed TAI start of the segment to the computed TAI end of
  // the segment. Valid Unix instants are the valid TAI instants, transformed linearly from TAI to
  // Unix by the segment.

  atomicRatioOnSegment (atomicRatio) {
    const atomicPicosRatio = atomicRatio.times(new Rat(1_000_000_000_000n))
    return this.start.atomicPicosRatio.le(atomicPicosRatio) && (
      this.end.atomicPicosRatio === Infinity ||
      this.end.atomicPicosRatio
        .gt(atomicPicosRatio)
    )
  }

  unixRatioOnSegment (unixRatio) {
    const unixMillisRatio = unixRatio.times(new Rat(1000n))
    return this.slope.unixMillisPerAtomicPico.eq(new Rat(0n))
      ? this.start.unixRatio.times(new Rat(1000n)).eq(unixMillisRatio)
      : this.start.unixRatio.times(new Rat(1000n)).le(unixMillisRatio) && (
        this.end.unixRatio === Infinity ||
        this.end.unixRatio.times(new Rat(1000n))
          .gt(unixMillisRatio)
      )
  }
}

module.exports.Segment = Segment

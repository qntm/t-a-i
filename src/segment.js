const { Rat } = require('./rat')

const picosPerMilli = 1000n * 1000n * 1000n

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
    this.start.atomicMillisRatio = this.start.atomicPicosRatio.divide(new Rat(picosPerMilli))
    this.start.unixMillisRatio = new Rat(BigInt(start.unixMillis))

    // End is exclusive.
    // `atomicPicos` is exact, no exact integer `unixMillis` is possible in most cases
    this.end = {}
    this.end.atomicPicos = end.atomicPicos
    if (this.end.atomicPicos === Infinity) {
      this.end.atomicPicosRatio = Infinity
      this.end.atomicMillisRatio = Infinity
      this.end.unixMillisRatio = Infinity
    } else {
      this.end.atomicPicosRatio = new Rat(this.end.atomicPicos)
      this.end.atomicMillisRatio = this.end.atomicPicosRatio.divide(new Rat(picosPerMilli))
      this.end.unixMillisRatio = this.end.atomicPicosRatio
        .minus(this.start.atomicPicosRatio)
        .times(this.slope.unixMillisPerAtomicPico)
        .plus(this.start.unixMillisRatio)
    }
  }

  unixRatioToAtomicPicosRatioRange (unixRatio) {
    const unixMillisRatio = unixRatio.times(new Rat(1000n))
    if (this.slope.unixMillisPerAtomicPico.eq(new Rat(0n))) {
      if (!unixMillisRatio.eq(this.start.unixMillisRatio)) {
        throw Error('This Unix time never happened')
      }

      return {
        start: this.start.atomicPicosRatio,
        end: this.end.atomicPicosRatio,
        closed: false
      }
    }

    const atomicPicosRatio = unixMillisRatio
      .minus(this.start.unixMillisRatio)
      .divide(this.slope.unixMillisPerAtomicPico)
      .plus(this.start.atomicPicosRatio)

    return {
      start: atomicPicosRatio,
      end: atomicPicosRatio,
      closed: true
    }
  }

  atomicRatioToUnixRatio (atomicRatio) {
    return atomicRatio.times(new Rat(1_000_000_000_000n))
      .minus(this.start.atomicPicosRatio)
      .times(this.slope.unixMillisPerAtomicPico)
      .plus(this.start.unixMillisRatio)
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
      ? this.start.unixMillisRatio.eq(unixMillisRatio)
      : this.start.unixMillisRatio.le(unixMillisRatio) && (
        this.end.unixMillisRatio === Infinity ||
        this.end.unixMillisRatio
          .gt(unixMillisRatio)
      )
  }
}

module.exports.Segment = Segment

const { Rat } = require('./rat')

const picosPerMilli = 1000n * 1000n * 1000n

// A segment is a bounded linear relationship between TAI and Unix time.
// It should be able to handle arbitrary ratios between the two. Where possible we deal with ratios
// of BigInts for precision.
// TODO: handle case where dy = 0
class Segment {
  constructor (start, end, dy, dx) {
    if (end.atomicPicos <= start.atomicPicos) {
      throw Error('Segment length must be positive')
    }

    this.start = {
      atomicPicosRatio: new Rat(start.atomicPicos),
      unixMillisRatio: new Rat(BigInt(start.unixMillis))
    }

    this.end = {
      atomicPicosRatio: end.atomicPicos === Infinity
        ? Infinity
        : new Rat(end.atomicPicos)
    }

    this.slope = {
      unixMillisPerAtomicPico: new Rat(BigInt(dy.unixMillis), dx.atomicPicos)
    }
  }

  // Returns two BigInts which when divided give the exact atomic picosecond count.
  _unixMillisRatioToAtomicPicosRatio (unixMillisRatio) {
    if (this.slope.unixMillisPerAtomicPico.eq(new Rat(0n))) {
      if (unixMillisRatio.eq(this.start.unixMillisRatio)) {
        // For now return just the end of the segment.
        // TODO: return a closed range
        return this.end.atomicPicosRatio
      }

      throw Error('This segment is flat, this Unix time never happened')
    }

    const atomicPicosRatio = unixMillisRatio
      .minus(this.start.unixMillisRatio)
      .divide(this.slope.unixMillisPerAtomicPico)
      .plus(this.start.atomicPicosRatio)

    return atomicPicosRatio
  }

  // Returns two BigInts which when divided give the exact Unix millisecond count.
  _atomicPicosRatioToUnixMillisRatio (atomicPicosRatio) {
    return atomicPicosRatio
      .minus(this.start.atomicPicosRatio)
      .times(this.slope.unixMillisPerAtomicPico)
      .plus(this.start.unixMillisRatio)
  }

  // This segment linearly transforms `unixMillis` into a different `atomicPicos`
  // This value is rounded towards negative infinity. There is NO BOUNDS CHECKING.
  // If the line is flat (dy = 0) this throws an exception, currently.
  // The rounding may round an `atomicPicos` which was in bounds to an `atomicMillis` which is not.
  unixMillisToAtomicMillis (unixMillis) {
    const unixMillisRatio = new Rat(BigInt(unixMillis))
    const atomicPicosRatio = this._unixMillisRatioToAtomicPicosRatio(unixMillisRatio)
    const atomicMillisRatio = atomicPicosRatio.times(new Rat(1n, picosPerMilli))
    const atomicMillis = Number(atomicMillisRatio.trunc())
    return atomicMillis
  }

  // This result is rounded towards negative infinity. Again, there is no bounds checking.
  // However, because (for now) segments always begin on an exact Unix millisecond count,
  // if `atomicMillis` is on the segment, `unixMillis` is too.
  atomicMillisToUnixMillis (atomicMillis) {
    const atomicPicos = BigInt(atomicMillis) * picosPerMilli
    const atomicPicosRatio = new Rat(atomicPicos)
    const unixMillisRatio = this._atomicPicosRatioToUnixMillisRatio(atomicPicosRatio)
    const unixMillis = Number(unixMillisRatio.trunc())
    return unixMillis
  }

  // Bounds checks. Each segment has an inclusive-exclusive range of validity.
  // Valid TAI instants are from the computed TAI start of the segment to the computed TAI end of
  // the segment. Valid Unix instants are the valid TAI instants, transformed linearly from TAI to
  // Unix by the segment.

  atomicMillisOnSegment (atomicMillis) {
    const atomicPicos = BigInt(atomicMillis) * picosPerMilli
    const atomicPicosRatio = new Rat(atomicPicos)
    return this.start.atomicPicosRatio.le(atomicPicosRatio) && (
      this.end.atomicPicosRatio === Infinity ||
      this.end.atomicPicosRatio
        .gt(atomicPicosRatio)
    )
  }

  unixMillisOnSegment (unixMillis) {
    const unixMillisRatio = new Rat(BigInt(unixMillis))
    return this.start.unixMillisRatio.le(unixMillisRatio) && (
      this.end.atomicPicosRatio === Infinity ||
      this.end.atomicPicosRatio
        .minus(this.start.atomicPicosRatio)
        .times(this.slope.unixMillisPerAtomicPico)
        .plus(this.start.unixMillisRatio)
        .ge(unixMillisRatio)
    )
  }
}

module.exports.Segment = Segment

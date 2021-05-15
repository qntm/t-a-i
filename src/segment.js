const { Rat } = require('./rat')

const picosPerMilli = 1000n * 1000n * 1000n

// A segment is a closed linear relationship between TAI and Unix time.
// It should be able to handle arbitrary ratios between the two. Where possible we deal with ratios
// of BigInts for precision.
class Segment {
  constructor (start, end, dy, dx) {
    if (end.atomicPicos < start.atomicPicos) {
      throw Error('Segment length must be non-negative')
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

  unixMillisRatioToAtomicMillisRange (unixMillisRatio) {
    if (this.slope.unixMillisPerAtomicPico.eq(new Rat(0n))) {
      if (unixMillisRatio.eq(this.start.unixMillisRatio)) {
        const start = {}
        start.atomicMillisRatio = this.start.atomicPicosRatio.divide(new Rat(picosPerMilli))
        start.atomicMillis = Number(start.atomicMillisRatio.trunc())

        const end = {}
        end.atomicMillisRatio = this.end.atomicPicosRatio.divide(new Rat(picosPerMilli))
        end.atomicMillis = Number(end.atomicMillisRatio.trunc())

        return {
          start: start.atomicMillis,
          end: end.atomicMillis,
          closed: false
        }
      }

      throw Error('This segment is flat, this Unix time never happened')
    }

    const atomicPicosRatio = unixMillisRatio
      .minus(this.start.unixMillisRatio)
      .divide(this.slope.unixMillisPerAtomicPico)
      .plus(this.start.atomicPicosRatio)
    const atomicMillisRatio = atomicPicosRatio.divide(new Rat(picosPerMilli))
    const atomicMillis = Number(atomicMillisRatio.trunc())

    return {
      start: atomicMillis,
      end: atomicMillis,
      closed: true
    }
  }

  // Returns two BigInts which when divided give the exact Unix millisecond count.
  atomicPicosRatioToUnixMillisRatio (atomicPicosRatio) {
    return atomicPicosRatio
      .minus(this.start.atomicPicosRatio)
      .times(this.slope.unixMillisPerAtomicPico)
      .plus(this.start.unixMillisRatio)
  }

  // Bounds checks. Each segment has an inclusive range of validity.
  // Valid TAI instants are from the computed TAI start of the segment to the computed TAI end of
  // the segment. Valid Unix instants are the valid TAI instants, transformed linearly from TAI to
  // Unix by the segment.

  atomicPicosRatioOnSegment (atomicPicosRatio) {
    return this.start.atomicPicosRatio.le(atomicPicosRatio) && (
      this.end.atomicPicosRatio === Infinity ||
      this.end.atomicPicosRatio
        .gt(atomicPicosRatio)
    )
  }

  atomicMillisOnSegment (atomicMillis) {
    const atomicPicos = BigInt(atomicMillis) * picosPerMilli
    const atomicPicosRatio = new Rat(atomicPicos)
    return this.atomicPicosRatioOnSegment(atomicPicosRatio)
  }

  unixMillisRatioOnSegment (unixMillisRatio) {
    return this.start.unixMillisRatio.le(unixMillisRatio) && (
      this.end.atomicPicosRatio === Infinity ||
      this.end.atomicPicosRatio
        .minus(this.start.atomicPicosRatio)
        .times(this.slope.unixMillisPerAtomicPico)
        .plus(this.start.unixMillisRatio)
        .ge(unixMillisRatio)
    )
  }

  unixMillisOnSegment (unixMillis) {
    const unixMillisRatio = new Rat(BigInt(unixMillis))
    return this.unixMillisRatioOnSegment(unixMillisRatio)
  }
}

module.exports.Segment = Segment

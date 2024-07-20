import { Rat } from './rat.js'
import { Range } from './range.js'
import { Second } from './second.js'

// A segment is a closed-open linear relationship between TAI and Unix time.
// It should be able to handle arbitrary ratios between the two.
// For precision, we deal with ratios of BigInts.
// Segment validity ranges are inclusive-exclusive.
export class Segment {
  constructor (start, end = { atomic: Second.END_OF_TIME }, slope = { unixPerAtomic: new Rat(1n) }) {
    if (!(start.atomic instanceof Second)) {
      throw Error('TAI start must be a `Second`')
    }
    if (!(start.unix instanceof Second)) {
      throw Error('Unix start must be a `Second`')
    }
    if (!(end.atomic instanceof Second || end.atomic === Second.END_OF_TIME)) {
      throw Error('TAI end must be a `Second` or `Second.END_OF_TIME`')
    }
    if (!(slope.unixPerAtomic instanceof Rat)) {
      throw Error('slope must be a `Rat`')
    }
    if (end.atomic === Second.END_OF_TIME ? start.atomic === Second.END_OF_TIME : end.atomic.leS(start.atomic)) {
      throw Error('segment length must be positive')
    }

    this.slope = {
      unixPerAtomic: slope.unixPerAtomic
    }

    // Start is inclusive.
    this.start = {
      atomic: start.atomic,
      unix: start.unix
    }

    // End is exclusive.
    this.end = {
      atomic: end.atomic,
      unix: this.atomicToUnix(end.atomic)
    }
  }

  unixToAtomicRange (unix) {
    if (this.slope.unixPerAtomic.eq(new Rat(0n))) {
      if (!unix.eqS(this.start.unix)) {
        throw Error('This Unix time never happened')
      }

      return new Range(this.start.atomic, this.end.atomic, true)
    }

    const atomic = unix
      .minusS(this.start.unix)
      .divideR(this.slope.unixPerAtomic)
      .plusS(this.start.atomic)

    return new Range(atomic)
  }

  atomicToUnix (atomic) {
    if (atomic === Second.END_OF_TIME) {
      return Second.END_OF_TIME
    }

    return atomic
      .minusS(this.start.atomic)
      .timesR(this.slope.unixPerAtomic)
      .plusS(this.start.unix)
  }

  // Bounds checks. Each segment has an inclusive-exclusive range of validity.
  // Valid TAI instants are from the computed TAI start of the segment to the computed TAI end of
  // the segment. Valid Unix instants are the valid TAI instants, transformed linearly from TAI to
  // Unix by the segment.

  atomicOnSegment (atomic) {
    return this.start.atomic.leS(atomic) && (this.end.atomic === Second.END_OF_TIME ? atomic !== Second.END_OF_TIME : this.end.atomic.gtS(atomic))
  }

  unixOnSegment (unix) {
    return this.slope.unixPerAtomic.eq(new Rat(0n))
      ? this.start.unix.eqS(unix)
      : this.start.unix.leS(unix) && (this.end.unix === Second.END_OF_TIME ? unix !== Second.END_OF_TIME : this.end.unix.gtS(unix))
  }
}

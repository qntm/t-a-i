import { Rat } from './rat.js'

export class Second {
  constructor (rat) {
    this.rat = rat
  }

  plusS (other) {
    return new Second(this.rat.plus(other.rat))
  }

  minusS (other) {
    return new Second(this.rat.minus(other.rat))
  }

  timesR (other) {
    return new Second(this.rat.times(other))
  }

  divideR (other) {
    return new Second(this.rat.divide(other))
  }

  divideS (other) {
    return this.rat.divide(other.rat)
  }

  eqS (other) {
    return this.rat.eq(other.rat)
  }

  leS (other) {
    return this.rat.le(other.rat)
  }

  gtS (other) {
    return this.rat.gt(other.rat)
  }

  toMillis () {
    return this.rat.times(new Rat(1_000n)).trunc()
  }

  toNanos () {
    return this.rat.times(new Rat(1_000_000_000n)).trunc()
  }
}

Second.fromMillis = millis => {
  return new Second(new Rat(millis, 1_000n))
}

Second.fromNanos = nanos => {
  return new Second(new Rat(nanos, 1_000_000_000n))
}

Second.END_OF_TIME = Symbol('end of time')

import { Rat } from './rat.js'

export class Second {
  constructor (nu, de) {
    this.rat = new Rat(nu, de)
  }

  plusS (other) {
    const sum = this.rat.plus(other.rat)
    return new Second(sum.nu, sum.de)
  }

  minusS (other) {
    const difference = this.rat.minus(other.rat)
    return new Second(difference.nu, difference.de)
  }

  timesR (other) {
    const product = this.rat.times(other)
    return new Second(product.nu, product.de)
  }

  divideR (other) {
    const quotient = this.rat.divide(other)
    return new Second(quotient.nu, quotient.de)
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
    return Number(this.rat.times(new Rat(1_000n)).trunc())
  }
}

Second.fromMillis = millis => {
  if (!Number.isInteger(millis)) {
    throw Error(`Not an integer: ${millis}`)
  }

  return new Second(BigInt(millis), 1_000n)
}

Second.END_OF_TIME = Symbol('end of time')

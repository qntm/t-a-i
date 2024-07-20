import { div, gcd } from './div.js'

export class Rat {
  constructor (nu, de = 1n) {
    if (typeof nu !== 'bigint') {
      throw Error('numerator must be a BigInt')
    }
    if (typeof de !== 'bigint') {
      throw Error('denominator must be a BigInt')
    }
    if (de === 0n) {
      throw Error('denominator cannot be zero')
    }

    const g = gcd(nu, de) // non-zero

    const g2 = (de < 0) === (g < 0) ? g : -g

    this.nu = nu / g2 // sign of `this.nu` is the sign of the represented rational
    this.de = de / g2 // positive
  }

  plus (other) {
    return new Rat(this.nu * other.de + this.de * other.nu, this.de * other.de)
  }

  minus (other) {
    return this.plus(new Rat(-other.nu, other.de))
  }

  times (other) {
    return new Rat(this.nu * other.nu, this.de * other.de)
  }

  divide (other) {
    return this.times(new Rat(other.de, other.nu))
  }

  eq (other) {
    return this.minus(other).nu === 0n
  }

  le (other) {
    return this.minus(other).nu <= 0n
  }

  gt (other) {
    return this.minus(other).nu > 0n
  }

  // Truncate the fraction towards negative infinity
  trunc () {
    return div(this.nu, this.de)
  }
}

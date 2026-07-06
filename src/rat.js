import { div, gcd, sign, abs } from './div.js'

export class Rat {
  constructor (nu, de = 1n) {
    if (typeof nu !== 'bigint') {
      throw Error('numerator must be a BigInt')
    }
    if (typeof de !== 'bigint') {
      throw Error('denominator must be a BigInt')
    }
    if (de <= 0n) {
      throw Error('denominator must be positive')
    }

    const g = gcd(abs(nu), de) // positive

    this.nu = nu / g // sign of `this.nu` is the sign of the represented rational
    this.de = de / g // positive
  }

  plus (other) {
    return new Rat(this.nu * other.de + this.de * other.nu, this.de * other.de)
  }

  minus (other) {
    return new Rat(this.nu * other.de - this.de * other.nu, this.de * other.de)
  }

  times (other) {
    return new Rat(this.nu * other.nu, this.de * other.de)
  }

  divide (other) {
    return new Rat(sign(other.nu) * this.nu * other.de, this.de * abs(other.nu))
  }

  eq (other) {
    return this.nu * other.de === other.nu * this.de
  }

  le (other) {
    return this.nu * other.de <= other.nu * this.de
  }

  gt (other) {
    return this.nu * other.de > other.nu * this.de
  }

  // Truncate the fraction towards negative infinity
  trunc () {
    return div(this.nu, this.de)
  }
}

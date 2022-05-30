const { div, gcd } = require('./div')

class Rat {
  constructor (nu, de = 1n) {
    if (typeof nu !== 'bigint') {
      throw Error('Numerator must be a BigInt')
    }
    if (typeof de !== 'bigint') {
      throw Error('Denominator must be a BigInt')
    }
    if (de === 0n && nu <= 0n) {
      throw Error('Numerator must be positive if denominator is zero')
    }

    const g = gcd(nu, de) // non-zero

    const g2 = (de < 0) === (g < 0) ? g : -g

    this.de = de / g2 // non-negative
    this.nu = nu / g2 // sign of `this.nu` is the sign of the represented rational
  }

  plus (other) {
    if (this.de === 0n && other.de === 0n) {
      return new Rat(this.nu + other.nu, 0n)
    }
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

  lt (other) {
    return this.minus(other).nu < 0n
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

  toMillis () {
    return Number(this.times(new Rat(1_000n)).trunc())
  }
}

// Support for this special value is limited. In all cases it either returns
// a correct, meaningful result, or throws an exception - it does NOT return
// bad results.
Rat.INFINITY = new Rat(1n, 0n)

Rat.fromMillis = millis => {
  if (!Number.isInteger(millis)) {
    throw Error(`Not an integer: ${millis}`)
  }

  return new Rat(BigInt(millis), 1_000n)
}

module.exports.Rat = Rat

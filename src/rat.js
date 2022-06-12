const { div, gcd } = require('./div')

class Rat {
  constructor (nu, de = 1n, power = 0) {
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

    this.power = power
  }

  plus (other) {
    if (other.power !== this.power) {
      throw Error(`Mismatched powers: s^${this.power} + s^${other.power}`)
    }
    if (this.de === 0n && other.de === 0n) {
      return new Rat(this.nu + other.nu, 0n, this.power)
    }
    return new Rat(this.nu * other.de + this.de * other.nu, this.de * other.de, this.power)
  }

  minus (other) {
    return this.plus(new Rat(-other.nu, other.de, other.power))
  }

  times (other) {
    return new Rat(this.nu * other.nu, this.de * other.de, this.power + other.power)
  }

  divide (other) {
    return this.times(new Rat(other.de, other.nu, -other.power))
  }

  cmp (other) {
    return this.minus(other).nu
  }

  eq (other) {
    return this.cmp(other) === 0n
  }

  lt (other) {
    return this.cmp(other) < 0n
  }

  le (other) {
    return this.cmp(other) <= 0n
  }

  gt (other) {
    return this.cmp(other) > 0n
  }

  // Truncate the fraction towards negative infinity
  trunc () {
    return div(this.nu, this.de)
  }

  toMillis () {
    if (this.power !== 1) {
      throw Error('Wrong power')
    }
    return Number(this.times(new Rat(1_000n)).trunc())
  }
}

// Support for this special value is limited. In all cases it either returns
// a correct, meaningful result, or throws an exception - it does NOT return
// bad results.
Rat.INFINITY = new Rat(1n, 0n, 1)

Rat.fromMillis = millis => {
  if (!Number.isInteger(millis)) {
    throw Error(`Not an integer: ${millis}`)
  }

  return new Rat(BigInt(millis), 1_000n, 1)
}

module.exports.Rat = Rat

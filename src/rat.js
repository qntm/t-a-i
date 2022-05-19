const { div, gcd } = require('./div')

class Rat {
  constructor (nu, de = 1n) {
    if (typeof nu !== 'bigint') {
      throw Error('Numerator must be a BigInt')
    }
    if (typeof de !== 'bigint') {
      throw Error('Denominator must be a BigInt')
    }
    if (de === 0n) {
      throw Error('Denominator must be non-zero')
    }

    const g = gcd(nu, de)
    this.nu = nu / g
    this.de = de / g // `this.de` is always positive
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

  cmp (other) {
    return this.nu * other.de - this.de * other.nu
  }

  eq (other) {
    return this.cmp(other) === 0n
  }

  le (other) {
    return this.cmp(other) <= 0n
  }

  gt (other) {
    return this.cmp(other) > 0n
  }

  trunc () {
    return div(this.nu, this.de)
  }
}

module.exports.Rat = Rat

const { sign, div } = require('./div')

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
    this.nu = nu
    this.de = de
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
    return new Rat(this.nu * other.de, this.de * other.nu)
  }

  cmp (other) {
    const det = this.nu * other.de - this.de * other.nu
    return sign(this.de) === sign(other.de) ? det : -det
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

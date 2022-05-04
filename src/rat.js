const { sign, div, gcd } = require('./div')

class Rat {
  constructor (nu, de = 1n) {
    if (typeof nu !== 'bigint') {
      throw Error('Numerator must be a BigInt')
    }
    if (typeof de !== 'bigint') {
      throw Error('Denominator must be a BigInt')
    }

    if (de === 0n) {
      // Positive and negative infinity and NaN
      // become 1/0, -1/0, 0/0 respectively
      this.nu = sign(nu)
      this.de = 0n
    } else if (nu === 0n) {
      // Positive and negative zero
      // become 0/1 and 0/-1 respectively
      this.nu = 0n
      this.de = sign(de)
    } else {
      const g = gcd(nu, de)
      this.nu = nu / g
      this.de = de / g
    }
  }

  plus (other) {
    return new Rat(this.nu * other.de + this.de * other.nu, this.de * other.de)
  }

  minus (other) {
    return this.plus(new Rat(-other.nu, other.de))
  }

  times (other) {
    return new Rat(
      this.nu * other.nu,
      sign(other.nu) * sign(this.nu) * this.de * other.de
    )
  }

  divide (other) {
    return this.times(new Rat(other.de, other.nu))
  }

  cmp (other) {
    return sign(this.de) * sign(other.de) * (this.nu * other.de - this.de * other.nu)
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

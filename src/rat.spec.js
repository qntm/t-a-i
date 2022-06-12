/* eslint-env jest */

const { Rat } = require('./rat')

describe('Rat', () => {
  it('type checking', () => {
    expect(() => new Rat(1, 2n)).toThrowError('Numerator must be a BigInt')
    expect(() => new Rat(1n, 2)).toThrowError('Denominator must be a BigInt')
    expect(() => new Rat(1n, 0)).toThrowError('Denominator must be a BigInt')
    expect(() => new Rat(-1n, 0n)).toThrowError('Numerator must be positive if denominator is zero')
  })

  it('defaults to an integer', () => {
    expect(new Rat(1n)).toEqual(new Rat(1n, 1n))
  })

  it('adds', () => {
    expect(() => new Rat(1n, 2n).plus(new Rat(1n, 3n, 1))).toThrowError('Mismatched powers: s^0 + s^1')
    expect(new Rat(1n, 2n).plus(new Rat(1n, 3n))).toEqual(new Rat(5n, 6n))
    expect(new Rat(1n, 2n).plus(new Rat(0n, 3n))).toEqual(new Rat(1n, 2n))
    expect(new Rat(0n, 2n).plus(new Rat(1n, 3n))).toEqual(new Rat(1n, 3n))
  })

  it('subtracts', () => {
    expect(new Rat(1n, 2n).minus(new Rat(1n, 3n))).toEqual(new Rat(1n, 6n))
    expect(new Rat(1n, 2n).minus(new Rat(0n, 3n))).toEqual(new Rat(1n, 2n))
    expect(new Rat(0n, 2n).minus(new Rat(1n, 3n))).toEqual(new Rat(-1n, 3n))
  })

  it('multiplies', () => {
    expect(new Rat(6n, 5n).times(new Rat(4n, 5n))).toEqual(new Rat(24n, 25n))
    expect(new Rat(6n, 5n).times(new Rat(0n, 5n))).toEqual(new Rat(0n, 25n))
    expect(new Rat(0n, 5n).times(new Rat(4n, 5n))).toEqual(new Rat(0n, 25n))
  })

  it('divides', () => {
    expect(new Rat(6n, 5n).divide(new Rat(4n, 5n))).toEqual(new Rat(30n, 20n))
    expect(new Rat(0n, 5n).divide(new Rat(4n, 5n))).toEqual(new Rat(0n, 20n))
  })

  it('greater than', () => {
    expect(new Rat(-1n, 3n).gt(new Rat(1n, -2n))).toBe(true)
    expect(new Rat(0n).gt(new Rat(1n))).toBe(false)
  })

  it('equal', () => {
    expect(new Rat(-1n, 3n).eq(new Rat(4n, -12n))).toBe(true)
    expect(new Rat(0n).eq(new Rat(-1n))).toBe(false)
    expect(new Rat(0n).eq(new Rat(-0n))).toBe(true)
  })

  it('less than or equal', () => {
    expect(new Rat(-2n, -3n).le(new Rat(-2n, -3n))).toBe(true)
    expect(new Rat(-2n, -3n).le(new Rat(2n, 3n))).toBe(true)
    expect(new Rat(9n, 12n).le(new Rat(6n, 8n))).toBe(true)
    expect(new Rat(9n, 13n).le(new Rat(6n, 8n))).toBe(true)
  })

  it('fromMillis', () => {
    expect(Rat.fromMillis(123)).toEqual(new Rat(123n, 1_000n, 1))
    expect(() => Rat.fromMillis(Infinity)).toThrowError()
  })

  it('toMillis', () => {
    expect(new Rat(123n, 1_000n, 1).toMillis()).toBe(123)
    expect(() => new Rat(123n, 1_000n).toMillis()).toThrowError('Wrong power')
  })

  describe('truncates', () => {
    it('positives', () => {
      expect(new Rat(18n, 10n).trunc()).toBe(1n)
      expect(new Rat(15n, 10n).trunc()).toBe(1n)
      expect(new Rat(12n, 10n).trunc()).toBe(1n)
      expect(new Rat(10n, 10n).trunc()).toBe(1n)
      expect(new Rat(8n, 10n).trunc()).toBe(0n)
      expect(new Rat(5n, 10n).trunc()).toBe(0n)
      expect(new Rat(2n, 10n).trunc()).toBe(0n)
      expect(new Rat(0n, 10n).trunc()).toBe(0n)
      expect(new Rat(-2n, 10n).trunc()).toBe(-1n)
      expect(new Rat(-5n, 10n).trunc()).toBe(-1n)
      expect(new Rat(-8n, 10n).trunc()).toBe(-1n)
      expect(new Rat(-10n, 10n).trunc()).toBe(-1n)
      expect(new Rat(-12n, 10n).trunc()).toBe(-2n)
      expect(new Rat(-15n, 10n).trunc()).toBe(-2n)
      expect(new Rat(-18n, 10n).trunc()).toBe(-2n)
    })

    it('negatives', () => {
      expect(new Rat(-18n, -10n).trunc()).toBe(1n)
      expect(new Rat(-15n, -10n).trunc()).toBe(1n)
      expect(new Rat(-12n, -10n).trunc()).toBe(1n)
      expect(new Rat(-10n, -10n).trunc()).toBe(1n)
      expect(new Rat(-8n, -10n).trunc()).toBe(0n)
      expect(new Rat(-5n, -10n).trunc()).toBe(0n)
      expect(new Rat(-2n, -10n).trunc()).toBe(0n)
      expect(new Rat(0n, -10n).trunc()).toBe(0n)
      expect(new Rat(2n, -10n).trunc()).toBe(-1n)
      expect(new Rat(5n, -10n).trunc()).toBe(-1n)
      expect(new Rat(8n, -10n).trunc()).toBe(-1n)
      expect(new Rat(10n, -10n).trunc()).toBe(-1n)
      expect(new Rat(12n, -10n).trunc()).toBe(-2n)
      expect(new Rat(15n, -10n).trunc()).toBe(-2n)
      expect(new Rat(18n, -10n).trunc()).toBe(-2n)
    })
  })

  describe('positive infinity', () => {
    it('reduces to the lowest terms', () => {
      expect(Rat.INFINITY).toEqual(new Rat(133n, 0n, 1))
    })

    it('adds', () => {
      expect(Rat.INFINITY.plus(new Rat(15n, 69n, 1))).toEqual(Rat.INFINITY)
      expect(Rat.INFINITY.plus(new Rat(0n, 3n, 1))).toEqual(Rat.INFINITY)
      expect(Rat.INFINITY.plus(new Rat(-12n, 1n, 1))).toEqual(Rat.INFINITY)
      expect(new Rat(15n, 69n, 1).plus(Rat.INFINITY)).toEqual(Rat.INFINITY)
      expect(new Rat(0n, 3n, 1).plus(Rat.INFINITY)).toEqual(Rat.INFINITY)
      expect(new Rat(-12n, 1n, 1).plus(Rat.INFINITY)).toEqual(Rat.INFINITY)
      expect(Rat.INFINITY.plus(Rat.INFINITY)).toEqual(Rat.INFINITY)
    })

    it('subtracts', () => {
      expect(Rat.INFINITY.minus(new Rat(15n, 69n, 1))).toEqual(Rat.INFINITY)
      expect(Rat.INFINITY.minus(new Rat(0n, 3n, 1))).toEqual(Rat.INFINITY)
      expect(Rat.INFINITY.minus(new Rat(-12n, 1n, 1))).toEqual(Rat.INFINITY)
      expect(() => new Rat(15n, 69n, 1).minus(Rat.INFINITY)).toThrowError()
      expect(() => new Rat(0n, 3n, 1).minus(Rat.INFINITY)).toThrowError()
      expect(() => new Rat(-12n, 1n, 1).minus(Rat.INFINITY)).toThrowError()
      expect(() => Rat.INFINITY.minus(Rat.INFINITY)).toThrowError()
    })

    it('multiplies', () => {
      expect(Rat.INFINITY.times(new Rat(15n, 69n))).toEqual(Rat.INFINITY)
      expect(() => Rat.INFINITY.times(new Rat(0n, 3n))).toThrowError()
      expect(() => Rat.INFINITY.times(new Rat(-12n, 1n))).toThrowError()
      expect(new Rat(15n, 69n).times(Rat.INFINITY)).toEqual(Rat.INFINITY)
      expect(() => new Rat(0n, 3n).times(Rat.INFINITY)).toThrowError()
      expect(() => new Rat(-12n, 1n).times(Rat.INFINITY)).toThrowError()
      expect(Rat.INFINITY.times(Rat.INFINITY)).toEqual(new Rat(1n, 0n, 2))
    })

    it('divides', () => {
      expect(Rat.INFINITY.divide(new Rat(15n, 69n))).toEqual(Rat.INFINITY)
      expect(Rat.INFINITY.divide(new Rat(0n, 3n))).toEqual(Rat.INFINITY)
      expect(() => Rat.INFINITY.divide(new Rat(-12n, 1n))).toThrowError('Numerator must be positive if denominator is zero')
      expect(new Rat(15n, 69n, 1).divide(Rat.INFINITY)).toEqual(new Rat(0n))
      expect(new Rat(0n, 3n, 1).divide(Rat.INFINITY)).toEqual(new Rat(0n))
      expect(new Rat(-12n, 1n, 1).divide(Rat.INFINITY)).toEqual(new Rat(0n))
      expect(() => Rat.INFINITY.divide(Rat.INFINITY)).toThrowError()
    })

    it('equals', () => {
      expect(Rat.INFINITY.eq(new Rat(15n, 69n, 1))).toBe(false)
      expect(Rat.INFINITY.eq(new Rat(0n, 3n, 1))).toBe(false)
      expect(Rat.INFINITY.eq(new Rat(-12n, 1n, 1))).toBe(false)
      expect(() => new Rat(15n, 69n, 1).eq(Rat.INFINITY)).toThrowError()
      expect(() => new Rat(0n, 3n, 1).eq(Rat.INFINITY)).toThrowError()
      expect(() => new Rat(-12n, 1n, 1).eq(Rat.INFINITY)).toThrowError()
      expect(() => Rat.INFINITY.eq(Rat.INFINITY)).toThrowError()
    })

    it('less than', () => {
      expect(Rat.INFINITY.lt(new Rat(15n, 69n, 1))).toBe(false)
      expect(Rat.INFINITY.lt(new Rat(0n, 3n, 1))).toBe(false)
      expect(Rat.INFINITY.lt(new Rat(-12n, 1n, 1))).toBe(false)
      expect(() => new Rat(15n, 69n, 1).lt(Rat.INFINITY)).toThrowError()
      expect(() => new Rat(0n, 3n, 1).lt(Rat.INFINITY)).toThrowError()
      expect(() => new Rat(-12n, 1n, 1).lt(Rat.INFINITY)).toThrowError()
      expect(() => Rat.INFINITY.lt(Rat.INFINITY)).toThrowError()
    })

    it('less than or equal', () => {
      expect(Rat.INFINITY.le(new Rat(15n, 69n, 1))).toBe(false)
      expect(Rat.INFINITY.le(new Rat(0n, 3n, 1))).toBe(false)
      expect(Rat.INFINITY.le(new Rat(-12n, 1n, 1))).toBe(false)
      expect(() => new Rat(15n, 69n, 1).le(Rat.INFINITY)).toThrowError()
      expect(() => new Rat(0n, 3n, 1).le(Rat.INFINITY)).toThrowError()
      expect(() => new Rat(-12n, 1n, 1).le(Rat.INFINITY)).toThrowError()
      expect(() => Rat.INFINITY.le(Rat.INFINITY)).toThrowError()
    })

    it('greater than', () => {
      expect(Rat.INFINITY.gt(new Rat(15n, 69n, 1))).toBe(true)
      expect(Rat.INFINITY.gt(new Rat(0n, 3n, 1))).toBe(true)
      expect(Rat.INFINITY.gt(new Rat(-12n, 1n, 1))).toBe(true)
      expect(() => new Rat(15n, 69n, 1).gt(Rat.INFINITY)).toThrowError()
      expect(() => new Rat(0n, 3n, 1).gt(Rat.INFINITY)).toThrowError()
      expect(() => new Rat(-12n, 1n, 1).gt(Rat.INFINITY)).toThrowError()
      expect(() => Rat.INFINITY.gt(Rat.INFINITY)).toThrowError()
    })

    it('truncates', () => {
      expect(() => Rat.INFINITY.trunc()).toThrowError()
    })

    it('converts to milliseconds', () => {
      expect(() => Rat.INFINITY.toMillis()).toThrowError()
    })
  })
})

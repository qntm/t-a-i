/* eslint-env jest */

const { Rat } = require('./rat')

describe('Rat', () => {
  it('type checking', () => {
    expect(() => new Rat(1, 2n)).toThrowError('Numerator must be a BigInt')
    expect(() => new Rat(1n, 2)).toThrowError('Denominator must be a BigInt')
    expect(() => new Rat(1n, 0)).toThrowError('Denominator must be a BigInt')
    expect(() => new Rat(1n, 0n)).toThrowError('Denominator must be non-zero')
  })

  it('defaults to an integer', () => {
    expect(new Rat(1n)).toEqual(new Rat(1n, 1n))
  })

  it('adds', () => {
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
})

/* eslint-env jest */

const { Rat } = require('./rat.js')
const { Second } = require('./second.js')

describe('Second', () => {
  it('type checking', () => {
    expect(() => new Second(1, 2n)).toThrowError('Numerator must be a BigInt')
    expect(() => new Second(1n, 2)).toThrowError('Denominator must be a BigInt')
    expect(() => new Second(1n, 0)).toThrowError('Denominator must be a BigInt')
    expect(() => new Second(-1n, 0n)).toThrowError('Numerator must be positive if denominator is zero')
  })

  it('defaults to an integer', () => {
    expect(new Second(1n)).toEqual(new Second(1n, 1n))
  })

  it('adds', () => {
    expect(new Second(1n, 2n).plusS(new Second(1n, 3n))).toEqual(new Second(5n, 6n))
    expect(new Second(1n, 2n).plusS(new Second(0n, 3n))).toEqual(new Second(1n, 2n))
    expect(new Second(0n, 2n).plusS(new Second(1n, 3n))).toEqual(new Second(1n, 3n))
  })

  it('subtracts', () => {
    expect(new Second(1n, 2n).minusS(new Second(1n, 3n))).toEqual(new Second(1n, 6n))
    expect(new Second(1n, 2n).minusS(new Second(0n, 3n))).toEqual(new Second(1n, 2n))
    expect(new Second(0n, 2n).minusS(new Second(1n, 3n))).toEqual(new Second(-1n, 3n))
  })

  it('multiplies', () => {
    expect(new Second(6n, 5n).timesR(new Rat(4n, 5n))).toEqual(new Second(24n, 25n))
    expect(new Second(6n, 5n).timesR(new Rat(0n, 5n))).toEqual(new Second(0n, 25n))
    expect(new Second(0n, 5n).timesR(new Rat(4n, 5n))).toEqual(new Second(0n, 25n))
  })

  it('divides', () => {
    expect(new Second(6n, 5n).divideS(new Second(4n, 5n))).toEqual(new Rat(30n, 20n))
    expect(new Second(0n, 5n).divideS(new Second(4n, 5n))).toEqual(new Rat(0n, 20n))
  })

  it('greater than', () => {
    expect(new Second(-1n, 3n).gt(new Second(1n, -2n))).toBe(true)
    expect(new Second(0n).gt(new Second(1n))).toBe(false)
  })

  it('equal', () => {
    expect(new Second(-1n, 3n).eq(new Second(4n, -12n))).toBe(true)
    expect(new Second(0n).eq(new Second(-1n))).toBe(false)
    expect(new Second(0n).eq(new Second(-0n))).toBe(true)
  })

  it('less than or equal', () => {
    expect(new Second(-2n, -3n).le(new Second(-2n, -3n))).toBe(true)
    expect(new Second(-2n, -3n).le(new Second(2n, 3n))).toBe(true)
    expect(new Second(9n, 12n).le(new Second(6n, 8n))).toBe(true)
    expect(new Second(9n, 13n).le(new Second(6n, 8n))).toBe(true)
  })

  it('fromMillis', () => {
    expect(Second.fromMillis(123)).toEqual(new Second(123n, 1_000n))
    expect(() => Second.fromMillis(Infinity)).toThrowError()
  })

  it('toMillis', () => {
    expect(new Second(123n, 1_000n).toMillis()).toBe(123)
  })

  describe('positive infinity', () => {
    it('reduces to the lowest terms', () => {
      expect(Second.END_OF_TIME).toEqual(new Second(133n, 0n))
    })

    it('adds', () => {
      expect(Second.END_OF_TIME.plusS(new Second(15n, 69n))).toEqual(Second.END_OF_TIME)
      expect(Second.END_OF_TIME.plusS(new Second(0n, 3n))).toEqual(Second.END_OF_TIME)
      expect(Second.END_OF_TIME.plusS(new Second(-12n, 1n))).toEqual(Second.END_OF_TIME)
      expect(new Second(15n, 69n).plusS(Second.END_OF_TIME)).toEqual(Second.END_OF_TIME)
      expect(new Second(0n, 3n).plusS(Second.END_OF_TIME)).toEqual(Second.END_OF_TIME)
      expect(new Second(-12n, 1n).plusS(Second.END_OF_TIME)).toEqual(Second.END_OF_TIME)
      expect(Second.END_OF_TIME.plusS(Second.END_OF_TIME)).toEqual(Second.END_OF_TIME)
    })

    it('subtracts', () => {
      expect(Second.END_OF_TIME.minusS(new Second(15n, 69n))).toEqual(Second.END_OF_TIME)
      expect(Second.END_OF_TIME.minusS(new Second(0n, 3n))).toEqual(Second.END_OF_TIME)
      expect(Second.END_OF_TIME.minusS(new Second(-12n, 1n))).toEqual(Second.END_OF_TIME)
      expect(() => new Second(15n, 69n).minusS(Second.END_OF_TIME)).toThrowError()
      expect(() => new Second(0n, 3n).minusS(Second.END_OF_TIME)).toThrowError()
      expect(() => new Second(-12n, 1n).minusS(Second.END_OF_TIME)).toThrowError()
      expect(() => Second.END_OF_TIME.minusS(Second.END_OF_TIME)).toThrowError()
    })

    it('multiplies', () => {
      expect(Second.END_OF_TIME.timesR(new Rat(15n, 69n))).toEqual(Second.END_OF_TIME)
      expect(() => Second.END_OF_TIME.timesR(new Rat(0n, 3n))).toThrowError()
      expect(() => Second.END_OF_TIME.timesR(new Second(-12n, 1n))).toThrowError()
      expect(new Second(15n, 69n).timesR(Rat.INFINITY)).toEqual(Second.END_OF_TIME)
      expect(() => new Second(0n, 3n).timesR(Rat.INFINITY)).toThrowError()
      expect(() => new Second(-12n, 1n).timesR(Rat.INFINITY)).toThrowError()
    })

    it('divides', () => {
      expect(Second.END_OF_TIME.divideS(new Second(15n, 69n))).toEqual(Rat.INFINITY)
      expect(Second.END_OF_TIME.divideS(new Second(0n, 3n))).toEqual(Rat.INFINITY)
      expect(() => Second.END_OF_TIME.divideS(new Second(-12n, 1n))).toThrowError('Numerator must be positive if denominator is zero')
      expect(new Second(15n, 69n).divideS(Second.END_OF_TIME)).toEqual(new Rat(0n))
      expect(new Second(0n, 3n).divideS(Second.END_OF_TIME)).toEqual(new Rat(0n))
      expect(new Second(-12n, 1n).divideS(Second.END_OF_TIME)).toEqual(new Rat(0n))
      expect(() => Second.END_OF_TIME.divideS(Second.END_OF_TIME)).toThrowError()
    })

    it('equals', () => {
      expect(Second.END_OF_TIME.eq(new Second(15n, 69n))).toBe(false)
      expect(Second.END_OF_TIME.eq(new Second(0n, 3n))).toBe(false)
      expect(Second.END_OF_TIME.eq(new Second(-12n, 1n))).toBe(false)
      expect(() => new Second(15n, 69n).eq(Second.END_OF_TIME)).toThrowError()
      expect(() => new Second(0n, 3n).eq(Second.END_OF_TIME)).toThrowError()
      expect(() => new Second(-12n, 1n).eq(Second.END_OF_TIME)).toThrowError()
      expect(() => Second.END_OF_TIME.eq(Second.END_OF_TIME)).toThrowError()
    })

    it('less than or equal', () => {
      expect(Second.END_OF_TIME.le(new Second(15n, 69n))).toBe(false)
      expect(Second.END_OF_TIME.le(new Second(0n, 3n))).toBe(false)
      expect(Second.END_OF_TIME.le(new Second(-12n, 1n))).toBe(false)
      expect(() => new Second(15n, 69n).le(Second.END_OF_TIME)).toThrowError()
      expect(() => new Second(0n, 3n).le(Second.END_OF_TIME)).toThrowError()
      expect(() => new Second(-12n, 1n).le(Second.END_OF_TIME)).toThrowError()
      expect(() => Second.END_OF_TIME.le(Second.END_OF_TIME)).toThrowError()
    })

    it('greater than', () => {
      expect(Second.END_OF_TIME.gt(new Second(15n, 69n))).toBe(true)
      expect(Second.END_OF_TIME.gt(new Second(0n, 3n))).toBe(true)
      expect(Second.END_OF_TIME.gt(new Second(-12n, 1n))).toBe(true)
      expect(() => new Second(15n, 69n).gt(Second.END_OF_TIME)).toThrowError()
      expect(() => new Second(0n, 3n).gt(Second.END_OF_TIME)).toThrowError()
      expect(() => new Second(-12n, 1n).gt(Second.END_OF_TIME)).toThrowError()
      expect(() => Second.END_OF_TIME.gt(Second.END_OF_TIME)).toThrowError()
    })

    it('converts to milliseconds', () => {
      expect(() => Second.END_OF_TIME.toMillis()).toThrowError()
    })
  })
})

/* eslint-env jest */

const { sign, div, gcd } = require('./div.js')

describe('sign', () => {
  it('works', () => {
    expect(sign(-6n)).toBe(-1n)
    expect(sign(0n)).toBe(0n)
    expect(sign(7_901n)).toBe(1n)
  })
})

describe('div', () => {
  it('throws', () => {
    expect(() => div(18n, 0n)).toThrowError('Division by zero')
    expect(() => div(0n, 0n)).toThrowError('Division by zero')
  })

  it('works', () => {
    expect(div(18n, 10n)).toBe(1n)
    expect(div(15n, 10n)).toBe(1n)
    expect(div(12n, 10n)).toBe(1n)
    expect(div(10n, 10n)).toBe(1n)
    expect(div(8n, 10n)).toBe(0n)
    expect(div(5n, 10n)).toBe(0n)
    expect(div(2n, 10n)).toBe(0n)
    expect(div(0n, 10n)).toBe(0n)
    expect(div(-2n, 10n)).toBe(-1n)
    expect(div(-5n, 10n)).toBe(-1n)
    expect(div(-8n, 10n)).toBe(-1n)
    expect(div(-10n, 10n)).toBe(-1n)
    expect(div(-12n, 10n)).toBe(-2n)
    expect(div(-15n, 10n)).toBe(-2n)
    expect(div(-18n, 10n)).toBe(-2n)
  })

  it('works on negatives', () => {
    expect(div(-18n, -10n)).toBe(1n)
    expect(div(-15n, -10n)).toBe(1n)
    expect(div(-12n, -10n)).toBe(1n)
    expect(div(-10n, -10n)).toBe(1n)
    expect(div(-8n, -10n)).toBe(0n)
    expect(div(-5n, -10n)).toBe(0n)
    expect(div(-2n, -10n)).toBe(0n)
    expect(div(0n, -10n)).toBe(0n)
    expect(div(2n, -10n)).toBe(-1n)
    expect(div(5n, -10n)).toBe(-1n)
    expect(div(8n, -10n)).toBe(-1n)
    expect(div(10n, -10n)).toBe(-1n)
    expect(div(12n, -10n)).toBe(-2n)
    expect(div(15n, -10n)).toBe(-2n)
    expect(div(18n, -10n)).toBe(-2n)
  })
})

describe('gcd', () => {
  it('works', () => {
    expect(gcd(252n, 105n)).toBe(21n)
    expect(gcd(105n, 252n)).toBe(21n)
    expect(gcd(-105n, 252n)).toBe(-21n) // sign kind of varies
    expect(gcd(105n, -252n)).toBe(21n)
    expect(gcd(-105n, -252n)).toBe(-21n)
    expect(gcd(6n, 35n)).toBe(1n)
    expect(gcd(35n, 6n)).toBe(1n)
    expect(gcd(35n, -6n)).toBe(-1n)
    expect(gcd(-35n, 6n)).toBe(1n)
    expect(gcd(-35n, -6n)).toBe(-1n)
    expect(gcd(1_071n, 462n)).toBe(21n)
  })
})

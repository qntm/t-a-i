const assert = require('node:assert')
const { sign, div, gcd } = require('../src/div.js')

describe('sign', () => {
  it('works', () => {
    assert.strictEqual(sign(-6n), -1n)
    assert.strictEqual(sign(0n), 0n)
    assert.strictEqual(sign(7_901n), 1n)
  })
})

describe('div', () => {
  it('throws', () => {
    assert.throws(() => div(18n, 0n))
    assert.throws(() => div(0n, 0n))
  })

  it('works', () => {
    assert.strictEqual(div(18n, 10n), 1n)
    assert.strictEqual(div(15n, 10n), 1n)
    assert.strictEqual(div(12n, 10n), 1n)
    assert.strictEqual(div(10n, 10n), 1n)
    assert.strictEqual(div(8n, 10n), 0n)
    assert.strictEqual(div(5n, 10n), 0n)
    assert.strictEqual(div(2n, 10n), 0n)
    assert.strictEqual(div(0n, 10n), 0n)
    assert.strictEqual(div(-2n, 10n), -1n)
    assert.strictEqual(div(-5n, 10n), -1n)
    assert.strictEqual(div(-8n, 10n), -1n)
    assert.strictEqual(div(-10n, 10n), -1n)
    assert.strictEqual(div(-12n, 10n), -2n)
    assert.strictEqual(div(-15n, 10n), -2n)
    assert.strictEqual(div(-18n, 10n), -2n)
  })

  it('works on negatives', () => {
    assert.strictEqual(div(-18n, -10n), 1n)
    assert.strictEqual(div(-15n, -10n), 1n)
    assert.strictEqual(div(-12n, -10n), 1n)
    assert.strictEqual(div(-10n, -10n), 1n)
    assert.strictEqual(div(-8n, -10n), 0n)
    assert.strictEqual(div(-5n, -10n), 0n)
    assert.strictEqual(div(-2n, -10n), 0n)
    assert.strictEqual(div(0n, -10n), 0n)
    assert.strictEqual(div(2n, -10n), -1n)
    assert.strictEqual(div(5n, -10n), -1n)
    assert.strictEqual(div(8n, -10n), -1n)
    assert.strictEqual(div(10n, -10n), -1n)
    assert.strictEqual(div(12n, -10n), -2n)
    assert.strictEqual(div(15n, -10n), -2n)
    assert.strictEqual(div(18n, -10n), -2n)
  })
})

describe('gcd', () => {
  it('works', () => {
    assert.strictEqual(gcd(252n, 105n), 21n)
    assert.strictEqual(gcd(105n, 252n), 21n)
    assert.strictEqual(gcd(-105n, 252n), -21n) // sign kind of varies
    assert.strictEqual(gcd(105n, -252n), 21n)
    assert.strictEqual(gcd(-105n, -252n), -21n)
    assert.strictEqual(gcd(6n, 35n), 1n)
    assert.strictEqual(gcd(35n, 6n), 1n)
    assert.strictEqual(gcd(35n, -6n), -1n)
    assert.strictEqual(gcd(-35n, 6n), 1n)
    assert.strictEqual(gcd(-35n, -6n), -1n)
    assert.strictEqual(gcd(1_071n, 462n), 21n)
  })
})

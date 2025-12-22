import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { sign, div, gcd } from '../src/div.js'

describe('sign', () => {
  it('works', () => {
    assert.equal(sign(-6n), -1n)
    assert.equal(sign(0n), 0n)
    assert.equal(sign(7_901n), 1n)
  })
})

describe('div', () => {
  it('throws', () => {
    assert.throws(() => div(18n, 0n))
    assert.throws(() => div(0n, 0n))
  })

  it('works', () => {
    assert.equal(div(18n, 10n), 1n)
    assert.equal(div(15n, 10n), 1n)
    assert.equal(div(12n, 10n), 1n)
    assert.equal(div(10n, 10n), 1n)
    assert.equal(div(8n, 10n), 0n)
    assert.equal(div(5n, 10n), 0n)
    assert.equal(div(2n, 10n), 0n)
    assert.equal(div(0n, 10n), 0n)
    assert.equal(div(-2n, 10n), -1n)
    assert.equal(div(-5n, 10n), -1n)
    assert.equal(div(-8n, 10n), -1n)
    assert.equal(div(-10n, 10n), -1n)
    assert.equal(div(-12n, 10n), -2n)
    assert.equal(div(-15n, 10n), -2n)
    assert.equal(div(-18n, 10n), -2n)
  })

  it('works on negatives', () => {
    assert.equal(div(-18n, -10n), 1n)
    assert.equal(div(-15n, -10n), 1n)
    assert.equal(div(-12n, -10n), 1n)
    assert.equal(div(-10n, -10n), 1n)
    assert.equal(div(-8n, -10n), 0n)
    assert.equal(div(-5n, -10n), 0n)
    assert.equal(div(-2n, -10n), 0n)
    assert.equal(div(0n, -10n), 0n)
    assert.equal(div(2n, -10n), -1n)
    assert.equal(div(5n, -10n), -1n)
    assert.equal(div(8n, -10n), -1n)
    assert.equal(div(10n, -10n), -1n)
    assert.equal(div(12n, -10n), -2n)
    assert.equal(div(15n, -10n), -2n)
    assert.equal(div(18n, -10n), -2n)
  })
})

describe('gcd', () => {
  it('works', () => {
    assert.equal(gcd(252n, 105n), 21n)
    assert.equal(gcd(105n, 252n), 21n)
    assert.equal(gcd(-105n, 252n), -21n) // sign kind of varies
    assert.equal(gcd(105n, -252n), 21n)
    assert.equal(gcd(-105n, -252n), -21n)
    assert.equal(gcd(6n, 35n), 1n)
    assert.equal(gcd(35n, 6n), 1n)
    assert.equal(gcd(35n, -6n), -1n)
    assert.equal(gcd(-35n, 6n), 1n)
    assert.equal(gcd(-35n, -6n), -1n)
    assert.equal(gcd(1_071n, 462n), 21n)
  })
})

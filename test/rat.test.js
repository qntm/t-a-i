import assert from 'node:assert/strict'

import { describe, it } from 'mocha'
import { Rat } from '../src/rat.js'

describe('Rat', () => {
  it('type checking', () => {
    assert.throws(() => new Rat(1, 2n), /numerator must be a BigInt/)
    assert.throws(() => new Rat(1n, 2), /denominator must be a BigInt/)
    assert.throws(() => new Rat(1n, 0), /denominator must be a BigInt/)
    assert.throws(() => new Rat(-1n, 0n), /denominator cannot be zero/)
  })

  it('defaults to an integer', () => {
    assert.deepEqual(new Rat(1n), new Rat(1n, 1n))
  })

  it('adds', () => {
    assert.deepEqual(new Rat(1n, 2n).plus(new Rat(1n, 3n)), new Rat(5n, 6n))
    assert.deepEqual(new Rat(1n, 2n).plus(new Rat(0n, 3n)), new Rat(1n, 2n))
    assert.deepEqual(new Rat(0n, 2n).plus(new Rat(1n, 3n)), new Rat(1n, 3n))
  })

  it('subtracts', () => {
    assert.deepEqual(new Rat(1n, 2n).minus(new Rat(1n, 3n)), new Rat(1n, 6n))
    assert.deepEqual(new Rat(1n, 2n).minus(new Rat(0n, 3n)), new Rat(1n, 2n))
    assert.deepEqual(new Rat(0n, 2n).minus(new Rat(1n, 3n)), new Rat(-1n, 3n))
  })

  it('multiplies', () => {
    assert.deepEqual(new Rat(6n, 5n).times(new Rat(4n, 5n)), new Rat(24n, 25n))
    assert.deepEqual(new Rat(6n, 5n).times(new Rat(0n, 5n)), new Rat(0n, 25n))
    assert.deepEqual(new Rat(0n, 5n).times(new Rat(4n, 5n)), new Rat(0n, 25n))
  })

  it('divides', () => {
    assert.deepEqual(new Rat(6n, 5n).divide(new Rat(4n, 5n)), new Rat(30n, 20n))
    assert.deepEqual(new Rat(0n, 5n).divide(new Rat(4n, 5n)), new Rat(0n, 20n))
  })

  it('greater than', () => {
    assert.equal(new Rat(-1n, 3n).gt(new Rat(1n, -2n)), true)
    assert.equal(new Rat(0n).gt(new Rat(1n)), false)
  })

  it('equal', () => {
    assert.equal(new Rat(-1n, 3n).eq(new Rat(4n, -12n)), true)
    assert.equal(new Rat(0n).eq(new Rat(-1n)), false)
    assert.equal(new Rat(0n).eq(new Rat(-0n)), true)
  })

  it('less than or equal', () => {
    assert.equal(new Rat(-2n, -3n).le(new Rat(-2n, -3n)), true)
    assert.equal(new Rat(-2n, -3n).le(new Rat(2n, 3n)), true)
    assert.equal(new Rat(9n, 12n).le(new Rat(6n, 8n)), true)
    assert.equal(new Rat(9n, 13n).le(new Rat(6n, 8n)), true)
  })

  describe('truncates', () => {
    it('positives', () => {
      assert.equal(new Rat(18n, 10n).trunc(), 1n)
      assert.equal(new Rat(15n, 10n).trunc(), 1n)
      assert.equal(new Rat(12n, 10n).trunc(), 1n)
      assert.equal(new Rat(10n, 10n).trunc(), 1n)
      assert.equal(new Rat(8n, 10n).trunc(), 0n)
      assert.equal(new Rat(5n, 10n).trunc(), 0n)
      assert.equal(new Rat(2n, 10n).trunc(), 0n)
      assert.equal(new Rat(0n, 10n).trunc(), 0n)
      assert.equal(new Rat(-2n, 10n).trunc(), -1n)
      assert.equal(new Rat(-5n, 10n).trunc(), -1n)
      assert.equal(new Rat(-8n, 10n).trunc(), -1n)
      assert.equal(new Rat(-10n, 10n).trunc(), -1n)
      assert.equal(new Rat(-12n, 10n).trunc(), -2n)
      assert.equal(new Rat(-15n, 10n).trunc(), -2n)
      assert.equal(new Rat(-18n, 10n).trunc(), -2n)
    })

    it('negatives', () => {
      assert.equal(new Rat(-18n, -10n).trunc(), 1n)
      assert.equal(new Rat(-15n, -10n).trunc(), 1n)
      assert.equal(new Rat(-12n, -10n).trunc(), 1n)
      assert.equal(new Rat(-10n, -10n).trunc(), 1n)
      assert.equal(new Rat(-8n, -10n).trunc(), 0n)
      assert.equal(new Rat(-5n, -10n).trunc(), 0n)
      assert.equal(new Rat(-2n, -10n).trunc(), 0n)
      assert.equal(new Rat(0n, -10n).trunc(), 0n)
      assert.equal(new Rat(2n, -10n).trunc(), -1n)
      assert.equal(new Rat(5n, -10n).trunc(), -1n)
      assert.equal(new Rat(8n, -10n).trunc(), -1n)
      assert.equal(new Rat(10n, -10n).trunc(), -1n)
      assert.equal(new Rat(12n, -10n).trunc(), -2n)
      assert.equal(new Rat(15n, -10n).trunc(), -2n)
      assert.equal(new Rat(18n, -10n).trunc(), -2n)
    })
  })
})

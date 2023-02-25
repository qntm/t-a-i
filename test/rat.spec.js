const assert = require('node:assert')
const { Rat } = require('../src/rat')

describe('Rat', () => {
  it('type checking', () => {
    assert.throws(() => new Rat(1, 2n), /Numerator must be a BigInt/)
    assert.throws(() => new Rat(1n, 2), /Denominator must be a BigInt/)
    assert.throws(() => new Rat(1n, 0), /Denominator must be a BigInt/)
    assert.throws(() => new Rat(-1n, 0n), /Numerator must be positive if denominator is zero/)
  })

  it('defaults to an integer', () => {
    assert.deepStrictEqual(new Rat(1n), new Rat(1n, 1n))
  })

  it('adds', () => {
    assert.deepStrictEqual(new Rat(1n, 2n).plus(new Rat(1n, 3n)), new Rat(5n, 6n))
    assert.deepStrictEqual(new Rat(1n, 2n).plus(new Rat(0n, 3n)), new Rat(1n, 2n))
    assert.deepStrictEqual(new Rat(0n, 2n).plus(new Rat(1n, 3n)), new Rat(1n, 3n))
  })

  it('subtracts', () => {
    assert.deepStrictEqual(new Rat(1n, 2n).minus(new Rat(1n, 3n)), new Rat(1n, 6n))
    assert.deepStrictEqual(new Rat(1n, 2n).minus(new Rat(0n, 3n)), new Rat(1n, 2n))
    assert.deepStrictEqual(new Rat(0n, 2n).minus(new Rat(1n, 3n)), new Rat(-1n, 3n))
  })

  it('multiplies', () => {
    assert.deepStrictEqual(new Rat(6n, 5n).times(new Rat(4n, 5n)), new Rat(24n, 25n))
    assert.deepStrictEqual(new Rat(6n, 5n).times(new Rat(0n, 5n)), new Rat(0n, 25n))
    assert.deepStrictEqual(new Rat(0n, 5n).times(new Rat(4n, 5n)), new Rat(0n, 25n))
  })

  it('divides', () => {
    assert.deepStrictEqual(new Rat(6n, 5n).divide(new Rat(4n, 5n)), new Rat(30n, 20n))
    assert.deepStrictEqual(new Rat(0n, 5n).divide(new Rat(4n, 5n)), new Rat(0n, 20n))
  })

  it('greater than', () => {
    assert.strictEqual(new Rat(-1n, 3n).gt(new Rat(1n, -2n)), true)
    assert.strictEqual(new Rat(0n).gt(new Rat(1n)), false)
  })

  it('equal', () => {
    assert.strictEqual(new Rat(-1n, 3n).eq(new Rat(4n, -12n)), true)
    assert.strictEqual(new Rat(0n).eq(new Rat(-1n)), false)
    assert.strictEqual(new Rat(0n).eq(new Rat(-0n)), true)
  })

  it('less than or equal', () => {
    assert.strictEqual(new Rat(-2n, -3n).le(new Rat(-2n, -3n)), true)
    assert.strictEqual(new Rat(-2n, -3n).le(new Rat(2n, 3n)), true)
    assert.strictEqual(new Rat(9n, 12n).le(new Rat(6n, 8n)), true)
    assert.strictEqual(new Rat(9n, 13n).le(new Rat(6n, 8n)), true)
  })

  describe('truncates', () => {
    it('positives', () => {
      assert.strictEqual(new Rat(18n, 10n).trunc(), 1n)
      assert.strictEqual(new Rat(15n, 10n).trunc(), 1n)
      assert.strictEqual(new Rat(12n, 10n).trunc(), 1n)
      assert.strictEqual(new Rat(10n, 10n).trunc(), 1n)
      assert.strictEqual(new Rat(8n, 10n).trunc(), 0n)
      assert.strictEqual(new Rat(5n, 10n).trunc(), 0n)
      assert.strictEqual(new Rat(2n, 10n).trunc(), 0n)
      assert.strictEqual(new Rat(0n, 10n).trunc(), 0n)
      assert.strictEqual(new Rat(-2n, 10n).trunc(), -1n)
      assert.strictEqual(new Rat(-5n, 10n).trunc(), -1n)
      assert.strictEqual(new Rat(-8n, 10n).trunc(), -1n)
      assert.strictEqual(new Rat(-10n, 10n).trunc(), -1n)
      assert.strictEqual(new Rat(-12n, 10n).trunc(), -2n)
      assert.strictEqual(new Rat(-15n, 10n).trunc(), -2n)
      assert.strictEqual(new Rat(-18n, 10n).trunc(), -2n)
    })

    it('negatives', () => {
      assert.strictEqual(new Rat(-18n, -10n).trunc(), 1n)
      assert.strictEqual(new Rat(-15n, -10n).trunc(), 1n)
      assert.strictEqual(new Rat(-12n, -10n).trunc(), 1n)
      assert.strictEqual(new Rat(-10n, -10n).trunc(), 1n)
      assert.strictEqual(new Rat(-8n, -10n).trunc(), 0n)
      assert.strictEqual(new Rat(-5n, -10n).trunc(), 0n)
      assert.strictEqual(new Rat(-2n, -10n).trunc(), 0n)
      assert.strictEqual(new Rat(0n, -10n).trunc(), 0n)
      assert.strictEqual(new Rat(2n, -10n).trunc(), -1n)
      assert.strictEqual(new Rat(5n, -10n).trunc(), -1n)
      assert.strictEqual(new Rat(8n, -10n).trunc(), -1n)
      assert.strictEqual(new Rat(10n, -10n).trunc(), -1n)
      assert.strictEqual(new Rat(12n, -10n).trunc(), -2n)
      assert.strictEqual(new Rat(15n, -10n).trunc(), -2n)
      assert.strictEqual(new Rat(18n, -10n).trunc(), -2n)
    })
  })

  describe('positive infinity', () => {
    it('reduces to the lowest terms', () => {
      assert.deepStrictEqual(Rat.INFINITY, new Rat(133n, 0n))
    })

    it('adds', () => {
      assert.deepStrictEqual(Rat.INFINITY.plus(new Rat(15n, 69n)), Rat.INFINITY)
      assert.deepStrictEqual(Rat.INFINITY.plus(new Rat(0n, 3n)), Rat.INFINITY)
      assert.deepStrictEqual(Rat.INFINITY.plus(new Rat(-12n, 1n)), Rat.INFINITY)
      assert.deepStrictEqual(new Rat(15n, 69n).plus(Rat.INFINITY), Rat.INFINITY)
      assert.deepStrictEqual(new Rat(0n, 3n).plus(Rat.INFINITY), Rat.INFINITY)
      assert.deepStrictEqual(new Rat(-12n, 1n).plus(Rat.INFINITY), Rat.INFINITY)
      assert.deepStrictEqual(Rat.INFINITY.plus(Rat.INFINITY), Rat.INFINITY)
    })

    it('subtracts', () => {
      assert.deepStrictEqual(Rat.INFINITY.minus(new Rat(15n, 69n)), Rat.INFINITY)
      assert.deepStrictEqual(Rat.INFINITY.minus(new Rat(0n, 3n)), Rat.INFINITY)
      assert.deepStrictEqual(Rat.INFINITY.minus(new Rat(-12n, 1n)), Rat.INFINITY)
      assert.throws(() => new Rat(15n, 69n).minus(Rat.INFINITY))
      assert.throws(() => new Rat(0n, 3n).minus(Rat.INFINITY))
      assert.throws(() => new Rat(-12n, 1n).minus(Rat.INFINITY))
      assert.throws(() => Rat.INFINITY.minus(Rat.INFINITY))
    })

    it('multiplies', () => {
      assert.deepStrictEqual(Rat.INFINITY.times(new Rat(15n, 69n)), Rat.INFINITY)
      assert.throws(() => Rat.INFINITY.times(new Rat(0n, 3n)))
      assert.throws(() => Rat.INFINITY.times(new Rat(-12n, 1n)))
      assert.deepStrictEqual(new Rat(15n, 69n).times(Rat.INFINITY), Rat.INFINITY)
      assert.throws(() => new Rat(0n, 3n).times(Rat.INFINITY))
      assert.throws(() => new Rat(-12n, 1n).times(Rat.INFINITY))
      assert.deepStrictEqual(Rat.INFINITY.times(Rat.INFINITY), Rat.INFINITY)
    })

    it('divides', () => {
      assert.deepStrictEqual(Rat.INFINITY.divide(new Rat(15n, 69n)), Rat.INFINITY)
      assert.deepStrictEqual(Rat.INFINITY.divide(new Rat(0n, 3n)), Rat.INFINITY)
      assert.throws(() => Rat.INFINITY.divide(new Rat(-12n, 1n)), /Numerator must be positive if denominator is zero/)
      assert.deepStrictEqual(new Rat(15n, 69n).divide(Rat.INFINITY), new Rat(0n))
      assert.deepStrictEqual(new Rat(0n, 3n).divide(Rat.INFINITY), new Rat(0n))
      assert.deepStrictEqual(new Rat(-12n, 1n).divide(Rat.INFINITY), new Rat(0n))
      assert.throws(() => Rat.INFINITY.divide(Rat.INFINITY))
    })

    it('equals', () => {
      assert.strictEqual(Rat.INFINITY.eq(new Rat(15n, 69n)), false)
      assert.strictEqual(Rat.INFINITY.eq(new Rat(0n, 3n)), false)
      assert.strictEqual(Rat.INFINITY.eq(new Rat(-12n, 1n)), false)
      assert.throws(() => new Rat(15n, 69n).eq(Rat.INFINITY))
      assert.throws(() => new Rat(0n, 3n).eq(Rat.INFINITY))
      assert.throws(() => new Rat(-12n, 1n).eq(Rat.INFINITY))
      assert.throws(() => Rat.INFINITY.eq(Rat.INFINITY))
    })

    it('less than or equal', () => {
      assert.strictEqual(Rat.INFINITY.le(new Rat(15n, 69n)), false)
      assert.strictEqual(Rat.INFINITY.le(new Rat(0n, 3n)), false)
      assert.strictEqual(Rat.INFINITY.le(new Rat(-12n, 1n)), false)
      assert.throws(() => new Rat(15n, 69n).le(Rat.INFINITY))
      assert.throws(() => new Rat(0n, 3n).le(Rat.INFINITY))
      assert.throws(() => new Rat(-12n, 1n).le(Rat.INFINITY))
      assert.throws(() => Rat.INFINITY.le(Rat.INFINITY))
    })

    it('greater than', () => {
      assert.strictEqual(Rat.INFINITY.gt(new Rat(15n, 69n)), true)
      assert.strictEqual(Rat.INFINITY.gt(new Rat(0n, 3n)), true)
      assert.strictEqual(Rat.INFINITY.gt(new Rat(-12n, 1n)), true)
      assert.throws(() => new Rat(15n, 69n).gt(Rat.INFINITY))
      assert.throws(() => new Rat(0n, 3n).gt(Rat.INFINITY))
      assert.throws(() => new Rat(-12n, 1n).gt(Rat.INFINITY))
      assert.throws(() => Rat.INFINITY.gt(Rat.INFINITY))
    })

    it('truncates', () => {
      assert.throws(() => Rat.INFINITY.trunc())
    })
  })
})

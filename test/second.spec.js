import assert from 'node:assert'
import { describe, it } from 'mocha'
import { Rat } from '../src/rat.js'
import { Second } from '../src/second.js'

describe('Second', () => {
  it('type checking', () => {
    assert.throws(() => new Second(1, 2n), /Numerator must be a BigInt/)
    assert.throws(() => new Second(1n, 2), /Denominator must be a BigInt/)
    assert.throws(() => new Second(1n, 0), /Denominator must be a BigInt/)
    assert.throws(() => new Second(-1n, 0n), /Numerator must be positive if denominator is zero/)
  })

  it('defaults to an integer', () => {
    assert.deepStrictEqual(new Second(1n), new Second(1n, 1n))
  })

  it('adds', () => {
    assert.deepStrictEqual(new Second(1n, 2n).plusS(new Second(1n, 3n)), new Second(5n, 6n))
    assert.deepStrictEqual(new Second(1n, 2n).plusS(new Second(0n, 3n)), new Second(1n, 2n))
    assert.deepStrictEqual(new Second(0n, 2n).plusS(new Second(1n, 3n)), new Second(1n, 3n))
  })

  it('subtracts', () => {
    assert.deepStrictEqual(new Second(1n, 2n).minusS(new Second(1n, 3n)), new Second(1n, 6n))
    assert.deepStrictEqual(new Second(1n, 2n).minusS(new Second(0n, 3n)), new Second(1n, 2n))
    assert.deepStrictEqual(new Second(0n, 2n).minusS(new Second(1n, 3n)), new Second(-1n, 3n))
  })

  it('multiplies', () => {
    assert.deepStrictEqual(new Second(6n, 5n).timesR(new Rat(4n, 5n)), new Second(24n, 25n))
    assert.deepStrictEqual(new Second(6n, 5n).timesR(new Rat(0n, 5n)), new Second(0n, 25n))
    assert.deepStrictEqual(new Second(0n, 5n).timesR(new Rat(4n, 5n)), new Second(0n, 25n))
  })

  it('divides', () => {
    assert.deepStrictEqual(new Second(6n, 5n).divideS(new Second(4n, 5n)), new Rat(30n, 20n))
    assert.deepStrictEqual(new Second(0n, 5n).divideS(new Second(4n, 5n)), new Rat(0n, 20n))
  })

  it('greater than', () => {
    assert.strictEqual(new Second(-1n, 3n).gtS(new Second(1n, -2n)), true)
    assert.strictEqual(new Second(0n).gtS(new Second(1n)), false)
  })

  it('equal', () => {
    assert.strictEqual(new Second(-1n, 3n).eqS(new Second(4n, -12n)), true)
    assert.strictEqual(new Second(0n).eqS(new Second(-1n)), false)
    assert.strictEqual(new Second(0n).eqS(new Second(-0n)), true)
  })

  it('less than or equal', () => {
    assert.strictEqual(new Second(-2n, -3n).leS(new Second(-2n, -3n)), true)
    assert.strictEqual(new Second(-2n, -3n).leS(new Second(2n, 3n)), true)
    assert.strictEqual(new Second(9n, 12n).leS(new Second(6n, 8n)), true)
    assert.strictEqual(new Second(9n, 13n).leS(new Second(6n, 8n)), true)
  })

  it('fromMillis', () => {
    assert.deepStrictEqual(Second.fromMillis(123), new Second(123n, 1_000n))
    assert.throws(() => Second.fromMillis(Infinity))
  })

  it('toMillis', () => {
    assert.strictEqual(new Second(123n, 1_000n).toMillis(), 123)
  })

  describe('positive infinity', () => {
    it('reduces to the lowest terms', () => {
      assert.deepStrictEqual(Second.END_OF_TIME, new Second(133n, 0n))
    })

    it('adds', () => {
      assert.deepStrictEqual(Second.END_OF_TIME.plusS(new Second(15n, 69n)), Second.END_OF_TIME)
      assert.deepStrictEqual(Second.END_OF_TIME.plusS(new Second(0n, 3n)), Second.END_OF_TIME)
      assert.deepStrictEqual(Second.END_OF_TIME.plusS(new Second(-12n, 1n)), Second.END_OF_TIME)
      assert.deepStrictEqual(new Second(15n, 69n).plusS(Second.END_OF_TIME), Second.END_OF_TIME)
      assert.deepStrictEqual(new Second(0n, 3n).plusS(Second.END_OF_TIME), Second.END_OF_TIME)
      assert.deepStrictEqual(new Second(-12n, 1n).plusS(Second.END_OF_TIME), Second.END_OF_TIME)
      assert.deepStrictEqual(Second.END_OF_TIME.plusS(Second.END_OF_TIME), Second.END_OF_TIME)
    })

    it('subtracts', () => {
      assert.deepStrictEqual(Second.END_OF_TIME.minusS(new Second(15n, 69n)), Second.END_OF_TIME)
      assert.deepStrictEqual(Second.END_OF_TIME.minusS(new Second(0n, 3n)), Second.END_OF_TIME)
      assert.deepStrictEqual(Second.END_OF_TIME.minusS(new Second(-12n, 1n)), Second.END_OF_TIME)
      assert.throws(() => new Second(15n, 69n).minusS(Second.END_OF_TIME))
      assert.throws(() => new Second(0n, 3n).minusS(Second.END_OF_TIME))
      assert.throws(() => new Second(-12n, 1n).minusS(Second.END_OF_TIME))
      assert.throws(() => Second.END_OF_TIME.minusS(Second.END_OF_TIME))
    })

    it('multiplies', () => {
      assert.deepStrictEqual(Second.END_OF_TIME.timesR(new Rat(15n, 69n)), Second.END_OF_TIME)
      assert.throws(() => Second.END_OF_TIME.timesR(new Rat(0n, 3n)))
      assert.throws(() => Second.END_OF_TIME.timesR(new Second(-12n, 1n)))
      assert.deepStrictEqual(new Second(15n, 69n).timesR(Rat.INFINITY), Second.END_OF_TIME)
      assert.throws(() => new Second(0n, 3n).timesR(Rat.INFINITY))
      assert.throws(() => new Second(-12n, 1n).timesR(Rat.INFINITY))
    })

    it('divides', () => {
      assert.deepStrictEqual(Second.END_OF_TIME.divideS(new Second(15n, 69n)), Rat.INFINITY)
      assert.deepStrictEqual(Second.END_OF_TIME.divideS(new Second(0n, 3n)), Rat.INFINITY)
      assert.throws(() => Second.END_OF_TIME.divideS(new Second(-12n, 1n)), /Numerator must be positive if denominator is zero/)
      assert.deepStrictEqual(new Second(15n, 69n).divideS(Second.END_OF_TIME), new Rat(0n))
      assert.deepStrictEqual(new Second(0n, 3n).divideS(Second.END_OF_TIME), new Rat(0n))
      assert.deepStrictEqual(new Second(-12n, 1n).divideS(Second.END_OF_TIME), new Rat(0n))
      assert.throws(() => Second.END_OF_TIME.divideS(Second.END_OF_TIME))
    })

    it('equals', () => {
      assert.strictEqual(Second.END_OF_TIME.eqS(new Second(15n, 69n)), false)
      assert.strictEqual(Second.END_OF_TIME.eqS(new Second(0n, 3n)), false)
      assert.strictEqual(Second.END_OF_TIME.eqS(new Second(-12n, 1n)), false)
      assert.throws(() => new Second(15n, 69n).eqS(Second.END_OF_TIME))
      assert.throws(() => new Second(0n, 3n).eqS(Second.END_OF_TIME))
      assert.throws(() => new Second(-12n, 1n).eqS(Second.END_OF_TIME))
      assert.throws(() => Second.END_OF_TIME.eqS(Second.END_OF_TIME))
    })

    it('less than or equal', () => {
      assert.strictEqual(Second.END_OF_TIME.leS(new Second(15n, 69n)), false)
      assert.strictEqual(Second.END_OF_TIME.leS(new Second(0n, 3n)), false)
      assert.strictEqual(Second.END_OF_TIME.leS(new Second(-12n, 1n)), false)
      assert.throws(() => new Second(15n, 69n).leS(Second.END_OF_TIME))
      assert.throws(() => new Second(0n, 3n).leS(Second.END_OF_TIME))
      assert.throws(() => new Second(-12n, 1n).leS(Second.END_OF_TIME))
      assert.throws(() => Second.END_OF_TIME.leS(Second.END_OF_TIME))
    })

    it('greater than', () => {
      assert.strictEqual(Second.END_OF_TIME.gtS(new Second(15n, 69n)), true)
      assert.strictEqual(Second.END_OF_TIME.gtS(new Second(0n, 3n)), true)
      assert.strictEqual(Second.END_OF_TIME.gtS(new Second(-12n, 1n)), true)
      assert.throws(() => new Second(15n, 69n).gtS(Second.END_OF_TIME))
      assert.throws(() => new Second(0n, 3n).gtS(Second.END_OF_TIME))
      assert.throws(() => new Second(-12n, 1n).gtS(Second.END_OF_TIME))
      assert.throws(() => Second.END_OF_TIME.gtS(Second.END_OF_TIME))
    })

    it('converts to milliseconds', () => {
      assert.throws(() => Second.END_OF_TIME.toMillis())
    })
  })
})

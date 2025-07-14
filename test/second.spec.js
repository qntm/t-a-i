import assert from 'node:assert'
import { describe, it } from 'mocha'
import { Rat } from '../src/rat.js'
import { Second } from '../src/second.js'

describe('Second', () => {
  it('adds', () => {
    assert.deepStrictEqual(new Second(new Rat(1n, 2n)).plusS(new Second(new Rat(1n, 3n))), new Second(new Rat(5n, 6n)))
    assert.deepStrictEqual(new Second(new Rat(1n, 2n)).plusS(new Second(new Rat(0n, 3n))), new Second(new Rat(1n, 2n)))
    assert.deepStrictEqual(new Second(new Rat(0n, 2n)).plusS(new Second(new Rat(1n, 3n))), new Second(new Rat(1n, 3n)))
  })

  it('subtracts', () => {
    assert.deepStrictEqual(new Second(new Rat(1n, 2n)).minusS(new Second(new Rat(1n, 3n))), new Second(new Rat(1n, 6n)))
    assert.deepStrictEqual(new Second(new Rat(1n, 2n)).minusS(new Second(new Rat(0n, 3n))), new Second(new Rat(1n, 2n)))
    assert.deepStrictEqual(new Second(new Rat(0n, 2n)).minusS(new Second(new Rat(1n, 3n))), new Second(new Rat(-1n, 3n)))
  })

  it('multiplies', () => {
    assert.deepStrictEqual(new Second(new Rat(6n, 5n)).timesR(new Rat(4n, 5n)), new Second(new Rat(24n, 25n)))
    assert.deepStrictEqual(new Second(new Rat(6n, 5n)).timesR(new Rat(0n, 5n)), new Second(new Rat(0n, 25n)))
    assert.deepStrictEqual(new Second(new Rat(0n, 5n)).timesR(new Rat(4n, 5n)), new Second(new Rat(0n, 25n)))
  })

  it('divides', () => {
    assert.deepStrictEqual(new Second(new Rat(6n, 5n)).divideS(new Second(new Rat(4n, 5n))), new Rat(30n, 20n))
    assert.deepStrictEqual(new Second(new Rat(0n, 5n)).divideS(new Second(new Rat(4n, 5n))), new Rat(0n, 20n))
  })

  it('greater than', () => {
    assert.strictEqual(new Second(new Rat(-1n, 3n)).gtS(new Second(new Rat(1n, -2n))), true)
    assert.strictEqual(new Second(new Rat(0n)).gtS(new Second(new Rat(1n))), false)
  })

  it('equal', () => {
    assert.strictEqual(new Second(new Rat(-1n, 3n)).eqS(new Second(new Rat(4n, -12n))), true)
    assert.strictEqual(new Second(new Rat(0n)).eqS(new Second(new Rat(-1n))), false)
    assert.strictEqual(new Second(new Rat(0n)).eqS(new Second(new Rat(-0n))), true)
  })

  it('less than or equal', () => {
    assert.strictEqual(new Second(new Rat(-2n, -3n)).leS(new Second(new Rat(-2n, -3n))), true)
    assert.strictEqual(new Second(new Rat(-2n, -3n)).leS(new Second(new Rat(2n, 3n))), true)
    assert.strictEqual(new Second(new Rat(9n, 12n)).leS(new Second(new Rat(6n, 8n))), true)
    assert.strictEqual(new Second(new Rat(9n, 13n)).leS(new Second(new Rat(6n, 8n))), true)
  })

  it('fromMillis', () => {
    assert.deepStrictEqual(Second.fromMillis(123n), new Second(new Rat(123n, 1_000n)))
    assert.throws(() => Second.fromMillis(Infinity))
  })

  it('toMillis', () => {
    assert.strictEqual(new Second(new Rat(123n, 1_000n)).toMillis(), 123n)
  })

  it('fromNanos', () => {
    assert.deepStrictEqual(Second.fromNanos(123n), new Second(new Rat(123n, 1_000_000_000n)))
    assert.throws(() => Second.fromNanos(Infinity))
  })

  it('toNanos', () => {
    assert.strictEqual(new Second(new Rat(123n, 1_000_000_000n)).toNanos(), 123n)
  })
})

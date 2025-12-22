import assert from 'node:assert/strict'

import { describe, it } from 'mocha'
import { Rat } from '../src/rat.js'
import { Range } from '../src/range.js'
import { Second } from '../src/second.js'
import { Segment } from '../src/segment.js'

const MAY = 4

describe('Segment', () => {
  it('disallows bad powers', () => {
    assert.throws(() => new Segment(
      { atomic: new Rat(0n) }
    ), /TAI start must be a `Second`/)
    assert.throws(() => new Segment(
      { atomic: Second.fromMillis(0n), unix: new Rat(0n) }
    ), /Unix start must be a `Second`/)
    assert.throws(() => new Segment(
      { atomic: Second.fromMillis(0n), unix: Second.fromMillis(0n) },
      { atomic: new Rat(1n) }
    ), /TAI end must be a `Second` or `Second.END_OF_TIME`/)
    assert.throws(() => new Segment(
      { atomic: Second.fromMillis(0n), unix: Second.fromMillis(0n) },
      { atomic: Second.fromMillis(1_000n) },
      { unixPerAtomic: new Second(new Rat(1n, 1n)) }
    ), /slope must be a `Rat`/)
  })

  it('disallows rays which run backwards', () => {
    assert.throws(() => new Segment(
      { atomic: Second.fromMillis(0n), unix: Second.fromMillis(0n) },
      { atomic: new Second(new Rat(-1n, 1_000_000_000_000n)) }
    ), /segment length must be positive/)
  })

  it('disallows zero-length rays which run backwards', () => {
    assert.throws(() => new Segment(
      { atomic: Second.fromMillis(0n), unix: Second.fromMillis(0n) },
      { atomic: Second.fromMillis(0n) }
    ), /segment length must be positive/)
  })

  describe('basic infinite ray', () => {
    const segment = new Segment(
      { atomic: Second.fromMillis(0n), unix: Second.fromMillis(0n) }
    )

    it('zero point', () => {
      assert.equal(segment.unixOnSegment(Second.fromMillis(0n)),
        true)
      assert.deepEqual(segment.unixToAtomicRange(Second.fromMillis(0n)),
        new Range(Second.fromMillis(0n)))
      assert.equal(segment.atomicOnSegment(Second.fromMillis(0n)),
        true)
      assert.deepEqual(segment.atomicToUnix(Second.fromMillis(0n)),
        Second.fromMillis(0n))
    })

    it('modern day', () => {
      assert.equal(segment.unixOnSegment(Second.fromMillis(BigInt(Date.UTC(2021, MAY, 16, 12, 11, 10, 9)))),
        true)
      assert.deepEqual(segment.unixToAtomicRange(Second.fromMillis(BigInt(Date.UTC(2021, MAY, 16, 12, 11, 10, 9)))),
        new Range(Second.fromMillis(BigInt(Date.UTC(2021, MAY, 16, 12, 11, 10, 9)))))
      assert.equal(segment.atomicOnSegment(Second.fromMillis(BigInt(Date.UTC(2021, MAY, 16, 12, 11, 10, 9)))),
        true)
      assert.deepEqual(segment.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(2021, MAY, 16, 12, 11, 10, 9)))),
        Second.fromMillis(BigInt(Date.UTC(2021, MAY, 16, 12, 11, 10, 9))))
    })

    it('before start point', () => {
      assert.equal(segment.unixOnSegment(Second.fromMillis(-1n)),
        false)
      assert.deepEqual(segment.unixToAtomicRange(Second.fromMillis(-1n)),
        new Range(Second.fromMillis(-1n)))
      assert.equal(segment.atomicOnSegment(Second.fromMillis(-1n)),
        false)
      assert.deepEqual(segment.atomicToUnix(Second.fromMillis(-1n)),
        Second.fromMillis(-1n))
    })
  })

  describe('sloped, finite ray', () => {
    const segment = new Segment(
      { atomic: Second.fromMillis(0n), unix: Second.fromMillis(0n) },
      { atomic: Second.fromMillis(2_000n) }, // 2 TAI seconds
      { unixPerAtomic: new Rat(1n, 2n) } // TAI runs twice as fast as Unix time
    )

    it('zero point', () => {
      assert.equal(segment.unixOnSegment(Second.fromMillis(0n)),
        true)
      assert.deepEqual(segment.unixToAtomicRange(Second.fromMillis(0n)),
        new Range(Second.fromMillis(0n)))
      assert.equal(segment.atomicOnSegment(Second.fromMillis(0n)),
        true)
      assert.deepEqual(segment.atomicToUnix(Second.fromMillis(0n)),
        Second.fromMillis(0n))
    })

    it('a little later', () => {
      assert.equal(segment.unixOnSegment(Second.fromMillis(501n)),
        true)
      assert.deepEqual(segment.unixToAtomicRange(Second.fromMillis(501n)),
        new Range(Second.fromMillis(1_002n)))
      assert.equal(segment.atomicOnSegment(Second.fromMillis(1_002n)),
        true)
      assert.deepEqual(segment.atomicToUnix(Second.fromMillis(1_002n)),
        Second.fromMillis(501n))
    })

    it('right before end point', () => {
      assert.equal(segment.unixOnSegment(Second.fromMillis(999n)),
        true)
      assert.deepEqual(segment.unixToAtomicRange(Second.fromMillis(999n)),
        new Range(Second.fromMillis(1_998n)))

      assert.equal(segment.atomicOnSegment(Second.fromMillis(1_998n)),
        true)
      assert.deepEqual(segment.atomicToUnix(Second.fromMillis(1_998n)),
        Second.fromMillis(999n))
      assert.equal(segment.atomicOnSegment(Second.fromMillis(1_999n)),
        true)
      assert.deepEqual(segment.atomicToUnix(Second.fromMillis(1_999n)),
        new Second(new Rat(1_999n, 2_000n))) // truncates to 999ms
    })

    it('end point', () => {
      assert.equal(segment.unixOnSegment(Second.fromMillis(1_000n)),
        false)
      assert.deepEqual(segment.unixToAtomicRange(Second.fromMillis(1_000n)),
        new Range(Second.fromMillis(2_000n)))
      assert.equal(segment.atomicOnSegment(Second.fromMillis(2_000n)),
        false)
      assert.deepEqual(segment.atomicToUnix(Second.fromMillis(2_000n)),
        Second.fromMillis(1_000n))
    })
  })

  describe('horizontal ray', () => {
    const segment = new Segment(
      { atomic: Second.fromMillis(0n), unix: Second.fromMillis(0n) },
      { atomic: Second.fromMillis(2_000n) }, // 2 TAI seconds
      { unixPerAtomic: new Rat(0n) }
    )

    it('zero point', () => {
      assert.equal(segment.unixOnSegment(Second.fromMillis(0n)),
        true)
      assert.deepEqual(segment.unixToAtomicRange(Second.fromMillis(0n)),
        new Range(Second.fromMillis(0n), Second.fromMillis(2_000n), true))
      assert.equal(segment.atomicOnSegment(Second.fromMillis(0n)),
        true)
      assert.deepEqual(segment.atomicToUnix(Second.fromMillis(0n)),
        Second.fromMillis(0n))
    })

    it('later in TAI', () => {
      assert.equal(segment.atomicOnSegment(Second.fromMillis(1_999n)),
        true)
      assert.deepEqual(segment.atomicToUnix(Second.fromMillis(1_999n)),
        Second.fromMillis(0n))
      assert.equal(segment.atomicOnSegment(Second.fromMillis(2_000n)),
        false)
      assert.deepEqual(segment.atomicToUnix(Second.fromMillis(2_000n)),
        Second.fromMillis(0n))
    })

    it('later in Unix time', () => {
      assert.equal(segment.unixOnSegment(Second.fromMillis(1_000n)),
        false)
      assert.throws(() => segment.unixToAtomicRange(Second.fromMillis(-1n)),
        /This Unix time never happened/)
    })
  })
})

const assert = require('node:assert')
const { Rat } = require('../src/rat.js')
const { Range } = require('../src/range.js')
const { Second } = require('../src/second.js')
const { Segment } = require('../src/segment.js')

const MAY = 4

describe('Segment', () => {
  it('disallows bad powers', () => {
    assert.throws(() => new Segment(
      { atomic: new Rat(0n) }
    ), /TAI start must be a rational number of seconds/)
    assert.throws(() => new Segment(
      { atomic: Second.fromMillis(0), unix: new Rat(0n) }
    ), /Unix start must be a rational number of seconds/)
    assert.throws(() => new Segment(
      { atomic: Second.fromMillis(0), unix: Second.fromMillis(0) },
      { atomic: new Rat(1n) }
    ), /TAI end must be a rational number of seconds/)
    assert.throws(() => new Segment(
      { atomic: Second.fromMillis(0), unix: Second.fromMillis(0) },
      { atomic: Second.fromMillis(1_000) },
      { unixPerAtomic: new Second(1n, 1n) }
    ), /Slope must be a pure ratio/)
  })

  it('disallows rays which run backwards', () => {
    assert.throws(() => new Segment(
      { atomic: Second.fromMillis(0), unix: Second.fromMillis(0) },
      { atomic: new Second(-1n, 1_000_000_000_000n) }
    ), /Segment length must be positive/)
  })

  it('disallows zero-length rays which run backwards', () => {
    assert.throws(() => new Segment(
      { atomic: Second.fromMillis(0), unix: Second.fromMillis(0) },
      { atomic: Second.fromMillis(0) }
    ), /Segment length must be positive/)
  })

  describe('basic infinite ray', () => {
    const segment = new Segment(
      { atomic: Second.fromMillis(0), unix: Second.fromMillis(0) }
    )

    it('zero point', () => {
      assert.strictEqual(segment.unixOnSegment(Second.fromMillis(0)),
        true)
      assert.deepStrictEqual(segment.unixToAtomicRange(Second.fromMillis(0)),
        new Range(Second.fromMillis(0)))
      assert.strictEqual(segment.atomicOnSegment(Second.fromMillis(0)),
        true)
      assert.deepStrictEqual(segment.atomicToUnix(Second.fromMillis(0)),
        Second.fromMillis(0))
    })

    it('modern day', () => {
      assert.strictEqual(segment.unixOnSegment(Second.fromMillis(Date.UTC(2021, MAY, 16, 12, 11, 10, 9))),
        true)
      assert.deepStrictEqual(segment.unixToAtomicRange(Second.fromMillis(Date.UTC(2021, MAY, 16, 12, 11, 10, 9))),
        new Range(Second.fromMillis(Date.UTC(2021, MAY, 16, 12, 11, 10, 9))))
      assert.strictEqual(segment.atomicOnSegment(Second.fromMillis(Date.UTC(2021, MAY, 16, 12, 11, 10, 9))),
        true)
      assert.deepStrictEqual(segment.atomicToUnix(Second.fromMillis(Date.UTC(2021, MAY, 16, 12, 11, 10, 9))),
        Second.fromMillis(Date.UTC(2021, MAY, 16, 12, 11, 10, 9)))
    })

    it('before start point', () => {
      assert.strictEqual(segment.unixOnSegment(Second.fromMillis(-1)),
        false)
      assert.deepStrictEqual(segment.unixToAtomicRange(Second.fromMillis(-1)),
        new Range(Second.fromMillis(-1)))
      assert.strictEqual(segment.atomicOnSegment(Second.fromMillis(-1)),
        false)
      assert.deepStrictEqual(segment.atomicToUnix(Second.fromMillis(-1)),
        Second.fromMillis(-1))
    })
  })

  describe('sloped, finite ray', () => {
    const segment = new Segment(
      { atomic: Second.fromMillis(0), unix: Second.fromMillis(0) },
      { atomic: Second.fromMillis(2_000) }, // 2 TAI seconds
      { unixPerAtomic: new Rat(1n, 2n) } // TAI runs twice as fast as Unix time
    )

    it('zero point', () => {
      assert.strictEqual(segment.unixOnSegment(Second.fromMillis(0)),
        true)
      assert.deepStrictEqual(segment.unixToAtomicRange(Second.fromMillis(0)),
        new Range(Second.fromMillis(0)))
      assert.strictEqual(segment.atomicOnSegment(Second.fromMillis(0)),
        true)
      assert.deepStrictEqual(segment.atomicToUnix(Second.fromMillis(0)),
        Second.fromMillis(0))
    })

    it('a little later', () => {
      assert.strictEqual(segment.unixOnSegment(Second.fromMillis(501)),
        true)
      assert.deepStrictEqual(segment.unixToAtomicRange(Second.fromMillis(501)),
        new Range(Second.fromMillis(1_002)))
      assert.strictEqual(segment.atomicOnSegment(Second.fromMillis(1_002)),
        true)
      assert.deepStrictEqual(segment.atomicToUnix(Second.fromMillis(1_002)),
        Second.fromMillis(501))
    })

    it('right before end point', () => {
      assert.strictEqual(segment.unixOnSegment(Second.fromMillis(999)),
        true)
      assert.deepStrictEqual(segment.unixToAtomicRange(Second.fromMillis(999)),
        new Range(Second.fromMillis(1_998)))

      assert.strictEqual(segment.atomicOnSegment(Second.fromMillis(1_998)),
        true)
      assert.deepStrictEqual(segment.atomicToUnix(Second.fromMillis(1_998)),
        Second.fromMillis(999))
      assert.strictEqual(segment.atomicOnSegment(Second.fromMillis(1_999)),
        true)
      assert.deepStrictEqual(segment.atomicToUnix(Second.fromMillis(1_999)),
        new Second(1_999n, 2_000n)) // truncates to 999ms
    })

    it('end point', () => {
      assert.strictEqual(segment.unixOnSegment(Second.fromMillis(1_000)),
        false)
      assert.deepStrictEqual(segment.unixToAtomicRange(Second.fromMillis(1_000)),
        new Range(Second.fromMillis(2_000)))
      assert.strictEqual(segment.atomicOnSegment(Second.fromMillis(2_000)),
        false)
      assert.deepStrictEqual(segment.atomicToUnix(Second.fromMillis(2_000)),
        Second.fromMillis(1_000))
    })
  })

  describe('horizontal ray', () => {
    const segment = new Segment(
      { atomic: Second.fromMillis(0), unix: Second.fromMillis(0) },
      { atomic: Second.fromMillis(2_000) }, // 2 TAI seconds
      { unixPerAtomic: new Rat(0n) }
    )

    it('zero point', () => {
      assert.strictEqual(segment.unixOnSegment(Second.fromMillis(0)),
        true)
      assert.deepStrictEqual(segment.unixToAtomicRange(Second.fromMillis(0)),
        new Range(Second.fromMillis(0), Second.fromMillis(2_000), true))
      assert.strictEqual(segment.atomicOnSegment(Second.fromMillis(0)),
        true)
      assert.deepStrictEqual(segment.atomicToUnix(Second.fromMillis(0)),
        Second.fromMillis(0))
    })

    it('later in TAI', () => {
      assert.strictEqual(segment.atomicOnSegment(Second.fromMillis(1_999)),
        true)
      assert.deepStrictEqual(segment.atomicToUnix(Second.fromMillis(1_999)),
        Second.fromMillis(0))
      assert.strictEqual(segment.atomicOnSegment(Second.fromMillis(2_000)),
        false)
      assert.deepStrictEqual(segment.atomicToUnix(Second.fromMillis(2_000)),
        Second.fromMillis(0))
    })

    it('later in Unix time', () => {
      assert.strictEqual(segment.unixOnSegment(Second.fromMillis(1_000)),
        false)
      assert.throws(() => segment.unixToAtomicRange(Second.fromMillis(-1)),
        /This Unix time never happened/)
    })
  })
})

/* eslint-env jest */

const { Segment } = require('./segment')
const { Rat } = require('./rat')

const MAY = 4

describe('Segment', () => {
  it('disallows rays which run backwards', () => {
    expect(() => new Segment(
      { atomicPicos: 0n, unixMillis: 0 },
      { atomicPicos: -1n },
      { unixMillis: 1 },
      { atomicPicos: 1_000_000_000n }
    )).toThrowError('Segment length must be positive')
  })

  it('disallows zero-length rays which run backwards', () => {
    expect(() => new Segment(
      { atomicPicos: 0n, unixMillis: 0 },
      { atomicPicos: 0n },
      { unixMillis: 1 },
      { atomicPicos: 1_000_000_000n }
    )).toThrowError('Segment length must be positive')
  })

  describe('basic infinite ray', () => {
    const segment = new Segment(
      { atomicPicos: 0n, unixMillis: 0 },
      { atomicPicos: Infinity },
      { unixMillis: 1 },
      { atomicPicos: 1_000_000_000n }
    )

    it('zero point', () => {
      expect(segment.unixRatioOnSegment(new Rat(0n))).toBe(true)
      expect(segment.unixRatioToAtomicRatioRange(new Rat(0n)))
        .toEqual({ start: new Rat(0n), end: new Rat(0n), closed: true })
      expect(segment.atomicRatioOnSegment(new Rat(0n))).toBe(true)
      expect(segment.atomicRatioToUnixRatio(new Rat(0n))).toEqual(new Rat(0n))
    })

    it('modern day', () => {
      expect(segment.unixRatioOnSegment(new Rat(BigInt(Date.UTC(2021, MAY, 16, 12, 11, 10, 9)), 1000n))).toBe(true)
      expect(segment.unixRatioToAtomicRatioRange(new Rat(BigInt(Date.UTC(2021, MAY, 16, 12, 11, 10, 9)), 1000n)))
        .toEqual({
          start: new Rat(BigInt(Date.UTC(2021, MAY, 16, 12, 11, 10, 9)), 1000n),
          end: new Rat(BigInt(Date.UTC(2021, MAY, 16, 12, 11, 10, 9)), 1000n),
          closed: true
        })
      expect(segment.atomicRatioOnSegment(new Rat(BigInt(Date.UTC(2021, MAY, 16, 12, 11, 10, 9)), 1000n))).toBe(true)
      expect(segment.atomicRatioToUnixRatio(new Rat(BigInt(Date.UTC(2021, MAY, 16, 12, 11, 10, 9)), 1000n)))
        .toEqual(new Rat(BigInt(Date.UTC(2021, MAY, 16, 12, 11, 10, 9)), 1000n))
    })

    it('before start point', () => {
      expect(segment.unixRatioOnSegment(new Rat(-1n, 1000n))).toBe(false)
      expect(segment.unixRatioToAtomicRatioRange(new Rat(-1n, 1000n)))
        .toEqual({ start: new Rat(-1n, 1000n), end: new Rat(-1n, 1000n), closed: true })
      expect(segment.atomicRatioOnSegment(new Rat(-1n, 1000n))).toBe(false)
      expect(segment.atomicRatioToUnixRatio(new Rat(-1n, 1000n))).toEqual(new Rat(-1n, 1000n))
    })
  })

  describe('sloped, finite ray', () => {
    const segment = new Segment(
      { atomicPicos: 0n, unixMillis: 0 },
      { atomicPicos: 2_000_000_000_000n }, // 2 TAI seconds
      { unixMillis: 1 },
      { atomicPicos: 2_000_000_000n } // TAI runs twice as fast as Unix time
    )

    it('zero point', () => {
      expect(segment.unixRatioOnSegment(new Rat(0n))).toBe(true)
      expect(segment.unixRatioToAtomicRatioRange(new Rat(0n)))
        .toEqual({ start: new Rat(0n), end: new Rat(0n), closed: true })
      expect(segment.atomicRatioOnSegment(new Rat(0n))).toBe(true)
      expect(segment.atomicRatioToUnixRatio(new Rat(0n))).toEqual(new Rat(0n))
    })

    it('a little later', () => {
      expect(segment.unixRatioOnSegment(new Rat(501n, 1000n))).toBe(true)
      expect(segment.unixRatioToAtomicRatioRange(new Rat(501n, 1000n)))
        .toEqual({ start: new Rat(1_002n, 1000n), end: new Rat(1_002n, 1000n), closed: true })
      expect(segment.atomicRatioOnSegment(new Rat(1_002n, 1000n))).toBe(true)
      expect(segment.atomicRatioToUnixRatio(new Rat(1_002n, 1000n))).toEqual(new Rat(501n, 1000n))
    })

    it('right before end point', () => {
      expect(segment.unixRatioOnSegment(new Rat(999n, 1000n))).toBe(true)
      expect(segment.unixRatioToAtomicRatioRange(new Rat(999n, 1000n)))
        .toEqual({ start: new Rat(1_998n, 1000n), end: new Rat(1_998n, 1000n), closed: true })

      expect(segment.atomicRatioOnSegment(new Rat(1_998n, 1000n))).toBe(true)
      expect(segment.atomicRatioToUnixRatio(new Rat(1_998n, 1000n))).toEqual(new Rat(999n, 1000n))
      expect(segment.atomicRatioOnSegment(new Rat(1_999n, 1000n))).toBe(true)
      expect(segment.atomicRatioToUnixRatio(new Rat(1_999n, 1000n))).toEqual(new Rat(1999n, 2000n)) // truncates to 999ms
    })

    it('end point', () => {
      expect(segment.unixRatioOnSegment(new Rat(1n))).toBe(false)
      expect(segment.unixRatioToAtomicRatioRange(new Rat(1n)))
        .toEqual({ start: new Rat(2_000n, 1000n), end: new Rat(2_000n, 1000n), closed: true })
      expect(segment.atomicRatioOnSegment(new Rat(2n))).toBe(false)
      expect(segment.atomicRatioToUnixRatio(new Rat(2n))).toEqual(new Rat(1n))
    })
  })

  describe('horizontal ray', () => {
    const segment = new Segment(
      { atomicPicos: 0n, unixMillis: 0 },
      { atomicPicos: 2_000_000_000_000n }, // 2 TAI seconds
      { unixMillis: 0 },
      { atomicPicos: 2_000_000_000_000n }
    )

    it('zero point', () => {
      expect(segment.unixRatioOnSegment(new Rat(0n))).toBe(true)
      expect(segment.unixRatioToAtomicRatioRange(new Rat(0n)))
        .toEqual({ start: new Rat(0n), end: new Rat(2_000n, 1000n), closed: false })
      expect(segment.atomicRatioOnSegment(new Rat(0n))).toBe(true)
      expect(segment.atomicRatioToUnixRatio(new Rat(0n))).toEqual(new Rat(0n))
    })

    it('later in TAI', () => {
      expect(segment.atomicRatioOnSegment(new Rat(1_999n, 1000n))).toBe(true)
      expect(segment.atomicRatioToUnixRatio(new Rat(1_999n, 1000n))).toEqual(new Rat(0n))
      expect(segment.atomicRatioOnSegment(new Rat(2_000n, 1000n))).toBe(false)
      expect(segment.atomicRatioToUnixRatio(new Rat(2_000n, 1000n))).toEqual(new Rat(0n))
    })

    it('later in Unix time', () => {
      expect(segment.unixRatioOnSegment(new Rat(1n))).toBe(false)
      expect(() => segment.unixRatioToAtomicRatioRange(new Rat(-1n, 1000n)))
        .toThrowError('This Unix time never happened')
    })
  })
})

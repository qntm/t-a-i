/* eslint-env jest */

const { Segment } = require('./segment')
const { Rat } = require('./rat')

const MAY = 4
const picosPerMilli = 1000n * 1000n * 1000n

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
      expect(segment.unixMillisRatioToAtomicMillisRange(new Rat(0n)))
        .toEqual({ start: 0, end: 0, closed: true })
      expect(segment.atomicRatioOnSegment(new Rat(0n))).toBe(true)
      expect(segment.atomicRatioToUnixRatio(new Rat(0n))).toEqual(new Rat(0n))
    })

    it('modern day', () => {
      expect(segment.unixRatioOnSegment(new Rat(BigInt(Date.UTC(2021, MAY, 16, 12, 11, 10, 9)), 1000n))).toBe(true)
      expect(segment.unixMillisRatioToAtomicMillisRange(new Rat(BigInt(Date.UTC(2021, MAY, 16, 12, 11, 10, 9)))))
        .toEqual({
          start: Date.UTC(2021, MAY, 16, 12, 11, 10, 9),
          end: Date.UTC(2021, MAY, 16, 12, 11, 10, 9),
          closed: true
        })
      expect(segment.atomicRatioOnSegment(new Rat(BigInt(Date.UTC(2021, MAY, 16, 12, 11, 10, 9)), 1000n))).toBe(true)
      expect(segment.atomicRatioToUnixRatio(new Rat(BigInt(Date.UTC(2021, MAY, 16, 12, 11, 10, 9)), 1000n)))
        .toEqual(new Rat(BigInt(Date.UTC(2021, MAY, 16, 12, 11, 10, 9)), 1000n))
    })

    it('before start point', () => {
      expect(segment.unixRatioOnSegment(new Rat(-1n, 1000n))).toBe(false)
      expect(segment.unixMillisRatioToAtomicMillisRange(new Rat(-1n)))
        .toEqual({ start: -1, end: -1, closed: true })
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
      expect(segment.unixMillisRatioToAtomicMillisRange(new Rat(0n)))
        .toEqual({ start: 0, end: 0, closed: true })
      expect(segment.atomicRatioOnSegment(new Rat(0n))).toBe(true)
      expect(segment.atomicRatioToUnixRatio(new Rat(0n))).toEqual(new Rat(0n))
    })

    it('a little later', () => {
      expect(segment.unixRatioOnSegment(new Rat(501n, 1000n))).toBe(true)
      expect(segment.unixMillisRatioToAtomicMillisRange(new Rat(501n)))
        .toEqual({ start: 1002, end: 1002, closed: true })
      expect(segment.atomicRatioOnSegment(new Rat(1_002n, 1000n))).toBe(true)
      expect(segment.atomicRatioToUnixRatio(new Rat(1_002n, 1000n))).toEqual(new Rat(501n, 1000n))
    })

    it('right before end point', () => {
      expect(segment.unixRatioOnSegment(new Rat(999n, 1000n))).toBe(true)
      expect(segment.unixMillisRatioToAtomicMillisRange(new Rat(999n)))
        .toEqual({ start: 1998, end: 1998, closed: true })

      expect(segment.atomicRatioOnSegment(new Rat(1_998n, 1000n))).toBe(true)
      expect(segment.atomicRatioToUnixRatio(new Rat(1_998n, 1000n))).toEqual(new Rat(999n, 1000n))
      expect(segment.atomicRatioOnSegment(new Rat(1_999n, 1000n))).toBe(true)
      expect(segment.atomicRatioToUnixRatio(new Rat(1_999n, 1000n))).toEqual(new Rat(1999n, 2000n)) // truncates to 999ms
    })

    it('end point', () => {
      expect(segment.unixRatioOnSegment(new Rat(1n))).toBe(false)
      expect(segment.unixMillisRatioToAtomicMillisRange(new Rat(1000n)))
        .toEqual({ start: 2000, end: 2000, closed: true })
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
      expect(segment.unixMillisRatioToAtomicMillisRange(new Rat(0n)))
        .toEqual({ start: 0, end: 2000, closed: false })
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
      expect(() => segment.unixMillisRatioToAtomicMillisRange(new Rat(-1n)))
        .toThrowError('This Unix time never happened')
    })
  })
})

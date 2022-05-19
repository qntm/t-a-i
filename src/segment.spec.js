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
      expect(segment.unixMillisToAtomicMillisRange(0))
        .toEqual({ start: 0, end: 0, closed: true })
      expect(segment.atomicPicosRatioOnSegment(new Rat(0n))).toBe(true)
      expect(segment.atomicMillisToUnixMillis(0)).toBe(0)
    })

    it('modern day', () => {
      expect(segment.unixRatioOnSegment(new Rat(BigInt(Date.UTC(2021, MAY, 16, 12, 11, 10, 9)), 1000n))).toBe(true)
      expect(segment.unixMillisToAtomicMillisRange(Date.UTC(2021, MAY, 16, 12, 11, 10, 9)))
        .toEqual({
          start: Date.UTC(2021, MAY, 16, 12, 11, 10, 9),
          end: Date.UTC(2021, MAY, 16, 12, 11, 10, 9),
          closed: true
        })
     expect(segment.atomicPicosRatioOnSegment(new Rat(BigInt(Date.UTC(2021, MAY, 16, 12, 11, 10, 9)) * picosPerMilli))).toBe(true)
      expect(segment.atomicMillisToUnixMillis(Date.UTC(2021, MAY, 16, 12, 11, 10, 9)))
        .toBe(Date.UTC(2021, MAY, 16, 12, 11, 10, 9))
    })

    it('before start point', () => {
      expect(segment.unixRatioOnSegment(new Rat(-1n, 1000n))).toBe(false)
      expect(segment.unixMillisToAtomicMillisRange(-1))
        .toEqual({ start: -1, end: -1, closed: true })
      expect(segment.atomicPicosRatioOnSegment(new Rat(-1_000_000_000n))).toBe(false)
      expect(segment.atomicMillisToUnixMillis(-1)).toBe(-1)
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
      expect(segment.unixMillisToAtomicMillisRange(0))
        .toEqual({ start: 0, end: 0, closed: true })
      expect(segment.atomicPicosRatioOnSegment(new Rat(0n))).toBe(true)
      expect(segment.atomicMillisToUnixMillis(0)).toBe(0)
    })

    it('a little later', () => {
      expect(segment.unixRatioOnSegment(new Rat(501n, 1000n))).toBe(true)
      expect(segment.unixMillisToAtomicMillisRange(501))
        .toEqual({ start: 1002, end: 1002, closed: true })
      expect(segment.atomicPicosRatioOnSegment(new Rat(1_002_000_000_000n))).toBe(true)
      expect(segment.atomicMillisToUnixMillis(1002)).toBe(501)
    })

    it('right before end point', () => {
      expect(segment.unixRatioOnSegment(new Rat(999n, 1000n))).toBe(true)
      expect(segment.unixMillisToAtomicMillisRange(999))
        .toEqual({ start: 1998, end: 1998, closed: true })

      expect(segment.atomicPicosRatioOnSegment(new Rat(1_998_000_000_000n))).toBe(true)
      expect(segment.atomicMillisToUnixMillis(1998)).toBe(999)
      expect(segment.atomicPicosRatioOnSegment(new Rat(1_999_000_000_000n))).toBe(true)
      expect(segment.atomicMillisToUnixMillis(1999)).toBe(999) // truncated
    })

    it('end point', () => {
      expect(segment.unixRatioOnSegment(new Rat(1n))).toBe(false)
      expect(segment.unixMillisToAtomicMillisRange(1000))
        .toEqual({ start: 2000, end: 2000, closed: true })
      expect(segment.atomicPicosRatioOnSegment(new Rat(2_000_000_000_000n))).toBe(false)
      expect(segment.atomicMillisToUnixMillis(2000)).toBe(1000)
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
      expect(segment.unixMillisToAtomicMillisRange(0))
        .toEqual({ start: 0, end: 2000, closed: false })
      expect(segment.atomicPicosRatioOnSegment(new Rat(0n))).toBe(true)
      expect(segment.atomicMillisToUnixMillis(0)).toBe(0)
    })

    it('later in TAI', () => {
      expect(segment.atomicPicosRatioOnSegment(new Rat(1_999_000_000_000n))).toBe(true)
      expect(segment.atomicMillisToUnixMillis(1999)).toBe(0)
      expect(segment.atomicPicosRatioOnSegment(new Rat(2_000_000_000_000n))).toBe(false)
      expect(segment.atomicMillisToUnixMillis(2000)).toBe(0)
    })

    it('later in Unix time', () => {
      expect(segment.unixRatioOnSegment(new Rat(1n))).toBe(false)
      expect(() => segment.unixMillisToAtomicMillisRange(-1))
        .toThrowError('This Unix time never happened')
    })
  })
})

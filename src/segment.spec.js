/* eslint-env jest */

const { Segment } = require('./segment')
const { millisToExact } = require('./munge')
const { Rat } = require('./rat')

const MAY = 4

describe('Segment', () => {
  it('disallows rays which run backwards', () => {
    expect(() => new Segment(
      { atomic: new Rat(0n), unix: new Rat(0n) },
      { atomic: new Rat(-1n, 1_000_000_000_000n) },
      new Rat(1n)
    )).toThrowError('Segment length must be positive')
  })

  it('disallows zero-length rays which run backwards', () => {
    expect(() => new Segment(
      { atomic: new Rat(0n), unix: new Rat(0n) },
      { atomic: new Rat(0n) },
      new Rat(1n)
    )).toThrowError('Segment length must be positive')
  })

  describe('basic infinite ray', () => {
    const segment = new Segment(
      { atomic: new Rat(0n), unix: new Rat(0n) },
      { atomic: Infinity },
      new Rat(1n)
    )

    it('zero point', () => {
      expect(segment.unixOnSegment(new Rat(0n))).toBe(true)
      expect(segment.unixToAtomicRange(new Rat(0n)))
        .toEqual({ start: new Rat(0n), end: new Rat(0n) })
      expect(segment.atomicOnSegment(new Rat(0n))).toBe(true)
      expect(segment.atomicToUnix(new Rat(0n))).toEqual(new Rat(0n))
    })

    it('modern day', () => {
      expect(segment.unixOnSegment(millisToExact(Date.UTC(2021, MAY, 16, 12, 11, 10, 9)))).toBe(true)
      expect(segment.unixToAtomicRange(millisToExact(Date.UTC(2021, MAY, 16, 12, 11, 10, 9))))
        .toEqual({
          start: millisToExact(Date.UTC(2021, MAY, 16, 12, 11, 10, 9)),
          end: millisToExact(Date.UTC(2021, MAY, 16, 12, 11, 10, 9))
        })
      expect(segment.atomicOnSegment(millisToExact(Date.UTC(2021, MAY, 16, 12, 11, 10, 9)))).toBe(true)
      expect(segment.atomicToUnix(millisToExact(Date.UTC(2021, MAY, 16, 12, 11, 10, 9))))
        .toEqual(millisToExact(Date.UTC(2021, MAY, 16, 12, 11, 10, 9)))
    })

    it('before start point', () => {
      expect(segment.unixOnSegment(new Rat(-1n, 1_000n))).toBe(false)
      expect(segment.unixToAtomicRange(new Rat(-1n, 1_000n)))
        .toEqual({ start: new Rat(-1n, 1_000n), end: new Rat(-1n, 1_000n) })
      expect(segment.atomicOnSegment(new Rat(-1n, 1_000n))).toBe(false)
      expect(segment.atomicToUnix(new Rat(-1n, 1_000n))).toEqual(new Rat(-1n, 1_000n))
    })
  })

  describe('sloped, finite ray', () => {
    const segment = new Segment(
      { atomic: new Rat(0n), unix: new Rat(0n) },
      { atomic: new Rat(2n) }, // 2 TAI seconds
      new Rat(1n, 2n) // TAI runs twice as fast as Unix time
    )

    it('zero point', () => {
      expect(segment.unixOnSegment(new Rat(0n))).toBe(true)
      expect(segment.unixToAtomicRange(new Rat(0n)))
        .toEqual({ start: new Rat(0n), end: new Rat(0n) })
      expect(segment.atomicOnSegment(new Rat(0n))).toBe(true)
      expect(segment.atomicToUnix(new Rat(0n))).toEqual(new Rat(0n))
    })

    it('a little later', () => {
      expect(segment.unixOnSegment(new Rat(501n, 1_000n))).toBe(true)
      expect(segment.unixToAtomicRange(new Rat(501n, 1_000n)))
        .toEqual({ start: new Rat(1_002n, 1_000n), end: new Rat(1_002n, 1_000n) })
      expect(segment.atomicOnSegment(new Rat(1_002n, 1_000n))).toBe(true)
      expect(segment.atomicToUnix(new Rat(1_002n, 1_000n))).toEqual(new Rat(501n, 1_000n))
    })

    it('right before end point', () => {
      expect(segment.unixOnSegment(new Rat(999n, 1_000n))).toBe(true)
      expect(segment.unixToAtomicRange(new Rat(999n, 1_000n)))
        .toEqual({ start: new Rat(1_998n, 1_000n), end: new Rat(1_998n, 1_000n) })

      expect(segment.atomicOnSegment(new Rat(1_998n, 1_000n))).toBe(true)
      expect(segment.atomicToUnix(new Rat(1_998n, 1_000n))).toEqual(new Rat(999n, 1_000n))
      expect(segment.atomicOnSegment(new Rat(1_999n, 1_000n))).toBe(true)
      expect(segment.atomicToUnix(new Rat(1_999n, 1_000n))).toEqual(new Rat(1_999n, 2_000n)) // truncates to 999ms
    })

    it('end point', () => {
      expect(segment.unixOnSegment(new Rat(1n))).toBe(false)
      expect(segment.unixToAtomicRange(new Rat(1n)))
        .toEqual({ start: new Rat(2_000n, 1_000n), end: new Rat(2_000n, 1_000n) })
      expect(segment.atomicOnSegment(new Rat(2n))).toBe(false)
      expect(segment.atomicToUnix(new Rat(2n))).toEqual(new Rat(1n))
    })
  })

  describe('horizontal ray', () => {
    const segment = new Segment(
      { atomic: new Rat(0n), unix: new Rat(0n) },
      { atomic: new Rat(2n) }, // 2 TAI seconds
      new Rat(0n)
    )

    it('zero point', () => {
      expect(segment.unixOnSegment(new Rat(0n))).toBe(true)
      expect(segment.unixToAtomicRange(new Rat(0n)))
        .toEqual({ start: new Rat(0n), end: new Rat(2_000n, 1_000n), open: true })
      expect(segment.atomicOnSegment(new Rat(0n))).toBe(true)
      expect(segment.atomicToUnix(new Rat(0n))).toEqual(new Rat(0n))
    })

    it('later in TAI', () => {
      expect(segment.atomicOnSegment(new Rat(1_999n, 1_000n))).toBe(true)
      expect(segment.atomicToUnix(new Rat(1_999n, 1_000n))).toEqual(new Rat(0n))
      expect(segment.atomicOnSegment(new Rat(2_000n, 1_000n))).toBe(false)
      expect(segment.atomicToUnix(new Rat(2_000n, 1_000n))).toEqual(new Rat(0n))
    })

    it('later in Unix time', () => {
      expect(segment.unixOnSegment(new Rat(1n))).toBe(false)
      expect(() => segment.unixToAtomicRange(new Rat(-1n, 1_000n)))
        .toThrowError('This Unix time never happened')
    })
  })
})

/* eslint-env jest */

const { Segment } = require('./segment')
const { Rat } = require('./rat')

const MAY = 4

describe('Segment', () => {
  it('disallows rays which run backwards', () => {
    expect(() => new Segment(
      { atomic: Rat.fromMillis(0), unix: Rat.fromMillis(0) },
      { atomic: new Rat(-1n, 1_000_000_000_000n) },
      new Rat(1n)
    )).toThrowError('Segment length must be positive')
  })

  it('disallows zero-length rays which run backwards', () => {
    expect(() => new Segment(
      { atomic: Rat.fromMillis(0), unix: Rat.fromMillis(0) },
      { atomic: Rat.fromMillis(0) },
      new Rat(1n)
    )).toThrowError('Segment length must be positive')
  })

  describe('basic infinite ray', () => {
    const segment = new Segment(
      { atomic: Rat.fromMillis(0), unix: Rat.fromMillis(0) },
      { atomic: Infinity },
      new Rat(1n)
    )

    it('zero point', () => {
      expect(segment.unixOnSegment(Rat.fromMillis(0))).toBe(true)
      expect(segment.unixToAtomicRange(Rat.fromMillis(0)))
        .toEqual({ start: Rat.fromMillis(0), end: Rat.fromMillis(0) })
      expect(segment.atomicOnSegment(Rat.fromMillis(0))).toBe(true)
      expect(segment.atomicToUnix(Rat.fromMillis(0))).toEqual(Rat.fromMillis(0))
    })

    it('modern day', () => {
      expect(segment.unixOnSegment(Rat.fromMillis(Date.UTC(2021, MAY, 16, 12, 11, 10, 9)))).toBe(true)
      expect(segment.unixToAtomicRange(Rat.fromMillis(Date.UTC(2021, MAY, 16, 12, 11, 10, 9))))
        .toEqual({
          start: Rat.fromMillis(Date.UTC(2021, MAY, 16, 12, 11, 10, 9)),
          end: Rat.fromMillis(Date.UTC(2021, MAY, 16, 12, 11, 10, 9))
        })
      expect(segment.atomicOnSegment(Rat.fromMillis(Date.UTC(2021, MAY, 16, 12, 11, 10, 9)))).toBe(true)
      expect(segment.atomicToUnix(Rat.fromMillis(Date.UTC(2021, MAY, 16, 12, 11, 10, 9))))
        .toEqual(Rat.fromMillis(Date.UTC(2021, MAY, 16, 12, 11, 10, 9)))
    })

    it('before start point', () => {
      expect(segment.unixOnSegment(Rat.fromMillis(-1))).toBe(false)
      expect(segment.unixToAtomicRange(Rat.fromMillis(-1)))
        .toEqual({ start: Rat.fromMillis(-1), end: Rat.fromMillis(-1) })
      expect(segment.atomicOnSegment(Rat.fromMillis(-1))).toBe(false)
      expect(segment.atomicToUnix(Rat.fromMillis(-1))).toEqual(Rat.fromMillis(-1))
    })
  })

  describe('sloped, finite ray', () => {
    const segment = new Segment(
      { atomic: Rat.fromMillis(0), unix: Rat.fromMillis(0) },
      { atomic: Rat.fromMillis(2_000n) }, // 2 TAI seconds
      new Rat(1n, 2n) // TAI runs twice as fast as Unix time
    )

    it('zero point', () => {
      expect(segment.unixOnSegment(Rat.fromMillis(0))).toBe(true)
      expect(segment.unixToAtomicRange(Rat.fromMillis(0)))
        .toEqual({ start: Rat.fromMillis(0), end: Rat.fromMillis(0) })
      expect(segment.atomicOnSegment(Rat.fromMillis(0))).toBe(true)
      expect(segment.atomicToUnix(Rat.fromMillis(0))).toEqual(Rat.fromMillis(0))
    })

    it('a little later', () => {
      expect(segment.unixOnSegment(Rat.fromMillis(501))).toBe(true)
      expect(segment.unixToAtomicRange(Rat.fromMillis(501)))
        .toEqual({ start: Rat.fromMillis(1_002), end: Rat.fromMillis(1_002) })
      expect(segment.atomicOnSegment(Rat.fromMillis(1_002))).toBe(true)
      expect(segment.atomicToUnix(Rat.fromMillis(1_002))).toEqual(Rat.fromMillis(501))
    })

    it('right before end point', () => {
      expect(segment.unixOnSegment(Rat.fromMillis(999))).toBe(true)
      expect(segment.unixToAtomicRange(Rat.fromMillis(999)))
        .toEqual({ start: Rat.fromMillis(1_998), end: Rat.fromMillis(1_998) })

      expect(segment.atomicOnSegment(Rat.fromMillis(1_998))).toBe(true)
      expect(segment.atomicToUnix(Rat.fromMillis(1_998))).toEqual(Rat.fromMillis(999))
      expect(segment.atomicOnSegment(Rat.fromMillis(1_999))).toBe(true)
      expect(segment.atomicToUnix(Rat.fromMillis(1_999))).toEqual(new Rat(1_999n, 2_000n)) // truncates to 999ms
    })

    it('end point', () => {
      expect(segment.unixOnSegment(Rat.fromMillis(1_000n))).toBe(false)
      expect(segment.unixToAtomicRange(Rat.fromMillis(1_000n)))
        .toEqual({ start: Rat.fromMillis(2_000), end: Rat.fromMillis(2_000) })
      expect(segment.atomicOnSegment(Rat.fromMillis(2_000n))).toBe(false)
      expect(segment.atomicToUnix(Rat.fromMillis(2_000n))).toEqual(Rat.fromMillis(1_000n))
    })
  })

  describe('horizontal ray', () => {
    const segment = new Segment(
      { atomic: Rat.fromMillis(0), unix: Rat.fromMillis(0) },
      { atomic: Rat.fromMillis(2_000n) }, // 2 TAI seconds
      new Rat(0n)
    )

    it('zero point', () => {
      expect(segment.unixOnSegment(Rat.fromMillis(0))).toBe(true)
      expect(segment.unixToAtomicRange(Rat.fromMillis(0)))
        .toEqual({ start: Rat.fromMillis(0), end: Rat.fromMillis(2_000), open: true })
      expect(segment.atomicOnSegment(Rat.fromMillis(0))).toBe(true)
      expect(segment.atomicToUnix(Rat.fromMillis(0))).toEqual(Rat.fromMillis(0))
    })

    it('later in TAI', () => {
      expect(segment.atomicOnSegment(Rat.fromMillis(1_999))).toBe(true)
      expect(segment.atomicToUnix(Rat.fromMillis(1_999))).toEqual(Rat.fromMillis(0))
      expect(segment.atomicOnSegment(Rat.fromMillis(2_000))).toBe(false)
      expect(segment.atomicToUnix(Rat.fromMillis(2_000))).toEqual(Rat.fromMillis(0))
    })

    it('later in Unix time', () => {
      expect(segment.unixOnSegment(Rat.fromMillis(1_000n))).toBe(false)
      expect(() => segment.unixToAtomicRange(Rat.fromMillis(-1)))
        .toThrowError('This Unix time never happened')
    })
  })
})

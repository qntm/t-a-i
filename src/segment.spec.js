/* eslint-env jest */

const { Rat } = require('./rat.js')
const { Range } = require('./range.js')
const { Second } = require('./second.js')
const { Segment } = require('./segment.js')

const MAY = 4

describe('Segment', () => {
  it('disallows bad powers', () => {
    expect(() => new Segment(
      { atomic: new Rat(0n) }
    )).toThrowError('TAI start must be a rational number of seconds')
    expect(() => new Segment(
      { atomic: Second.fromMillis(0), unix: new Rat(0n) }
    )).toThrowError('Unix start must be a rational number of seconds')
    expect(() => new Segment(
      { atomic: Second.fromMillis(0), unix: Second.fromMillis(0) },
      { atomic: new Rat(1n) }
    )).toThrowError('TAI end must be a rational number of seconds')
    expect(() => new Segment(
      { atomic: Second.fromMillis(0), unix: Second.fromMillis(0) },
      { atomic: Second.fromMillis(1_000) },
      { unixPerAtomic: new Second(1n, 1n) }
    )).toThrowError('Slope must be a pure ratio')
  })

  it('disallows rays which run backwards', () => {
    expect(() => new Segment(
      { atomic: Second.fromMillis(0), unix: Second.fromMillis(0) },
      { atomic: new Second(-1n, 1_000_000_000_000n) }
    )).toThrowError('Segment length must be positive')
  })

  it('disallows zero-length rays which run backwards', () => {
    expect(() => new Segment(
      { atomic: Second.fromMillis(0), unix: Second.fromMillis(0) },
      { atomic: Second.fromMillis(0) }
    )).toThrowError('Segment length must be positive')
  })

  describe('basic infinite ray', () => {
    const segment = new Segment(
      { atomic: Second.fromMillis(0), unix: Second.fromMillis(0) }
    )

    it('zero point', () => {
      expect(segment.unixOnSegment(Second.fromMillis(0)))
        .toBe(true)
      expect(segment.unixToAtomicRange(Second.fromMillis(0)))
        .toEqual(new Range(Second.fromMillis(0)))
      expect(segment.atomicOnSegment(Second.fromMillis(0)))
        .toBe(true)
      expect(segment.atomicToUnix(Second.fromMillis(0)))
        .toEqual(Second.fromMillis(0))
    })

    it('modern day', () => {
      expect(segment.unixOnSegment(Second.fromMillis(Date.UTC(2021, MAY, 16, 12, 11, 10, 9))))
        .toBe(true)
      expect(segment.unixToAtomicRange(Second.fromMillis(Date.UTC(2021, MAY, 16, 12, 11, 10, 9))))
        .toEqual(new Range(Second.fromMillis(Date.UTC(2021, MAY, 16, 12, 11, 10, 9))))
      expect(segment.atomicOnSegment(Second.fromMillis(Date.UTC(2021, MAY, 16, 12, 11, 10, 9))))
        .toBe(true)
      expect(segment.atomicToUnix(Second.fromMillis(Date.UTC(2021, MAY, 16, 12, 11, 10, 9))))
        .toEqual(Second.fromMillis(Date.UTC(2021, MAY, 16, 12, 11, 10, 9)))
    })

    it('before start point', () => {
      expect(segment.unixOnSegment(Second.fromMillis(-1)))
        .toBe(false)
      expect(segment.unixToAtomicRange(Second.fromMillis(-1)))
        .toEqual(new Range(Second.fromMillis(-1)))
      expect(segment.atomicOnSegment(Second.fromMillis(-1)))
        .toBe(false)
      expect(segment.atomicToUnix(Second.fromMillis(-1)))
        .toEqual(Second.fromMillis(-1))
    })
  })

  describe('sloped, finite ray', () => {
    const segment = new Segment(
      { atomic: Second.fromMillis(0), unix: Second.fromMillis(0) },
      { atomic: Second.fromMillis(2_000) }, // 2 TAI seconds
      { unixPerAtomic: new Rat(1n, 2n) } // TAI runs twice as fast as Unix time
    )

    it('zero point', () => {
      expect(segment.unixOnSegment(Second.fromMillis(0)))
        .toBe(true)
      expect(segment.unixToAtomicRange(Second.fromMillis(0)))
        .toEqual(new Range(Second.fromMillis(0)))
      expect(segment.atomicOnSegment(Second.fromMillis(0)))
        .toBe(true)
      expect(segment.atomicToUnix(Second.fromMillis(0)))
        .toEqual(Second.fromMillis(0))
    })

    it('a little later', () => {
      expect(segment.unixOnSegment(Second.fromMillis(501)))
        .toBe(true)
      expect(segment.unixToAtomicRange(Second.fromMillis(501)))
        .toEqual(new Range(Second.fromMillis(1_002)))
      expect(segment.atomicOnSegment(Second.fromMillis(1_002)))
        .toBe(true)
      expect(segment.atomicToUnix(Second.fromMillis(1_002)))
        .toEqual(Second.fromMillis(501))
    })

    it('right before end point', () => {
      expect(segment.unixOnSegment(Second.fromMillis(999)))
        .toBe(true)
      expect(segment.unixToAtomicRange(Second.fromMillis(999)))
        .toEqual(new Range(Second.fromMillis(1_998)))

      expect(segment.atomicOnSegment(Second.fromMillis(1_998)))
        .toBe(true)
      expect(segment.atomicToUnix(Second.fromMillis(1_998)))
        .toEqual(Second.fromMillis(999))
      expect(segment.atomicOnSegment(Second.fromMillis(1_999)))
        .toBe(true)
      expect(segment.atomicToUnix(Second.fromMillis(1_999)))
        .toEqual(new Second(1_999n, 2_000n)) // truncates to 999ms
    })

    it('end point', () => {
      expect(segment.unixOnSegment(Second.fromMillis(1_000)))
        .toBe(false)
      expect(segment.unixToAtomicRange(Second.fromMillis(1_000)))
        .toEqual(new Range(Second.fromMillis(2_000)))
      expect(segment.atomicOnSegment(Second.fromMillis(2_000)))
        .toBe(false)
      expect(segment.atomicToUnix(Second.fromMillis(2_000)))
        .toEqual(Second.fromMillis(1_000))
    })
  })

  describe('horizontal ray', () => {
    const segment = new Segment(
      { atomic: Second.fromMillis(0), unix: Second.fromMillis(0) },
      { atomic: Second.fromMillis(2_000) }, // 2 TAI seconds
      { unixPerAtomic: new Rat(0n) }
    )

    it('zero point', () => {
      expect(segment.unixOnSegment(Second.fromMillis(0)))
        .toBe(true)
      expect(segment.unixToAtomicRange(Second.fromMillis(0)))
        .toEqual(new Range(Second.fromMillis(0), Second.fromMillis(2_000), true))
      expect(segment.atomicOnSegment(Second.fromMillis(0)))
        .toBe(true)
      expect(segment.atomicToUnix(Second.fromMillis(0)))
        .toEqual(Second.fromMillis(0))
    })

    it('later in TAI', () => {
      expect(segment.atomicOnSegment(Second.fromMillis(1_999)))
        .toBe(true)
      expect(segment.atomicToUnix(Second.fromMillis(1_999)))
        .toEqual(Second.fromMillis(0))
      expect(segment.atomicOnSegment(Second.fromMillis(2_000)))
        .toBe(false)
      expect(segment.atomicToUnix(Second.fromMillis(2_000)))
        .toEqual(Second.fromMillis(0))
    })

    it('later in Unix time', () => {
      expect(segment.unixOnSegment(Second.fromMillis(1_000)))
        .toBe(false)
      expect(() => segment.unixToAtomicRange(Second.fromMillis(-1)))
        .toThrowError('This Unix time never happened')
    })
  })
})

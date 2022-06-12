/* eslint-env jest */

const { Segment } = require('./segment.js')
const { Rat } = require('./rat.js')
const { Range } = require('./range.js')

const MAY = 4

describe('Segment', () => {
  it('disallows bad powers', () => {
    expect(() => new Segment(
      { atomic: new Rat(0n) }
    )).toThrowError('TAI start must be a rational number of seconds')
    expect(() => new Segment(
      { atomic: Rat.fromMillis(0), unix: new Rat(0n) }
    )).toThrowError('Unix start must be a rational number of seconds')
    expect(() => new Segment(
      { atomic: Rat.fromMillis(0), unix: Rat.fromMillis(0) },
      { atomic: new Rat(1n) }
    )).toThrowError('TAI end must be a rational number of seconds')
    expect(() => new Segment(
      { atomic: Rat.fromMillis(0), unix: Rat.fromMillis(0) },
      { atomic: Rat.fromMillis(1_000) },
      { unixPerAtomic: new Rat(1n, 1n, 1) }
    )).toThrowError('Slope must be a pure ratio')
  })

  it('disallows rays which run backwards', () => {
    expect(() => new Segment(
      { atomic: Rat.fromMillis(0), unix: Rat.fromMillis(0) },
      { atomic: new Rat(-1n, 1_000_000_000_000n, 1) }
    )).toThrowError('Segment length must be positive')
  })

  it('disallows zero-length rays which run backwards', () => {
    expect(() => new Segment(
      { atomic: Rat.fromMillis(0), unix: Rat.fromMillis(0) },
      { atomic: Rat.fromMillis(0) }
    )).toThrowError('Segment length must be positive')
  })

  describe('basic infinite ray', () => {
    const segment = new Segment(
      { atomic: Rat.fromMillis(0), unix: Rat.fromMillis(0) }
    )

    it('zero point', () => {
      expect(segment.unixOnSegment(Rat.fromMillis(0)))
        .toBe(true)
      expect(segment.unixToAtomicRange(Rat.fromMillis(0)))
        .toEqual(new Range(Rat.fromMillis(0)))
      expect(segment.atomicOnSegment(Rat.fromMillis(0)))
        .toBe(true)
      expect(segment.atomicToUnix(Rat.fromMillis(0)))
        .toEqual(Rat.fromMillis(0))
    })

    it('modern day', () => {
      expect(segment.unixOnSegment(Rat.fromMillis(Date.UTC(2021, MAY, 16, 12, 11, 10, 9))))
        .toBe(true)
      expect(segment.unixToAtomicRange(Rat.fromMillis(Date.UTC(2021, MAY, 16, 12, 11, 10, 9))))
        .toEqual(new Range(Rat.fromMillis(Date.UTC(2021, MAY, 16, 12, 11, 10, 9))))
      expect(segment.atomicOnSegment(Rat.fromMillis(Date.UTC(2021, MAY, 16, 12, 11, 10, 9))))
        .toBe(true)
      expect(segment.atomicToUnix(Rat.fromMillis(Date.UTC(2021, MAY, 16, 12, 11, 10, 9))))
        .toEqual(Rat.fromMillis(Date.UTC(2021, MAY, 16, 12, 11, 10, 9)))
    })

    it('before start point', () => {
      expect(segment.unixOnSegment(Rat.fromMillis(-1)))
        .toBe(false)
      expect(segment.unixToAtomicRange(Rat.fromMillis(-1)))
        .toEqual(new Range(Rat.fromMillis(-1)))
      expect(segment.atomicOnSegment(Rat.fromMillis(-1)))
        .toBe(false)
      expect(segment.atomicToUnix(Rat.fromMillis(-1)))
        .toEqual(Rat.fromMillis(-1))
    })
  })

  describe('sloped, finite ray', () => {
    const segment = new Segment(
      { atomic: Rat.fromMillis(0), unix: Rat.fromMillis(0) },
      { atomic: Rat.fromMillis(2_000) }, // 2 TAI seconds
      { unixPerAtomic: new Rat(1n, 2n) } // TAI runs twice as fast as Unix time
    )

    it('zero point', () => {
      expect(segment.unixOnSegment(Rat.fromMillis(0)))
        .toBe(true)
      expect(segment.unixToAtomicRange(Rat.fromMillis(0)))
        .toEqual(new Range(Rat.fromMillis(0)))
      expect(segment.atomicOnSegment(Rat.fromMillis(0)))
        .toBe(true)
      expect(segment.atomicToUnix(Rat.fromMillis(0)))
        .toEqual(Rat.fromMillis(0))
    })

    it('a little later', () => {
      expect(segment.unixOnSegment(Rat.fromMillis(501)))
        .toBe(true)
      expect(segment.unixToAtomicRange(Rat.fromMillis(501)))
        .toEqual(new Range(Rat.fromMillis(1_002)))
      expect(segment.atomicOnSegment(Rat.fromMillis(1_002)))
        .toBe(true)
      expect(segment.atomicToUnix(Rat.fromMillis(1_002)))
        .toEqual(Rat.fromMillis(501))
    })

    it('right before end point', () => {
      expect(segment.unixOnSegment(Rat.fromMillis(999)))
        .toBe(true)
      expect(segment.unixToAtomicRange(Rat.fromMillis(999)))
        .toEqual(new Range(Rat.fromMillis(1_998)))

      expect(segment.atomicOnSegment(Rat.fromMillis(1_998)))
        .toBe(true)
      expect(segment.atomicToUnix(Rat.fromMillis(1_998)))
        .toEqual(Rat.fromMillis(999))
      expect(segment.atomicOnSegment(Rat.fromMillis(1_999)))
        .toBe(true)
      expect(segment.atomicToUnix(Rat.fromMillis(1_999)))
        .toEqual(new Rat(1_999n, 2_000n, 1)) // truncates to 999ms
    })

    it('end point', () => {
      expect(segment.unixOnSegment(Rat.fromMillis(1_000)))
        .toBe(false)
      expect(segment.unixToAtomicRange(Rat.fromMillis(1_000)))
        .toEqual(new Range(Rat.fromMillis(2_000)))
      expect(segment.atomicOnSegment(Rat.fromMillis(2_000)))
        .toBe(false)
      expect(segment.atomicToUnix(Rat.fromMillis(2_000)))
        .toEqual(Rat.fromMillis(1_000))
    })
  })

  describe('horizontal ray', () => {
    const segment = new Segment(
      { atomic: Rat.fromMillis(0), unix: Rat.fromMillis(0) },
      { atomic: Rat.fromMillis(2_000) }, // 2 TAI seconds
      { unixPerAtomic: new Rat(0n) }
    )

    it('zero point', () => {
      expect(segment.unixOnSegment(Rat.fromMillis(0)))
        .toBe(true)
      expect(segment.unixToAtomicRange(Rat.fromMillis(0)))
        .toEqual(new Range(Rat.fromMillis(0), Rat.fromMillis(2_000), true))
      expect(segment.atomicOnSegment(Rat.fromMillis(0)))
        .toBe(true)
      expect(segment.atomicToUnix(Rat.fromMillis(0)))
        .toEqual(Rat.fromMillis(0))
    })

    it('later in TAI', () => {
      expect(segment.atomicOnSegment(Rat.fromMillis(1_999)))
        .toBe(true)
      expect(segment.atomicToUnix(Rat.fromMillis(1_999)))
        .toEqual(Rat.fromMillis(0))
      expect(segment.atomicOnSegment(Rat.fromMillis(2_000)))
        .toBe(false)
      expect(segment.atomicToUnix(Rat.fromMillis(2_000)))
        .toEqual(Rat.fromMillis(0))
    })

    it('later in Unix time', () => {
      expect(segment.unixOnSegment(Rat.fromMillis(1_000)))
        .toBe(false)
      expect(() => segment.unixToAtomicRange(Rat.fromMillis(-1)))
        .toThrowError('This Unix time never happened')
    })
  })
})

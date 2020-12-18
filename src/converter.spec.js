/* eslint-env jest */

const Converter = require('./converter')
const munge = require('./munge')

const JAN = 0
const DEC = 11
const picosPerMilli = 1000n * 1000n * 1000n

describe('Converter', () => {
  it('fails on no blocks', () => {
    expect(() => Converter([])).toThrowError('No blocks')
  })

  describe('one block', () => {
    const basicBlocks = munge([
      [Date.UTC(1970, JAN, 1), 0]
    ])
    const converter = Converter(basicBlocks)

    it('fails on a non-integer number of milliseconds', () => {
      expect(() => converter.oneToOne.unixToAtomic(89.3)).toThrowError('Not an integer: 89.3')
      expect(() => converter.oneToOne.unixToAtomic('boop')).toThrowError('Not an integer: boop')
      expect(() => converter.oneToOne.atomicToUnix(Infinity)).toThrowError('Not an integer: Infinity')
      expect(() => converter.oneToOne.atomicToUnix('boops')).toThrowError('Not an integer: boops')
    })

    it('fails when the Unix count is out of bounds', () => {
      expect(converter.oneToOne.unixToAtomic(0)).toBe(0)
      expect(() => converter.oneToOne.unixToAtomic(-1)).toThrowError('No TAI equivalent: -1')
    })

    it('fails when the atomic count is out of bounds', () => {
      expect(converter.oneToOne.atomicToUnix(0)).toBe(0)
      expect(() => converter.oneToOne.atomicToUnix(-1)).toThrowError('No UTC equivalent: -1')
    })

    it('manages basic conversions', () => {
      expect(converter.oneToMany.unixToAtomicPicos(0)).toEqual([0n])
      expect(converter.oneToMany.unixToAtomic(0)).toEqual([0])
      expect(converter.oneToMany.atomicToUnix(0)).toBe(0)
      expect(converter.oneToOne.unixToAtomicPicos(0)).toBe(0n)
      expect(converter.oneToOne.unixToAtomic(0)).toBe(0)
      expect(converter.oneToOne.atomicToUnix(0)).toBe(0)
    })
  })

  describe('inserted leap second', () => {
    const twoBlocks = munge([
      [Date.UTC(1970, JAN, 1), 0],
      [Date.UTC(1980, JAN, 1), 1],
    ])
    const converter = Converter(twoBlocks)

    describe('conversions grouped by instant', () => {
      it('start of time', () => {
        expect(converter.oneToMany.unixToAtomicPicos(0)).toEqual([0n])
        expect(converter.oneToMany.unixToAtomic(0)).toEqual([0])
        expect(converter.oneToMany.atomicToUnix(0)).toBe(0)
        expect(converter.oneToOne.unixToAtomicPicos(0)).toBe(0n)
        expect(converter.oneToOne.unixToAtomic(0)).toBe(0)
        expect(converter.oneToOne.atomicToUnix(0)).toBe(0)
      })

      it('millisecond before inserted leap second discontinuity begins', () => {
        expect(converter.oneToMany.unixToAtomicPicos(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
          .toEqual([
            BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)) * picosPerMilli
          ])
        expect(converter.oneToMany.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
          .toEqual([
            Date.UTC(1979, DEC, 31, 23, 59, 59, 999)
          ])
        expect(converter.oneToMany.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))

        expect(converter.oneToOne.unixToAtomicPicos(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
          .toBe(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)) * picosPerMilli)
        expect(converter.oneToOne.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
        expect(converter.oneToOne.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
      })

      it('first instant of the Unix time discontinuity: one Unix time is two TAI times', () => {
        expect(converter.oneToMany.unixToAtomicPicos(Date.UTC(1980, JAN, 1, 0, 0, 0)))
          .toEqual([
            BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0)) * picosPerMilli,
            BigInt(Date.UTC(1980, JAN, 1, 0, 0, 1)) * picosPerMilli
          ])
        expect(converter.oneToMany.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0)))
          .toEqual([
            Date.UTC(1980, JAN, 1, 0, 0, 0),
            Date.UTC(1980, JAN, 1, 0, 0, 1)
          ])
        expect(converter.oneToMany.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
        expect(converter.oneToMany.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))

        expect(converter.oneToOne.unixToAtomicPicos(Date.UTC(1980, JAN, 1, 0, 0, 0)))
          .toBe(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 1)) * picosPerMilli)
        expect(converter.oneToOne.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1))
        expect(() => converter.oneToOne.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0)))
          .toThrowError('No UTC equivalent: 315532800000')
        expect(converter.oneToOne.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
      })

      it('final instant of the Unix time discontinuity: one Unix time is two TAI times', () => {
        expect(converter.oneToMany.unixToAtomicPicos(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
          .toEqual([
            BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)) * picosPerMilli,
            BigInt(Date.UTC(1980, JAN, 1, 0, 0, 1, 999)) * picosPerMilli
          ])
        expect(converter.oneToMany.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
          .toEqual([
            Date.UTC(1980, JAN, 1, 0, 0, 0, 999),
            Date.UTC(1980, JAN, 1, 0, 0, 1, 999)
          ])
        expect(converter.oneToMany.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))
        expect(converter.oneToMany.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1, 999)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))

        expect(converter.oneToOne.unixToAtomicPicos(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
          .toBe(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 1, 999)) * picosPerMilli)
        expect(converter.oneToOne.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1, 999))
        expect(() => converter.oneToOne.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
          .toThrowError('No UTC equivalent: 315532800999')
        expect(converter.oneToOne.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1, 999)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))
      })

      it('millisecond after discontinuity ends', () => {
        expect(converter.oneToMany.unixToAtomicPicos(Date.UTC(1980, JAN, 1, 0, 0, 1)))
          .toEqual([
            BigInt(Date.UTC(1980, JAN, 1, 0, 0, 2)) * picosPerMilli
          ])
        expect(converter.oneToMany.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 1)))
          .toEqual([
            Date.UTC(1980, JAN, 1, 0, 0, 2)
          ])
        expect(converter.oneToMany.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 2)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1))

        expect(converter.oneToOne.unixToAtomicPicos(Date.UTC(1980, JAN, 1, 0, 0, 1)))
          .toBe(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 2)) * picosPerMilli)
        expect(converter.oneToOne.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 1)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 2))
        expect(converter.oneToOne.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 2)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1))
      })
    })

    describe('conversions grouped by method', () => {
      it('oneToMany.unixToAtomicPicos', () => {
        expect(converter.oneToMany.unixToAtomicPicos(0)).toEqual([0n])
        expect(converter.oneToMany.unixToAtomicPicos(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
          .toEqual([
            BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)) * picosPerMilli
          ])
        expect(converter.oneToMany.unixToAtomicPicos(Date.UTC(1980, JAN, 1, 0, 0, 0)))
          .toEqual([
            BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0)) * picosPerMilli,
            BigInt(Date.UTC(1980, JAN, 1, 0, 0, 1)) * picosPerMilli
          ])
        expect(converter.oneToMany.unixToAtomicPicos(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
          .toEqual([
            BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)) * picosPerMilli,
            BigInt(Date.UTC(1980, JAN, 1, 0, 0, 1, 999)) * picosPerMilli
          ])
        expect(converter.oneToMany.unixToAtomicPicos(Date.UTC(1980, JAN, 1, 0, 0, 1)))
          .toEqual([
            BigInt(Date.UTC(1980, JAN, 1, 0, 0, 2)) * picosPerMilli
          ])
      })

      it('oneToMany.unixToAtomic', () => {
        expect(converter.oneToMany.unixToAtomic(0)).toEqual([0])
        expect(converter.oneToMany.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
          .toEqual([
            Date.UTC(1979, DEC, 31, 23, 59, 59, 999)
          ])
        expect(converter.oneToMany.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0)))
          .toEqual([
            Date.UTC(1980, JAN, 1, 0, 0, 0),
            Date.UTC(1980, JAN, 1, 0, 0, 1)
          ])
        expect(converter.oneToMany.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
          .toEqual([
            Date.UTC(1980, JAN, 1, 0, 0, 0, 999),
            Date.UTC(1980, JAN, 1, 0, 0, 1, 999)
          ])
        expect(converter.oneToMany.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 1)))
          .toEqual([
            Date.UTC(1980, JAN, 1, 0, 0, 2)
          ])
      })

      it('oneToMany.atomicToUnix', () => {
        expect(converter.oneToMany.atomicToUnix(0)).toBe(0)
        expect(converter.oneToMany.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
        expect(converter.oneToMany.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
        expect(converter.oneToMany.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))
        expect(converter.oneToMany.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
        expect(converter.oneToMany.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1, 999)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))
        expect(converter.oneToMany.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 2)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1))
      })

      it('oneToOne.unixToAtomicPicos', () => {
        expect(converter.oneToOne.unixToAtomicPicos(0)).toBe(0n)
        expect(converter.oneToOne.unixToAtomicPicos(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
          .toBe(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)) * picosPerMilli)
        expect(converter.oneToOne.unixToAtomicPicos(Date.UTC(1980, JAN, 1, 0, 0, 0)))
          .toBe(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 1)) * picosPerMilli)
        expect(converter.oneToOne.unixToAtomicPicos(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
          .toBe(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 1, 999)) * picosPerMilli)
        expect(converter.oneToOne.unixToAtomicPicos(Date.UTC(1980, JAN, 1, 0, 0, 1)))
          .toBe(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 2)) * picosPerMilli)
      })

      it('oneToOne.unixToAtomic', () => {
        expect(converter.oneToOne.unixToAtomic(0)).toBe(0)
        expect(converter.oneToOne.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
        expect(converter.oneToOne.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1))
        expect(converter.oneToOne.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1, 999))
        expect(converter.oneToOne.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 1)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 2))
      })

      it('oneToOne.atomicToUnix', () => {
        expect(converter.oneToOne.atomicToUnix(0)).toBe(0)
        expect(converter.oneToOne.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
        expect(() => converter.oneToOne.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0)))
          .toThrowError('No UTC equivalent: 315532800000')
        expect(() => converter.oneToOne.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
          .toThrowError('No UTC equivalent: 315532800999')
        expect(converter.oneToOne.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
        expect(converter.oneToOne.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1, 999)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))
        expect(converter.oneToOne.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 2)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1))
      })
    })
  })

  describe('removed leap second', () => {
    const twoBlocks = munge([
      [Date.UTC(1970, JAN, 1), 0],
      [Date.UTC(1980, JAN, 1), -1],
    ])
    const converter = Converter(twoBlocks)

    describe('conversions grouped by instant', () => {
      it('start of time', () => {
        expect(converter.oneToMany.unixToAtomicPicos(0)).toEqual([0n])
        expect(converter.oneToMany.unixToAtomic(0)).toEqual([0])
        expect(converter.oneToMany.atomicToUnix(0)).toBe(0)
        expect(converter.oneToOne.unixToAtomicPicos(0)).toBe(0n)
        expect(converter.oneToOne.unixToAtomic(0)).toBe(0)
        expect(converter.oneToOne.atomicToUnix(0)).toBe(0)
      })

      it('millisecond before removed leap second discontinuity begins', () => {
        expect(converter.oneToMany.unixToAtomicPicos(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
          .toEqual([
            BigInt(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)) * picosPerMilli
          ])
        expect(converter.oneToMany.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
          .toEqual([
            Date.UTC(1979, DEC, 31, 23, 59, 58, 999)
          ])
        expect(converter.oneToMany.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))

        expect(converter.oneToOne.unixToAtomicPicos(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
          .toBe(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)) * picosPerMilli)
        expect(converter.oneToOne.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
        expect(converter.oneToOne.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
      })

      it('first instant of the Unix time discontinuity: one Unix time is zero TAI times', () => {
        expect(converter.oneToMany.unixToAtomicPicos(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
          .toEqual([])
        expect(converter.oneToMany.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
          .toEqual([])
        // no atomicToUnix can return the value above

        expect(() => converter.oneToOne.unixToAtomicPicos(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
          .toThrowError('No TAI equivalent: 315532799000')
        expect(() => converter.oneToOne.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
          .toThrowError('No TAI equivalent: 315532799000')
        // no atomicToUnix can return the value above
      })

      it('final instant of the Unix time discontinuity: one Unix time is two TAI times', () => {
        expect(converter.oneToMany.unixToAtomicPicos(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
          .toEqual([])
        expect(converter.oneToMany.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
          .toEqual([])
        // no atomicToUnix can return the value above

        expect(() => converter.oneToOne.unixToAtomicPicos(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
          .toThrowError('No TAI equivalent: 315532799999')
        expect(() => converter.oneToOne.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
          .toThrowError('No TAI equivalent: 315532799999')
        // no atomicToUnix can return the value above
      })

      it('millisecond after discontinuity ends', () => {
        expect(converter.oneToMany.unixToAtomicPicos(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))
          .toEqual([
            BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)) * picosPerMilli
          ])
        expect(converter.oneToMany.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0)))
          .toEqual([
            Date.UTC(1979, DEC, 31, 23, 59, 59, 0)
          ])
        expect(converter.oneToMany.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))

        expect(converter.oneToOne.unixToAtomicPicos(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))
          .toBe(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)) * picosPerMilli)
        expect(converter.oneToOne.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0)))
          .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 0))
        expect(converter.oneToOne.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
      })
    })

    describe('conversions grouped by method', () => {
      it('oneToMany.unixToAtomicPicos', () => {
        expect(converter.oneToMany.unixToAtomicPicos(0))
          .toEqual([0n])
        expect(converter.oneToMany.unixToAtomicPicos(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
          .toEqual([
            BigInt(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)) * picosPerMilli
          ])
        expect(converter.oneToMany.unixToAtomicPicos(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
          .toEqual([])
        expect(converter.oneToMany.unixToAtomicPicos(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
          .toEqual([])
        expect(converter.oneToMany.unixToAtomicPicos(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))
          .toEqual([
            BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)) * picosPerMilli
          ])
      })

      it('oneToMany.unixToAtomic', () => {
        expect(converter.oneToMany.unixToAtomic(0))
          .toEqual([0])
        expect(converter.oneToMany.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
          .toEqual([
            Date.UTC(1979, DEC, 31, 23, 59, 58, 999)
          ])
        expect(converter.oneToMany.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
          .toEqual([])
        expect(converter.oneToMany.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
          .toEqual([])
        expect(converter.oneToMany.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0)))
          .toEqual([
            Date.UTC(1979, DEC, 31, 23, 59, 59, 0)
          ])
      })

      it('oneToMany.atomicToUnix', () => {
        expect(converter.oneToMany.atomicToUnix(0))
          .toBe(0)
        expect(converter.oneToMany.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
        expect(converter.oneToMany.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
      })

      it('oneToOne.unixToAtomicPicos', () => {
        expect(converter.oneToOne.unixToAtomicPicos(0))
          .toBe(0n)
        expect(converter.oneToOne.unixToAtomicPicos(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
          .toBe(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)) * picosPerMilli)
        expect(() => converter.oneToOne.unixToAtomicPicos(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
          .toThrowError('No TAI equivalent: 315532799000')
        expect(() => converter.oneToOne.unixToAtomicPicos(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
          .toThrowError('No TAI equivalent: 315532799999')
        expect(converter.oneToOne.unixToAtomicPicos(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))
          .toBe(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)) * picosPerMilli)
      })

      it('oneToOne.unixToAtomic', () => {
        expect(converter.oneToOne.unixToAtomic(0))
          .toBe(0)
        expect(converter.oneToOne.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
        expect(() => converter.oneToOne.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
          .toThrowError('No TAI equivalent: 315532799000')
        expect(() => converter.oneToOne.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
          .toThrowError('No TAI equivalent: 315532799999')
        expect(converter.oneToOne.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0)))
          .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 0))
      })

      it('oneToOne.atomicToUnix', () => {
        expect(converter.oneToOne.atomicToUnix(0))
          .toBe(0)
        expect(converter.oneToOne.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
        expect(converter.oneToOne.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
      })
    })
  })

  describe('insane edge cases', () => {
    describe('when unixMillis converts to an atomicPicos which fits but an atomicMillis which does not', () => {
      it('at the start of the block', () => {
        const blocks = munge([
          [Date.UTC(1970, JAN, 1, 0, 0, 0, 1), -0.0001]
        ])

        expect(blocks).toEqual([{
          blockStart: {
            unixMillis: 1,
            atomicPicos: 900_000_000n // block start intentionally doesn't include TAI epoch
          },
          ratio: {
            atomicPicosPerUnixMilli: 1_000_000_000n
          },
          offsetAtUnixEpoch: {
            atomicPicos: -100_000_000n
          },
          blockEnd: {
            atomicPicos: Infinity
          },
          overlapStart: {
            atomicPicos: Infinity
          }
        }])

        const converter = Converter(blocks)
        expect(converter.oneToMany.unixToAtomicPicos(1)).toEqual([900_000_000n])
        // rounds down to 0, which is not in the block
        expect(converter.oneToMany.unixToAtomic(1)).toEqual([])
      })

      it('at the end of the block', () => {
        const blocks = munge([
          [Date.UTC(1969, DEC, 31, 23, 59, 59, 999), 0.0001],
          [Date.UTC(1970, JAN, 1, 0, 0, 0, 1), -0.0011]
        ])

        expect(blocks).toEqual([{
          blockStart: {
            unixMillis: -1,
            atomicPicos: -900_000_000n
          },
          ratio: {
            atomicPicosPerUnixMilli: 1_000_000_000n
          },
          offsetAtUnixEpoch: {
            atomicPicos: 100_000_000n
          },
          blockEnd: {
            atomicPicos: -100_000_000n // block end intentionally doesn't include TAI epoch
          },
          overlapStart: {
            atomicPicos: 1_100_000_000n
          }
        }, {
          blockStart: {
            unixMillis: 1,
            atomicPicos: -100_000_000n
          },
          ratio: {
            atomicPicosPerUnixMilli: 1_000_000_000n
          },
          offsetAtUnixEpoch: {
            atomicPicos: -1_100_000_000n
          },
          blockEnd: {
            atomicPicos: Infinity
          },
          overlapStart: {
            atomicPicos: Infinity
          }
        }])

        const converter = Converter(blocks)
        expect(converter.oneToMany.unixToAtomicPicos(-1)).toEqual([-900_000_000n])
        // rounds up to 0, which is not in the block
        expect(converter.oneToMany.unixToAtomic(-1)).toEqual([])
      })
    })
  })
})

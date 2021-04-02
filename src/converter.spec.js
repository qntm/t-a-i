/* eslint-env jest */

const Converter = require('./converter')
const munge = require('./munge')

const JAN = 0
const DEC = 11
const picosPerMilli = 1000n * 1000n * 1000n

describe('Converter', () => {
  describe('one block', () => {
    const data = [
      [Date.UTC(1970, JAN, 1), 0]
    ]
    const converter = Converter(data)

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
    const data = [
      [Date.UTC(1970, JAN, 1), 0],
      [Date.UTC(1980, JAN, 1), 1]
    ]
    const converter = Converter(data)

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
        expect(converter.oneToOne.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0)) // stalled
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
        expect(converter.oneToOne.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0)) // stalled
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
        expect(converter.oneToOne.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0)) // stalled
        expect(converter.oneToOne.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0)) // stalled
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
    const data = [
      [Date.UTC(1970, JAN, 1), 0],
      [Date.UTC(1980, JAN, 1), -1]
    ]
    const converter = Converter(data)

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

      it('final instant of the Unix time discontinuity: one Unix time is zero TAI times', () => {
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
        const data = [
          [Date.UTC(1970, JAN, 1, 0, 0, 0, 1), -0.0001]
        ]

        expect(munge(data)).toEqual([{
          start: {
            unixMillis: 1,
            atomicPicos: 900_000_000n // block start intentionally doesn't include TAI epoch
          },
          ratio: {
            atomicPicosPerUnixMilli: 1_000_000_000n
          },
          offsetAtUnixEpoch: {
            atomicPicos: -100_000_000n
          }
        }])

        const converter = Converter(data)
        expect(converter.oneToMany.unixToAtomicPicos(1)).toEqual([900_000_000n])
        // rounds down to 0, which is not in the block
        expect(converter.oneToMany.unixToAtomic(1)).toEqual([])
      })

      it('at the end of the block', () => {
        const data = [
          [Date.UTC(1969, DEC, 31, 23, 59, 59, 999), 0.0001],
          [Date.UTC(1970, JAN, 1, 0, 0, 0, 1), -0.0011]
        ]

        // first block's end intentionally doesn't include TAI epoch
        expect(munge(data)).toEqual([{
          start: {
            unixMillis: -1,
            atomicPicos: -900_000_000n
          },
          ratio: {
            atomicPicosPerUnixMilli: 1_000_000_000n
          },
          offsetAtUnixEpoch: {
            atomicPicos: 100_000_000n
          }
        }, {
          start: {
            unixMillis: 1,
            atomicPicos: -100_000_000n
          },
          ratio: {
            atomicPicosPerUnixMilli: 1_000_000_000n
          },
          offsetAtUnixEpoch: {
            atomicPicos: -1_100_000_000n
          }
        }])

        const converter = Converter(data)
        expect(converter.oneToMany.unixToAtomicPicos(-1)).toEqual([-900_000_000n])
        // rounds up to 0, which is not in the block
        expect(converter.oneToMany.unixToAtomic(-1)).toEqual([])
      })
    })

    it('when a block has length 0', () => {
      const data = [
        [Date.UTC(1970, JAN, 1), 0, 40_587, 0],
        [Date.UTC(1970, JAN, 1), 0, 40_587, 0.086_400]
      ]

      expect(munge(data)).toEqual([{
        start: {
          unixMillis: 0,
          atomicPicos: 0n
        },
        ratio: {
          atomicPicosPerUnixMilli: 1_000_000_000n
        },
        offsetAtUnixEpoch: {
          atomicPicos: 0n
        }
      }, {
        start: {
          // Same start point as previous block, so previous block has length 0 TAI seconds
          unixMillis: 0,
          atomicPicos: 0n
        },
        ratio: {
          atomicPicosPerUnixMilli: 1_000_001_000n
        },
        offsetAtUnixEpoch: {
          atomicPicos: 0n
        }
      }])

      const converter = Converter(data)
      expect(converter.oneToMany.unixToAtomicPicos(0)).toEqual([0n])
      expect(converter.oneToMany.unixToAtomic(0)).toEqual([0])
      expect(converter.oneToMany.unixToAtomicPicos(1)).toEqual([1_000_001_000n])
      expect(converter.oneToMany.unixToAtomic(1)).toEqual([1])
    })
  })

  describe('new stalling behaviour', () => {
    describe('two inserted leap seconds', () => {
      const data = [
        [0, 0],
        [1000, 1],
        [1000, 2]
      ]
      const converter = Converter(data)

      it('oneToMany.unixToAtomicPicos', () => {
        expect(converter.oneToMany.unixToAtomicPicos(0)).toEqual([0n])
        expect(converter.oneToMany.unixToAtomicPicos(999))
          .toEqual([
            999n * picosPerMilli
          ])
        expect(converter.oneToMany.unixToAtomicPicos(1000))
          .toEqual([
            1000n * picosPerMilli,
            2000n * picosPerMilli,
            3000n * picosPerMilli
          ])
        expect(converter.oneToMany.unixToAtomicPicos(1999))
          .toEqual([
            1999n * picosPerMilli,
            2999n * picosPerMilli,
            3999n * picosPerMilli
          ])
        expect(converter.oneToMany.unixToAtomicPicos(2000))
          .toEqual([
            4000n * picosPerMilli
          ])
      })

      it('oneToMany.unixToAtomic', () => {
        expect(converter.oneToMany.unixToAtomic(0)).toEqual([0])
        expect(converter.oneToMany.unixToAtomic(999))
          .toEqual([
            999
          ])
        expect(converter.oneToMany.unixToAtomic(1000))
          .toEqual([
            1000,
            2000,
            3000
          ])
        expect(converter.oneToMany.unixToAtomic(1999))
          .toEqual([
            1999,
            2999,
            3999
          ])
        expect(converter.oneToMany.unixToAtomic(2000))
          .toEqual([
            4000
          ])
      })

      it('oneToMany.atomicToUnix', () => {
        expect(converter.oneToMany.atomicToUnix(0)).toBe(0)
        expect(converter.oneToMany.atomicToUnix(1000)).toBe(1000)
        expect(converter.oneToMany.atomicToUnix(1001)).toBe(1001)
        expect(converter.oneToMany.atomicToUnix(1999)).toBe(1999)
        expect(converter.oneToMany.atomicToUnix(2000)).toBe(1000)
        expect(converter.oneToMany.atomicToUnix(2001)).toBe(1001)
        expect(converter.oneToMany.atomicToUnix(2999)).toBe(1999)
        expect(converter.oneToMany.atomicToUnix(3000)).toBe(1000)
        expect(converter.oneToMany.atomicToUnix(3001)).toBe(1001)
      })

      it('oneToOne.unixToAtomicPicos', () => {
        expect(converter.oneToOne.unixToAtomicPicos(0)).toBe(0n)
        expect(converter.oneToOne.unixToAtomicPicos(999)).toBe(999n * picosPerMilli)
        expect(converter.oneToOne.unixToAtomicPicos(1000)).toBe(3000n * picosPerMilli)
        expect(converter.oneToOne.unixToAtomicPicos(1999)).toBe(3999n * picosPerMilli)
        expect(converter.oneToOne.unixToAtomicPicos(2000)).toBe(4000n * picosPerMilli)
      })

      it('oneToOne.unixToAtomic', () => {
        expect(converter.oneToOne.unixToAtomic(0)).toBe(0)
        expect(converter.oneToOne.unixToAtomic(999)).toBe(999)
        expect(converter.oneToOne.unixToAtomic(1000)).toBe(3000)
        expect(converter.oneToOne.unixToAtomic(1999)).toBe(3999)
        expect(converter.oneToOne.unixToAtomic(2000)).toBe(4000)
      })

      it('oneToOne.atomicToUnix', () => {
        expect(converter.oneToOne.atomicToUnix(0)).toBe(0)
        expect(converter.oneToOne.atomicToUnix(1000)).toBe(1000)
        expect(converter.oneToOne.atomicToUnix(1001)).toBe(1000)
        expect(converter.oneToOne.atomicToUnix(1999)).toBe(1000)
        expect(converter.oneToOne.atomicToUnix(2000)).toBe(1000)
        expect(converter.oneToOne.atomicToUnix(2001)).toBe(1000)
        expect(converter.oneToOne.atomicToUnix(2999)).toBe(1000)
        expect(converter.oneToOne.atomicToUnix(3000)).toBe(1000)
        expect(converter.oneToOne.atomicToUnix(3001)).toBe(1001)
      })
    })

    describe('1.5 inserted leap seconds', () => {
      // at TAI = 1000, Unix time stalls for 1000ms
      // then at TAI = 2500, Unix time stalls for another 500ms
      const data = [
        [0, 0],
        [1000, 1],
        [1500, 1.5]
      ]
      const converter = Converter(data)

      it('oneToMany.unixToAtomicPicos', () => {
        expect(converter.oneToMany.unixToAtomicPicos(0)).toEqual([0n])
        expect(converter.oneToMany.unixToAtomicPicos(999))
          .toEqual([
            999n * picosPerMilli
          ])
        expect(converter.oneToMany.unixToAtomicPicos(1000))
          .toEqual([
            1000n * picosPerMilli,
            2000n * picosPerMilli
          ])
        expect(converter.oneToMany.unixToAtomicPicos(1499))
          .toEqual([
            1499n * picosPerMilli,
            2499n * picosPerMilli
          ])
        expect(converter.oneToMany.unixToAtomicPicos(1500))
          .toEqual([
            1500n * picosPerMilli,
            2500n * picosPerMilli,
            3000n * picosPerMilli
          ])
      })

      it('oneToMany.unixToAtomic', () => {
        expect(converter.oneToMany.unixToAtomic(0)).toEqual([0])
        expect(converter.oneToMany.unixToAtomic(999)).toEqual([999])
        expect(converter.oneToMany.unixToAtomic(1000)).toEqual([1000, 2000])
        expect(converter.oneToMany.unixToAtomic(1499)).toEqual([1499, 2499])
        expect(converter.oneToMany.unixToAtomic(1500)).toEqual([1500, 2500, 3000])
      })

      it('oneToMany.atomicToUnix', () => {
        expect(converter.oneToMany.atomicToUnix(0)).toBe(0)
        expect(converter.oneToMany.atomicToUnix(999)).toBe(999)
        expect(converter.oneToMany.atomicToUnix(1000)).toBe(1000)
        expect(converter.oneToMany.atomicToUnix(1001)).toBe(1001)
        expect(converter.oneToMany.atomicToUnix(1999)).toBe(1999)
        expect(converter.oneToMany.atomicToUnix(2000)).toBe(1000)
        expect(converter.oneToMany.atomicToUnix(2001)).toBe(1001)
        expect(converter.oneToMany.atomicToUnix(2499)).toBe(1499)
        expect(converter.oneToMany.atomicToUnix(2500)).toBe(1500)
        expect(converter.oneToMany.atomicToUnix(2999)).toBe(1999)
        expect(converter.oneToMany.atomicToUnix(3000)).toBe(1500)
      })

      it('oneToOne.unixToAtomicPicos', () => {
        expect(converter.oneToOne.unixToAtomicPicos(0)).toBe(0n)
        expect(converter.oneToOne.unixToAtomicPicos(999)).toBe(999n * picosPerMilli)
        expect(converter.oneToOne.unixToAtomicPicos(1000)).toBe(2000n * picosPerMilli)
        expect(converter.oneToOne.unixToAtomicPicos(1499)).toBe(2499n * picosPerMilli)
        expect(converter.oneToOne.unixToAtomicPicos(1500)).toBe(3000n * picosPerMilli)
      })

      it('oneToOne.unixToAtomic', () => {
        expect(converter.oneToOne.unixToAtomic(0)).toBe(0)
        expect(converter.oneToOne.unixToAtomic(999)).toBe(999)
        expect(converter.oneToOne.unixToAtomic(1000)).toBe(2000)
        expect(converter.oneToOne.unixToAtomic(1499)).toBe(2499)
        expect(converter.oneToOne.unixToAtomic(1500)).toBe(3000)
      })

      it('oneToOne.atomicToUnix', () => {
        expect(converter.oneToOne.atomicToUnix(0)).toBe(0)
        expect(converter.oneToOne.atomicToUnix(999)).toBe(999)
        expect(converter.oneToOne.atomicToUnix(1000)).toBe(1000)
        expect(converter.oneToOne.atomicToUnix(1001)).toBe(1000)
        expect(converter.oneToOne.atomicToUnix(1999)).toBe(1000)
        expect(converter.oneToOne.atomicToUnix(2000)).toBe(1000)
        expect(converter.oneToOne.atomicToUnix(2001)).toBe(1001)
        expect(converter.oneToOne.atomicToUnix(2499)).toBe(1499)
        expect(converter.oneToOne.atomicToUnix(2500)).toBe(1500)
        expect(converter.oneToOne.atomicToUnix(2501)).toBe(1500)
        expect(converter.oneToOne.atomicToUnix(2999)).toBe(1500)
        expect(converter.oneToOne.atomicToUnix(3000)).toBe(1500)
        expect(converter.oneToOne.atomicToUnix(3001)).toBe(1501)
      })
    })

    describe('2.5 inserted leap seconds', () => {
      // Insertion of 1.5 additional seconds means ray #3 retroactively eliminates ray #2.
      // At TAI = 500, Unix time stalls for 2500ms
      const data = [
        [0, 0],
        [1000, 1],
        [500, 2.5]
      ]
      const converter = Converter(data)

      it('oneToMany.unixToAtomicPicos', () => {
        expect(converter.oneToMany.unixToAtomicPicos(0)).toEqual([0n])
        expect(converter.oneToMany.unixToAtomicPicos(499))
          .toEqual([
            499n * picosPerMilli
          ])
        expect(converter.oneToMany.unixToAtomicPicos(500))
          .toEqual([
            500n * picosPerMilli,
            3000n * picosPerMilli
          ])
        expect(converter.oneToMany.unixToAtomicPicos(999))
          .toEqual([
            999n * picosPerMilli,
            3499n * picosPerMilli
          ])
        expect(converter.oneToMany.unixToAtomicPicos(1000))
          .toEqual([
            1000n * picosPerMilli,
            2000n * picosPerMilli,
            3500n * picosPerMilli
          ])
        expect(converter.oneToMany.unixToAtomicPicos(1999))
          .toEqual([
            1999n * picosPerMilli,
            2999n * picosPerMilli,
            4499n * picosPerMilli
          ])
        expect(converter.oneToMany.unixToAtomicPicos(2000))
          .toEqual([
            4500n * picosPerMilli
          ])
      })

      it('oneToMany.unixToAtomic', () => {
        expect(converter.oneToMany.unixToAtomic(0)).toEqual([0])
        expect(converter.oneToMany.unixToAtomic(499)).toEqual([499])
        expect(converter.oneToMany.unixToAtomic(500)).toEqual([500, 3000])
        expect(converter.oneToMany.unixToAtomic(999)).toEqual([999, 3499])
        expect(converter.oneToMany.unixToAtomic(1000)).toEqual([1000, 2000, 3500])
        expect(converter.oneToMany.unixToAtomic(1999)).toEqual([1999, 2999, 4499])
        expect(converter.oneToMany.unixToAtomic(2000)).toEqual([4500])
      })

      it('oneToMany.atomicToUnix', () => {
        expect(converter.oneToMany.atomicToUnix(0)).toBe(0)
        expect(converter.oneToMany.atomicToUnix(499)).toBe(499)
        expect(converter.oneToMany.atomicToUnix(500)).toBe(500)
        expect(converter.oneToMany.atomicToUnix(999)).toBe(999)
        expect(converter.oneToMany.atomicToUnix(1000)).toBe(1000)
        expect(converter.oneToMany.atomicToUnix(1001)).toBe(1001)
        expect(converter.oneToMany.atomicToUnix(1999)).toBe(1999)
        expect(converter.oneToMany.atomicToUnix(2000)).toBe(1000)
        expect(converter.oneToMany.atomicToUnix(2001)).toBe(1001)
        expect(converter.oneToMany.atomicToUnix(2999)).toBe(1999)
        expect(converter.oneToMany.atomicToUnix(3000)).toBe(500)
        expect(converter.oneToMany.atomicToUnix(3001)).toBe(501)
        expect(converter.oneToMany.atomicToUnix(4499)).toBe(1999)
        expect(converter.oneToMany.atomicToUnix(4500)).toBe(2000)
      })

      it('oneToOne.unixToAtomicPicos', () => {
        expect(converter.oneToOne.unixToAtomicPicos(0)).toBe(0n)
        expect(converter.oneToOne.unixToAtomicPicos(499)).toBe(499n * picosPerMilli)
        expect(converter.oneToOne.unixToAtomicPicos(500)).toBe(3000n * picosPerMilli)
        expect(converter.oneToOne.unixToAtomicPicos(999)).toBe(3499n * picosPerMilli)
        expect(converter.oneToOne.unixToAtomicPicos(1000)).toBe(3500n * picosPerMilli)
        expect(converter.oneToOne.unixToAtomicPicos(1999)).toBe(4499n * picosPerMilli)
        expect(converter.oneToOne.unixToAtomicPicos(2000)).toBe(4500n * picosPerMilli)
      })

      it('oneToOne.unixToAtomic', () => {
        expect(converter.oneToOne.unixToAtomic(0)).toBe(0)
        expect(converter.oneToOne.unixToAtomic(499)).toBe(499)
        expect(converter.oneToOne.unixToAtomic(500)).toBe(3000)
        expect(converter.oneToOne.unixToAtomic(999)).toBe(3499)
        expect(converter.oneToOne.unixToAtomic(1000)).toBe(3500)
        expect(converter.oneToOne.unixToAtomic(1999)).toBe(4499)
        expect(converter.oneToOne.unixToAtomic(2000)).toBe(4500)
      })

      it('oneToOne.atomicToUnix', () => {
        expect(converter.oneToOne.atomicToUnix(0)).toBe(0)
        expect(converter.oneToOne.atomicToUnix(499)).toBe(499)
        expect(converter.oneToOne.atomicToUnix(500)).toBe(500)
        expect(converter.oneToOne.atomicToUnix(501)).toBe(500)
        expect(converter.oneToOne.atomicToUnix(999)).toBe(500)
        expect(converter.oneToOne.atomicToUnix(1000)).toBe(500)
        expect(converter.oneToOne.atomicToUnix(1001)).toBe(500)
        expect(converter.oneToOne.atomicToUnix(1999)).toBe(500)
        expect(converter.oneToOne.atomicToUnix(2000)).toBe(500)
        expect(converter.oneToOne.atomicToUnix(2001)).toBe(500)
        expect(converter.oneToOne.atomicToUnix(2999)).toBe(500)
        expect(converter.oneToOne.atomicToUnix(3000)).toBe(500)
        expect(converter.oneToOne.atomicToUnix(3001)).toBe(501)
        expect(converter.oneToOne.atomicToUnix(4499)).toBe(1999)
        expect(converter.oneToOne.atomicToUnix(4500)).toBe(2000)
      })
    })
  })

  describe('directed by Roland Emmerich', () => {
    describe('the Earth spins backwards', () => {
      // Starting from the origin, the Earth just spins in the opposite direction
      const data = [
        [0, 0, 40_587, -172_800]
      ]
      const converter = Converter(data)

      it('oneToMany.unixToAtomicPicos', () => {
        expect(converter.oneToMany.unixToAtomicPicos(-1000)).toEqual([1000n * picosPerMilli])
        expect(converter.oneToMany.unixToAtomicPicos(-999)).toEqual([999n * picosPerMilli])
        expect(converter.oneToMany.unixToAtomicPicos(-1)).toEqual([1n * picosPerMilli])
        expect(converter.oneToMany.unixToAtomicPicos(0)).toEqual([0n])
        expect(converter.oneToMany.unixToAtomicPicos(1)).toEqual([])
      })

      it('oneToMany.unixToAtomic', () => {
        expect(converter.oneToMany.unixToAtomic(-1000)).toEqual([1000])
        expect(converter.oneToMany.unixToAtomic(-999)).toEqual([999])
        expect(converter.oneToMany.unixToAtomic(-1)).toEqual([1])
        expect(converter.oneToMany.unixToAtomic(0)).toEqual([0])
        expect(converter.oneToMany.unixToAtomic(1)).toEqual([])
      })

      it('oneToMany.atomicToUnix', () => {
        expect(() => converter.oneToMany.atomicToUnix(-1)).toThrowError('No UTC equivalent: -1')
        expect(converter.oneToMany.atomicToUnix(0)).toBe(0)
        expect(converter.oneToMany.atomicToUnix(1)).toBe(-1)
        expect(converter.oneToMany.atomicToUnix(999)).toBe(-999)
        expect(converter.oneToMany.atomicToUnix(1000)).toBe(-1000)
      })

      it('oneToOne.unixToAtomicPicos', () => {
        expect(converter.oneToOne.unixToAtomicPicos(-1000)).toBe(1000n * picosPerMilli)
        expect(converter.oneToOne.unixToAtomicPicos(-999)).toBe(999n * picosPerMilli)
        expect(converter.oneToOne.unixToAtomicPicos(-1)).toBe(1n * picosPerMilli)
        expect(converter.oneToOne.unixToAtomicPicos(0)).toBe(0n)
        expect(() => converter.oneToOne.unixToAtomicPicos(1)).toThrowError('No TAI equivalent: 1')
      })

      it('oneToOne.unixToAtomic', () => {
        expect(converter.oneToOne.unixToAtomic(-1000)).toBe(1000)
        expect(converter.oneToOne.unixToAtomic(-999)).toBe(999)
        expect(converter.oneToOne.unixToAtomic(-1)).toBe(1)
        expect(converter.oneToOne.unixToAtomic(0)).toBe(0)
        expect(() => converter.oneToOne.unixToAtomic(1)).toThrowError('No TAI equivalent: 1')
      })

      it('oneToOne.atomicToUnix', () => {
        expect(() => converter.oneToOne.atomicToUnix(-1)).toThrowError('No UTC equivalent: -1')
        expect(converter.oneToOne.atomicToUnix(0)).toBe(0)
        expect(converter.oneToOne.atomicToUnix(1)).toBe(-1)
        expect(converter.oneToOne.atomicToUnix(999)).toBe(-999)
        expect(converter.oneToOne.atomicToUnix(1000)).toBe(-1000)
      })
    })

    // TODO:
    // Earth spins forwards for 1 second, then instantaneously reverses direction
    // Earth spins forwards for 1 second then discontinuously reverses direction
    // Earth just stops spinning forever
  })
})

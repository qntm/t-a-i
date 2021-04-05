/* eslint-env jest */

const { Converter, ONE_TO_MANY, ONE_TO_ONE } = require('./converter')
const munge = require('./munge')

const JAN = 0
const DEC = 11
const picosPerMilli = 1000n * 1000n * 1000n

describe('Converter', () => {
  describe('one ray', () => {
    const data = [
      [Date.UTC(1970, JAN, 1), 0]
    ]

    describe('bad model', () => {
      it('throws', () => {
        expect(() => Converter(data)).toThrowError('Unrecognised model: undefined')
      })
    })

    describe('ONE_TO_ONE', () => {
      const converter = Converter(data, ONE_TO_ONE)

      it('fails on a non-integer number of milliseconds', () => {
        expect(() => converter.unixToAtomic(89.3)).toThrowError('Not an integer: 89.3')
        expect(() => converter.unixToAtomic('boop')).toThrowError('Not an integer: boop')
        expect(() => converter.atomicToUnix(Infinity)).toThrowError('Not an integer: Infinity')
        expect(() => converter.atomicToUnix('boops')).toThrowError('Not an integer: boops')
      })

      it('fails when the Unix count is out of bounds', () => {
        expect(converter.unixToAtomic(0)).toBe(0)
        expect(() => converter.unixToAtomic(-1)).toThrowError('No TAI equivalent: -1')
      })

      it('fails when the atomic count is out of bounds', () => {
        expect(converter.atomicToUnix(0)).toBe(0)
        expect(() => converter.atomicToUnix(-1)).toThrowError('No UTC equivalent: -1')
      })

      it('manages basic conversions', () => {
        expect(converter.unixToAtomicPicos(0)).toBe(0n)
        expect(converter.unixToAtomic(0)).toBe(0)
        expect(converter.atomicToUnix(0)).toBe(0)
      })
    })

    describe('ONE_TO_MANY', () => {
      const converter = Converter(data, ONE_TO_MANY)

      it('manages basic conversions', () => {
        expect(converter.unixToAtomicPicos(0)).toEqual([0n])
        expect(converter.unixToAtomic(0)).toEqual([0])
        expect(converter.atomicToUnix(0)).toBe(0)
      })
    })
  })

  describe('inserted leap second', () => {
    const data = [
      [Date.UTC(1970, JAN, 1), 0],
      [Date.UTC(1980, JAN, 1), 1]
    ]

    describe('ONE_TO_MANY', () => {
      const converter = Converter(data, ONE_TO_MANY)

      describe('conversions grouped by instant', () => {
        it('start of time', () => {
          expect(converter.unixToAtomicPicos(0)).toEqual([0n])
          expect(converter.unixToAtomic(0)).toEqual([0])
          expect(converter.atomicToUnix(0)).toBe(0)
        })

        it('millisecond before inserted leap second discontinuity begins', () => {
          expect(converter.unixToAtomicPicos(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toEqual([
              BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)) * picosPerMilli
            ])
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 59, 999)
            ])
          expect(converter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
        })

        it('first instant of the Unix time discontinuity: one Unix time is two TAI times', () => {
          expect(converter.unixToAtomicPicos(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toEqual([
              BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0)) * picosPerMilli,
              BigInt(Date.UTC(1980, JAN, 1, 0, 0, 1)) * picosPerMilli
            ])
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 0),
              Date.UTC(1980, JAN, 1, 0, 0, 1)
            ])
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
        })

        it('final instant of the Unix time discontinuity: one Unix time is two TAI times', () => {
          expect(converter.unixToAtomicPicos(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toEqual([
              BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)) * picosPerMilli,
              BigInt(Date.UTC(1980, JAN, 1, 0, 0, 1, 999)) * picosPerMilli
            ])
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 0, 999),
              Date.UTC(1980, JAN, 1, 0, 0, 1, 999)
            ])
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))
        })

        it('millisecond after discontinuity ends', () => {
          expect(converter.unixToAtomicPicos(Date.UTC(1980, JAN, 1, 0, 0, 1)))
            .toEqual([
              BigInt(Date.UTC(1980, JAN, 1, 0, 0, 2)) * picosPerMilli
            ])
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 1)))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 2)
            ])
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 2)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1))
        })
      })

      describe('conversions grouped by method', () => {
        it('unixToAtomicPicos', () => {
          expect(converter.unixToAtomicPicos(0)).toEqual([0n])
          expect(converter.unixToAtomicPicos(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toEqual([
              BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)) * picosPerMilli
            ])
          expect(converter.unixToAtomicPicos(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toEqual([
              BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0)) * picosPerMilli,
              BigInt(Date.UTC(1980, JAN, 1, 0, 0, 1)) * picosPerMilli
            ])
          expect(converter.unixToAtomicPicos(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toEqual([
              BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)) * picosPerMilli,
              BigInt(Date.UTC(1980, JAN, 1, 0, 0, 1, 999)) * picosPerMilli
            ])
          expect(converter.unixToAtomicPicos(Date.UTC(1980, JAN, 1, 0, 0, 1)))
            .toEqual([
              BigInt(Date.UTC(1980, JAN, 1, 0, 0, 2)) * picosPerMilli
            ])
        })

        it('unixToAtomic', () => {
          expect(converter.unixToAtomic(0)).toEqual([0])
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 59, 999)
            ])
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 0),
              Date.UTC(1980, JAN, 1, 0, 0, 1)
            ])
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 0, 999),
              Date.UTC(1980, JAN, 1, 0, 0, 1, 999)
            ])
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 1)))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 2)
            ])
        })

        it('atomicToUnix', () => {
          expect(converter.atomicToUnix(0)).toBe(0)
          expect(converter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 2)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1))
        })
      })
    })

    describe('ONE_TO_ONE', () => {
      const converter = Converter(data, ONE_TO_ONE)

      describe('conversions grouped by instant', () => {
        it('start of time', () => {
          expect(converter.unixToAtomicPicos(0)).toBe(0n)
          expect(converter.unixToAtomic(0)).toBe(0)
          expect(converter.atomicToUnix(0)).toBe(0)
        })

        it('millisecond before inserted leap second discontinuity begins', () => {
          expect(converter.unixToAtomicPicos(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)) * picosPerMilli)
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
          expect(converter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
        })

        it('first instant of the Unix time discontinuity: one Unix time is two TAI times', () => {
          expect(converter.unixToAtomicPicos(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 1)) * picosPerMilli)
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1))
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0)) // stalled
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
        })

        it('final instant of the Unix time discontinuity: one Unix time is two TAI times', () => {
          expect(converter.unixToAtomicPicos(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toBe(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 1, 999)) * picosPerMilli)
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1, 999))
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0)) // stalled
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))
        })

        it('millisecond after discontinuity ends', () => {
          expect(converter.unixToAtomicPicos(Date.UTC(1980, JAN, 1, 0, 0, 1)))
            .toBe(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 2)) * picosPerMilli)
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 1)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 2))
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 2)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1))
        })
      })

      describe('conversions grouped by method', () => {
        it('unixToAtomicPicos', () => {
          expect(converter.unixToAtomicPicos(0)).toBe(0n)
          expect(converter.unixToAtomicPicos(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)) * picosPerMilli)
          expect(converter.unixToAtomicPicos(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 1)) * picosPerMilli)
          expect(converter.unixToAtomicPicos(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toBe(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 1, 999)) * picosPerMilli)
          expect(converter.unixToAtomicPicos(Date.UTC(1980, JAN, 1, 0, 0, 1)))
            .toBe(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 2)) * picosPerMilli)
        })

        it('unixToAtomic', () => {
          expect(converter.unixToAtomic(0)).toBe(0)
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1))
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1, 999))
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 1)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 2))
        })

        it('atomicToUnix', () => {
          expect(converter.atomicToUnix(0)).toBe(0)
          expect(converter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0)) // stalled
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0)) // stalled
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 2)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1))
        })
      })
    })
  })

  describe('removed leap second', () => {
    const data = [
      [Date.UTC(1970, JAN, 1), 0],
      [Date.UTC(1980, JAN, 1), -1]
    ]

    describe('ONE_TO_MANY', () => {
      const converter = Converter(data, ONE_TO_MANY)

      describe('conversions grouped by instant', () => {
        it('start of time', () => {
          expect(converter.unixToAtomicPicos(0)).toEqual([0n])
          expect(converter.unixToAtomic(0)).toEqual([0])
          expect(converter.atomicToUnix(0)).toBe(0)
        })

        it('millisecond before removed leap second discontinuity begins', () => {
          expect(converter.unixToAtomicPicos(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toEqual([
              BigInt(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)) * picosPerMilli
            ])
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 58, 999)
            ])
          expect(converter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
        })

        it('first instant of the Unix time discontinuity: one Unix time is zero TAI times', () => {
          expect(converter.unixToAtomicPicos(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toEqual([])
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toEqual([])
          // no atomicToUnix can return the value above
        })

        it('final instant of the Unix time discontinuity: one Unix time is zero TAI times', () => {
          expect(converter.unixToAtomicPicos(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toEqual([])
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toEqual([])
          // no atomicToUnix can return the value above
        })

        it('millisecond after discontinuity ends', () => {
          expect(converter.unixToAtomicPicos(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))
            .toEqual([
              BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)) * picosPerMilli
            ])
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 59, 0)
            ])
          expect(converter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
        })
      })

      describe('conversions grouped by method', () => {
        it('unixToAtomicPicos', () => {
          expect(converter.unixToAtomicPicos(0))
            .toEqual([0n])
          expect(converter.unixToAtomicPicos(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toEqual([
              BigInt(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)) * picosPerMilli
            ])
          expect(converter.unixToAtomicPicos(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toEqual([])
          expect(converter.unixToAtomicPicos(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toEqual([])
          expect(converter.unixToAtomicPicos(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))
            .toEqual([
              BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)) * picosPerMilli
            ])
        })

        it('unixToAtomic', () => {
          expect(converter.unixToAtomic(0))
            .toEqual([0])
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 58, 999)
            ])
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toEqual([])
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toEqual([])
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 59, 0)
            ])
        })

        it('atomicToUnix', () => {
          expect(converter.atomicToUnix(0))
            .toBe(0)
          expect(converter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
          expect(converter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
        })
      })
    })

    describe('ONE_TO_ONE', () => {
      const converter = Converter(data, ONE_TO_ONE)

      describe('conversions grouped by instant', () => {
        it('start of time', () => {
          expect(converter.unixToAtomicPicos(0)).toBe(0n)
          expect(converter.unixToAtomic(0)).toBe(0)
          expect(converter.atomicToUnix(0)).toBe(0)
        })

        it('millisecond before removed leap second discontinuity begins', () => {
          expect(converter.unixToAtomicPicos(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toBe(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)) * picosPerMilli)
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
          expect(converter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
        })

        it('first instant of the Unix time discontinuity: one Unix time is zero TAI times', () => {
          expect(() => converter.unixToAtomicPicos(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toThrowError('No TAI equivalent: 315532799000')
          expect(() => converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toThrowError('No TAI equivalent: 315532799000')
          // no atomicToUnix can return the value above
        })

        it('final instant of the Unix time discontinuity: one Unix time is zero TAI times', () => {
          expect(() => converter.unixToAtomicPicos(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toThrowError('No TAI equivalent: 315532799999')
          expect(() => converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toThrowError('No TAI equivalent: 315532799999')
          // no atomicToUnix can return the value above
        })

        it('millisecond after discontinuity ends', () => {
          expect(converter.unixToAtomicPicos(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))
            .toBe(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)) * picosPerMilli)
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 0))
          expect(converter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
        })
      })

      describe('conversions grouped by method', () => {
        it('unixToAtomicPicos', () => {
          expect(converter.unixToAtomicPicos(0))
            .toBe(0n)
          expect(converter.unixToAtomicPicos(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toBe(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)) * picosPerMilli)
          expect(() => converter.unixToAtomicPicos(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toThrowError('No TAI equivalent: 315532799000')
          expect(() => converter.unixToAtomicPicos(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toThrowError('No TAI equivalent: 315532799999')
          expect(converter.unixToAtomicPicos(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))
            .toBe(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)) * picosPerMilli)
        })

        it('unixToAtomic', () => {
          expect(converter.unixToAtomic(0))
            .toBe(0)
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
          expect(() => converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toThrowError('No TAI equivalent: 315532799000')
          expect(() => converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toThrowError('No TAI equivalent: 315532799999')
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 0))
        })

        it('atomicToUnix', () => {
          expect(converter.atomicToUnix(0))
            .toBe(0)
          expect(converter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
          expect(converter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
        })
      })
    })
  })

  describe('insane edge cases', () => {
    describe('when unixMillis converts to an atomicPicos which fits but an atomicMillis which does not', () => {
      it('at the start of the ray', () => {
        const data = [
          [Date.UTC(1970, JAN, 1, 0, 0, 0, 1), -0.0001]
        ]

        expect(munge(data)).toEqual([{
          start: {
            unixMillis: 1,
            atomicPicos: 900_000_000n // ray start intentionally doesn't include TAI epoch
          },
          end: {
            atomicPicos: Infinity
          },
          ratio: {
            atomicPicosPerUnixMilli: 1_000_000_000n
          },
          offsetAtUnixEpoch: {
            atomicPicos: -100_000_000n
          }
        }])

        const converter = Converter(data, ONE_TO_MANY)
        expect(converter.unixToAtomicPicos(1)).toEqual([900_000_000n])
        // rounds down to 0, which is not in the ray
        expect(converter.unixToAtomic(1)).toEqual([])
      })

      it('at the end of the ray', () => {
        const data = [
          [Date.UTC(1969, DEC, 31, 23, 59, 59, 999), 0.0001],
          [Date.UTC(1970, JAN, 1, 0, 0, 0, 1), -0.0011]
        ]

        // first ray's end intentionally doesn't include TAI epoch
        expect(munge(data)).toEqual([{
          start: {
            unixMillis: -1,
            atomicPicos: -900_000_000n
          },
          end: {
            atomicPicos: -100_000_000n
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
          end: {
            atomicPicos: Infinity
          },
          ratio: {
            atomicPicosPerUnixMilli: 1_000_000_000n
          },
          offsetAtUnixEpoch: {
            atomicPicos: -1_100_000_000n
          }
        }])

        const converter = Converter(data, ONE_TO_MANY)
        expect(converter.unixToAtomicPicos(-1)).toEqual([-900_000_000n])
        // rounds up to 0, which is not in the ray
        expect(converter.unixToAtomic(-1)).toEqual([])
      })
    })

    it('when a ray has length 0', () => {
      const data = [
        [Date.UTC(1970, JAN, 1), 0, 40_587, 0],
        [Date.UTC(1970, JAN, 1), 0, 40_587, 0.086_400]
      ]

      expect(munge(data)).toEqual([{
        start: {
          unixMillis: 0,
          atomicPicos: 0n
        },
        end: {
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
          // Same start point as previous ray, so previous ray has length 0 TAI seconds
          unixMillis: 0,
          atomicPicos: 0n
        },
        end: {
          atomicPicos: Infinity
        },
        ratio: {
          atomicPicosPerUnixMilli: 1_000_001_000n
        },
        offsetAtUnixEpoch: {
          atomicPicos: 0n
        }
      }])

      const converter = Converter(data, ONE_TO_MANY)
      expect(converter.unixToAtomicPicos(0)).toEqual([0n])
      expect(converter.unixToAtomic(0)).toEqual([0])
      expect(converter.unixToAtomicPicos(1)).toEqual([1_000_001_000n])
      expect(converter.unixToAtomic(1)).toEqual([1])
    })
  })

  describe('new stalling behaviour', () => {
    describe('two inserted leap seconds', () => {
      const data = [
        [0, 0],
        [1000, 1],
        [1000, 2]
      ]

      describe('ONE_TO_MANY', () => {
        const converter = Converter(data, ONE_TO_MANY)

        it('unixToAtomicPicos', () => {
          expect(converter.unixToAtomicPicos(0)).toEqual([0n])
          expect(converter.unixToAtomicPicos(999))
            .toEqual([
              999n * picosPerMilli
            ])
          expect(converter.unixToAtomicPicos(1000))
            .toEqual([
              1000n * picosPerMilli,
              2000n * picosPerMilli,
              3000n * picosPerMilli
            ])
          expect(converter.unixToAtomicPicos(1999))
            .toEqual([
              1999n * picosPerMilli,
              2999n * picosPerMilli,
              3999n * picosPerMilli
            ])
          expect(converter.unixToAtomicPicos(2000))
            .toEqual([
              4000n * picosPerMilli
            ])
        })

        it('unixToAtomic', () => {
          expect(converter.unixToAtomic(0)).toEqual([0])
          expect(converter.unixToAtomic(999))
            .toEqual([
              999
            ])
          expect(converter.unixToAtomic(1000))
            .toEqual([
              1000,
              2000,
              3000
            ])
          expect(converter.unixToAtomic(1999))
            .toEqual([
              1999,
              2999,
              3999
            ])
          expect(converter.unixToAtomic(2000))
            .toEqual([
              4000
            ])
        })

        it('atomicToUnix', () => {
          expect(converter.atomicToUnix(0)).toBe(0)
          expect(converter.atomicToUnix(1000)).toBe(1000)
          expect(converter.atomicToUnix(1001)).toBe(1001)
          expect(converter.atomicToUnix(1999)).toBe(1999)
          expect(converter.atomicToUnix(2000)).toBe(1000)
          expect(converter.atomicToUnix(2001)).toBe(1001)
          expect(converter.atomicToUnix(2999)).toBe(1999)
          expect(converter.atomicToUnix(3000)).toBe(1000)
          expect(converter.atomicToUnix(3001)).toBe(1001)
        })
      })

      describe('ONE_TO_ONE', () => {
        const converter = Converter(data, ONE_TO_ONE)

        it('unixToAtomicPicos', () => {
          expect(converter.unixToAtomicPicos(0)).toBe(0n)
          expect(converter.unixToAtomicPicos(999)).toBe(999n * picosPerMilli)
          expect(converter.unixToAtomicPicos(1000)).toBe(3000n * picosPerMilli)
          expect(converter.unixToAtomicPicos(1999)).toBe(3999n * picosPerMilli)
          expect(converter.unixToAtomicPicos(2000)).toBe(4000n * picosPerMilli)
        })

        it('unixToAtomic', () => {
          expect(converter.unixToAtomic(0)).toBe(0)
          expect(converter.unixToAtomic(999)).toBe(999)
          expect(converter.unixToAtomic(1000)).toBe(3000)
          expect(converter.unixToAtomic(1999)).toBe(3999)
          expect(converter.unixToAtomic(2000)).toBe(4000)
        })

        it('atomicToUnix', () => {
          expect(converter.atomicToUnix(0)).toBe(0)
          expect(converter.atomicToUnix(1000)).toBe(1000)
          expect(converter.atomicToUnix(1001)).toBe(1000)
          expect(converter.atomicToUnix(1999)).toBe(1000)
          expect(converter.atomicToUnix(2000)).toBe(1000)
          expect(converter.atomicToUnix(2001)).toBe(1000)
          expect(converter.atomicToUnix(2999)).toBe(1000)
          expect(converter.atomicToUnix(3000)).toBe(1000)
          expect(converter.atomicToUnix(3001)).toBe(1001)
        })
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

      describe('ONE_TO_MANY', () => {
        const converter = Converter(data, ONE_TO_MANY)

        it('unixToAtomicPicos', () => {
          expect(converter.unixToAtomicPicos(0)).toEqual([0n])
          expect(converter.unixToAtomicPicos(999))
            .toEqual([
              999n * picosPerMilli
            ])
          expect(converter.unixToAtomicPicos(1000))
            .toEqual([
              1000n * picosPerMilli,
              2000n * picosPerMilli
            ])
          expect(converter.unixToAtomicPicos(1499))
            .toEqual([
              1499n * picosPerMilli,
              2499n * picosPerMilli
            ])
          expect(converter.unixToAtomicPicos(1500))
            .toEqual([
              1500n * picosPerMilli,
              2500n * picosPerMilli,
              3000n * picosPerMilli
            ])
        })

        it('unixToAtomic', () => {
          expect(converter.unixToAtomic(0)).toEqual([0])
          expect(converter.unixToAtomic(999)).toEqual([999])
          expect(converter.unixToAtomic(1000)).toEqual([1000, 2000])
          expect(converter.unixToAtomic(1499)).toEqual([1499, 2499])
          expect(converter.unixToAtomic(1500)).toEqual([1500, 2500, 3000])
        })

        it('atomicToUnix', () => {
          expect(converter.atomicToUnix(0)).toBe(0)
          expect(converter.atomicToUnix(999)).toBe(999)
          expect(converter.atomicToUnix(1000)).toBe(1000)
          expect(converter.atomicToUnix(1001)).toBe(1001)
          expect(converter.atomicToUnix(1999)).toBe(1999)
          expect(converter.atomicToUnix(2000)).toBe(1000)
          expect(converter.atomicToUnix(2001)).toBe(1001)
          expect(converter.atomicToUnix(2499)).toBe(1499)
          expect(converter.atomicToUnix(2500)).toBe(1500)
          expect(converter.atomicToUnix(2999)).toBe(1999)
          expect(converter.atomicToUnix(3000)).toBe(1500)
        })
      })

      describe('ONE_TO_ONE', () => {
        const converter = Converter(data, ONE_TO_ONE)

        it('unixToAtomicPicos', () => {
          expect(converter.unixToAtomicPicos(0)).toBe(0n)
          expect(converter.unixToAtomicPicos(999)).toBe(999n * picosPerMilli)
          expect(converter.unixToAtomicPicos(1000)).toBe(2000n * picosPerMilli)
          expect(converter.unixToAtomicPicos(1499)).toBe(2499n * picosPerMilli)
          expect(converter.unixToAtomicPicos(1500)).toBe(3000n * picosPerMilli)
        })

        it('unixToAtomic', () => {
          expect(converter.unixToAtomic(0)).toBe(0)
          expect(converter.unixToAtomic(999)).toBe(999)
          expect(converter.unixToAtomic(1000)).toBe(2000)
          expect(converter.unixToAtomic(1499)).toBe(2499)
          expect(converter.unixToAtomic(1500)).toBe(3000)
        })

        it('atomicToUnix', () => {
          expect(converter.atomicToUnix(0)).toBe(0)
          expect(converter.atomicToUnix(999)).toBe(999)
          expect(converter.atomicToUnix(1000)).toBe(1000)
          expect(converter.atomicToUnix(1001)).toBe(1000)
          expect(converter.atomicToUnix(1999)).toBe(1000)
          expect(converter.atomicToUnix(2000)).toBe(1000)
          expect(converter.atomicToUnix(2001)).toBe(1001)
          expect(converter.atomicToUnix(2499)).toBe(1499)
          expect(converter.atomicToUnix(2500)).toBe(1500)
          expect(converter.atomicToUnix(2501)).toBe(1500)
          expect(converter.atomicToUnix(2999)).toBe(1500)
          expect(converter.atomicToUnix(3000)).toBe(1500)
          expect(converter.atomicToUnix(3001)).toBe(1501)
        })
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

      describe('ONE_TO_MANY', () => {
        const converter = Converter(data, ONE_TO_MANY)

        it('unixToAtomicPicos', () => {
          expect(converter.unixToAtomicPicos(0)).toEqual([0n])
          expect(converter.unixToAtomicPicos(499))
            .toEqual([
              499n * picosPerMilli
            ])
          expect(converter.unixToAtomicPicos(500))
            .toEqual([
              500n * picosPerMilli,
              3000n * picosPerMilli
            ])
          expect(converter.unixToAtomicPicos(999))
            .toEqual([
              999n * picosPerMilli,
              3499n * picosPerMilli
            ])
          expect(converter.unixToAtomicPicos(1000))
            .toEqual([
              1000n * picosPerMilli,
              2000n * picosPerMilli,
              3500n * picosPerMilli
            ])
          expect(converter.unixToAtomicPicos(1999))
            .toEqual([
              1999n * picosPerMilli,
              2999n * picosPerMilli,
              4499n * picosPerMilli
            ])
          expect(converter.unixToAtomicPicos(2000))
            .toEqual([
              4500n * picosPerMilli
            ])
        })

        it('unixToAtomic', () => {
          expect(converter.unixToAtomic(0)).toEqual([0])
          expect(converter.unixToAtomic(499)).toEqual([499])
          expect(converter.unixToAtomic(500)).toEqual([500, 3000])
          expect(converter.unixToAtomic(999)).toEqual([999, 3499])
          expect(converter.unixToAtomic(1000)).toEqual([1000, 2000, 3500])
          expect(converter.unixToAtomic(1999)).toEqual([1999, 2999, 4499])
          expect(converter.unixToAtomic(2000)).toEqual([4500])
        })

        it('atomicToUnix', () => {
          expect(converter.atomicToUnix(0)).toBe(0)
          expect(converter.atomicToUnix(499)).toBe(499)
          expect(converter.atomicToUnix(500)).toBe(500)
          expect(converter.atomicToUnix(999)).toBe(999)
          expect(converter.atomicToUnix(1000)).toBe(1000)
          expect(converter.atomicToUnix(1001)).toBe(1001)
          expect(converter.atomicToUnix(1999)).toBe(1999)
          expect(converter.atomicToUnix(2000)).toBe(1000)
          expect(converter.atomicToUnix(2001)).toBe(1001)
          expect(converter.atomicToUnix(2999)).toBe(1999)
          expect(converter.atomicToUnix(3000)).toBe(500)
          expect(converter.atomicToUnix(3001)).toBe(501)
          expect(converter.atomicToUnix(4499)).toBe(1999)
          expect(converter.atomicToUnix(4500)).toBe(2000)
        })
      })

      describe('ONE_TO_ONE', () => {
        const converter = Converter(data, ONE_TO_ONE)

        it('unixToAtomicPicos', () => {
          expect(converter.unixToAtomicPicos(0)).toBe(0n)
          expect(converter.unixToAtomicPicos(499)).toBe(499n * picosPerMilli)
          expect(converter.unixToAtomicPicos(500)).toBe(3000n * picosPerMilli)
          expect(converter.unixToAtomicPicos(999)).toBe(3499n * picosPerMilli)
          expect(converter.unixToAtomicPicos(1000)).toBe(3500n * picosPerMilli)
          expect(converter.unixToAtomicPicos(1999)).toBe(4499n * picosPerMilli)
          expect(converter.unixToAtomicPicos(2000)).toBe(4500n * picosPerMilli)
        })

        it('unixToAtomic', () => {
          expect(converter.unixToAtomic(0)).toBe(0)
          expect(converter.unixToAtomic(499)).toBe(499)
          expect(converter.unixToAtomic(500)).toBe(3000)
          expect(converter.unixToAtomic(999)).toBe(3499)
          expect(converter.unixToAtomic(1000)).toBe(3500)
          expect(converter.unixToAtomic(1999)).toBe(4499)
          expect(converter.unixToAtomic(2000)).toBe(4500)
        })

        it('atomicToUnix', () => {
          expect(converter.atomicToUnix(0)).toBe(0)
          expect(converter.atomicToUnix(499)).toBe(499)
          expect(converter.atomicToUnix(500)).toBe(500)
          expect(converter.atomicToUnix(501)).toBe(500)
          expect(converter.atomicToUnix(999)).toBe(500)
          expect(converter.atomicToUnix(1000)).toBe(500)
          expect(converter.atomicToUnix(1001)).toBe(500)
          expect(converter.atomicToUnix(1999)).toBe(500)
          expect(converter.atomicToUnix(2000)).toBe(500)
          expect(converter.atomicToUnix(2001)).toBe(500)
          expect(converter.atomicToUnix(2999)).toBe(500)
          expect(converter.atomicToUnix(3000)).toBe(500)
          expect(converter.atomicToUnix(3001)).toBe(501)
          expect(converter.atomicToUnix(4499)).toBe(1999)
          expect(converter.atomicToUnix(4500)).toBe(2000)
        })
      })
    })
  })

  describe('directed by Roland Emmerich', () => {
    describe('the Earth spins backwards', () => {
      // Starting from the origin, the Earth just spins in the opposite direction
      const data = [
        [0, 0, 40_587, -172_800]
      ]

      describe('ONE_TO_MANY', () => {
        const converter = Converter(data, ONE_TO_MANY)

        it('unixToAtomicPicos', () => {
          expect(converter.unixToAtomicPicos(-1000)).toEqual([1000n * picosPerMilli])
          expect(converter.unixToAtomicPicos(-999)).toEqual([999n * picosPerMilli])
          expect(converter.unixToAtomicPicos(-1)).toEqual([1n * picosPerMilli])
          expect(converter.unixToAtomicPicos(0)).toEqual([0n])
          expect(converter.unixToAtomicPicos(1)).toEqual([])
        })

        it('unixToAtomic', () => {
          expect(converter.unixToAtomic(-1000)).toEqual([1000])
          expect(converter.unixToAtomic(-999)).toEqual([999])
          expect(converter.unixToAtomic(-1)).toEqual([1])
          expect(converter.unixToAtomic(0)).toEqual([0])
          expect(converter.unixToAtomic(1)).toEqual([])
        })

        it('atomicToUnix', () => {
          expect(() => converter.atomicToUnix(-1)).toThrowError('No UTC equivalent: -1')
          expect(converter.atomicToUnix(0)).toBe(0)
          expect(converter.atomicToUnix(1)).toBe(-1)
          expect(converter.atomicToUnix(999)).toBe(-999)
          expect(converter.atomicToUnix(1000)).toBe(-1000)
        })
      })

      describe('ONE_TO_ONE', () => {
        const converter = Converter(data, ONE_TO_ONE)

        it('unixToAtomicPicos', () => {
          expect(converter.unixToAtomicPicos(-1000)).toBe(1000n * picosPerMilli)
          expect(converter.unixToAtomicPicos(-999)).toBe(999n * picosPerMilli)
          expect(converter.unixToAtomicPicos(-1)).toBe(1n * picosPerMilli)
          expect(converter.unixToAtomicPicos(0)).toBe(0n)
          expect(() => converter.unixToAtomicPicos(1)).toThrowError('No TAI equivalent: 1')
        })

        it('unixToAtomic', () => {
          expect(converter.unixToAtomic(-1000)).toBe(1000)
          expect(converter.unixToAtomic(-999)).toBe(999)
          expect(converter.unixToAtomic(-1)).toBe(1)
          expect(converter.unixToAtomic(0)).toBe(0)
          expect(() => converter.unixToAtomic(1)).toThrowError('No TAI equivalent: 1')
        })

        it('atomicToUnix', () => {
          expect(() => converter.atomicToUnix(-1)).toThrowError('No UTC equivalent: -1')
          expect(converter.atomicToUnix(0)).toBe(0)
          expect(converter.atomicToUnix(1)).toBe(-1)
          expect(converter.atomicToUnix(999)).toBe(-999)
          expect(converter.atomicToUnix(1000)).toBe(-1000)
        })
      })
    })

    // TODO:
    // Earth spins forwards for 1 second, then instantaneously reverses direction
    // Earth spins forwards for 1 second then discontinuously reverses direction
    // Earth just stops spinning forever
  })
})

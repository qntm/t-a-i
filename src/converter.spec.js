/* eslint-env jest */

const { Converter, MODELS } = require('./converter')

const JAN = 0
const OCT = 9
const NOV = 10
const DEC = 11

describe('Converter', () => {
  describe('one ray', () => {
    const data = [
      [Date.UTC(1970, JAN, 1), 0]
    ]

    describe('OVERRUN', () => {
      const converter = Converter(data, MODELS.OVERRUN)

      it('manages basic conversions', () => {
        expect(converter.unixToAtomic(0, { range: true, array: true })).toEqual([[0, 0]])
        expect(converter.unixToAtomic(0, { range: true })).toEqual([0, 0])
        expect(converter.unixToAtomic(0, { array: true })).toEqual([0])
        expect(converter.unixToAtomic(0)).toEqual(0)
        expect(converter.atomicToUnix(0)).toBe(0)
      })
    })

    describe('BREAK', () => {
      const converter = Converter(data, MODELS.BREAK)

      it('manages basic conversions', () => {
        expect(converter.unixToAtomic(0)).toEqual(0)
        expect(converter.atomicToUnix(0)).toBe(0)
      })
    })

    describe('STALL', () => {
      const converter = Converter(data, MODELS.STALL)

      it('fails on a non-integer number of milliseconds', () => {
        expect(() => converter.unixToAtomic(89.3)).toThrowError('Not an integer: 89.3')
        expect(() => converter.unixToAtomic('boop')).toThrowError('Not an integer: boop')
        expect(() => converter.atomicToUnix(Infinity)).toThrowError('Not an integer: Infinity')
        expect(() => converter.atomicToUnix('boops')).toThrowError('Not an integer: boops')
      })

      it('fails when the Unix count is out of bounds', () => {
        expect(converter.unixToAtomic(0)).toBe(0)
        expect(converter.unixToAtomic(-1)).toBe(NaN)
      })

      it('fails when the atomic count is out of bounds', () => {
        expect(converter.atomicToUnix(0)).toBe(0)
        expect(converter.atomicToUnix(-1)).toBe(NaN)
      })

      it('manages basic conversions', () => {
        expect(converter.unixToAtomic(0, { range: true, array: true })).toEqual([[0, 0]])
        expect(converter.unixToAtomic(0, { range: true })).toEqual([0, 0])
        expect(converter.unixToAtomic(0, { array: true })).toEqual([0])
        expect(converter.unixToAtomic(0)).toBe(0)
        expect(converter.atomicToUnix(0)).toBe(0)
      })
    })

    describe('SMEAR', () => {
      const converter = Converter(data, MODELS.SMEAR)

      it('manages basic conversions', () => {
        expect(converter.unixToAtomic(0)).toEqual(0)
        expect(converter.atomicToUnix(0)).toBe(0)
      })
    })
  })

  describe('inserted leap second', () => {
    const data = [
      [Date.UTC(1970, JAN, 1), 0],
      [Date.UTC(1980, JAN, 1), 1]
    ]

    describe('OVERRUN', () => {
      const converter = Converter(data, MODELS.OVERRUN)

      describe('conversions grouped by instant', () => {
        it('start of time', () => {
          expect(converter.unixToAtomic(0, { array: true })).toEqual([0])
          expect(converter.unixToAtomic(0)).toBe(0)
          expect(converter.atomicToUnix(0)).toBe(0)
        })

        it('millisecond before inserted leap second discontinuity begins', () => {
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999), { array: true }))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 59, 999)
            ])
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
          expect(converter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
        })

        it('first instant of the Unix time discontinuity: one Unix time is two TAI times', () => {
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0), { array: true }))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 0),
              Date.UTC(1980, JAN, 1, 0, 0, 1)
            ])
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1))
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
        })

        it('final instant of the Unix time discontinuity: one Unix time is two TAI times', () => {
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 999), { array: true }))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 0, 999),
              Date.UTC(1980, JAN, 1, 0, 0, 1, 999)
            ])
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1, 999))
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))
        })

        it('millisecond after discontinuity ends', () => {
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 1), { array: true }))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 2)
            ])
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 1)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 2))
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 2)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1))
        })
      })

      describe('conversions grouped by method', () => {
        it('unixToAtomic (array mode)', () => {
          expect(converter.unixToAtomic(0, { array: true })).toEqual([0])
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999), { array: true }))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 59, 999)
            ])
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0), { array: true }))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 0),
              Date.UTC(1980, JAN, 1, 0, 0, 1)
            ])
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 999), { array: true }))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 0, 999),
              Date.UTC(1980, JAN, 1, 0, 0, 1, 999)
            ])
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 1), { array: true }))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 2)
            ])
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

    describe('BREAK', () => {
      const converter = Converter(data, MODELS.BREAK)

      describe('conversions grouped by instant', () => {
        it('start of time', () => {
          expect(converter.unixToAtomic(0)).toBe(0)
          expect(converter.atomicToUnix(0)).toBe(0)
        })

        it('millisecond before inserted leap second discontinuity begins', () => {
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
          expect(converter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
        })

        it('first instant of the Unix time discontinuity: one Unix time is two TAI times', () => {
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1))
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(NaN)
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
        })

        it('final instant of the Unix time discontinuity: one Unix time is two TAI times', () => {
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1, 999))
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toBe(NaN)
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))
        })

        it('millisecond after discontinuity ends', () => {
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 1)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 2))
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 2)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1))
        })
      })

      describe('conversions grouped by method', () => {
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
            .toBe(NaN)
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toBe(NaN)
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 2)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1))
        })
      })
    })

    describe('STALL', () => {
      const converter = Converter(data, MODELS.STALL)

      describe('conversions grouped by instant', () => {
        it('start of time', () => {
          expect(converter.unixToAtomic(0, { range: true })).toEqual([0, 0])
          expect(converter.unixToAtomic(0)).toBe(0)
          expect(converter.atomicToUnix(0)).toBe(0)
        })

        it('millisecond before inserted leap second discontinuity begins', () => {
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999), { range: true }))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 59, 999),
              Date.UTC(1979, DEC, 31, 23, 59, 59, 999)
            ])
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
          expect(converter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
        })

        it('first instant of the Unix time discontinuity: one Unix time is two TAI times', () => {
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0), { range: true }))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 0, 0),
              Date.UTC(1980, JAN, 1, 0, 0, 1, 0) // stalled
            ])
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1))
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
        })

        it('final instant of the Unix time discontinuity: one Unix time is two TAI times', () => {
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 999), { range: true }))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 1, 999),
              Date.UTC(1980, JAN, 1, 0, 0, 1, 999)
            ])
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1, 999))
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0)) // stalled
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))
        })

        it('millisecond after discontinuity ends', () => {
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 1, 0), { range: true }))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 2, 0),
              Date.UTC(1980, JAN, 1, 0, 0, 2, 0)
            ])
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 1)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 2, 0))
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 2, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1, 0))
        })
      })

      describe('conversions grouped by method', () => {
        it('unixToAtomic (range mode)', () => {
          expect(converter.unixToAtomic(0, { range: true })).toEqual([0, 0])
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999), { range: true }))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 59, 999),
              Date.UTC(1979, DEC, 31, 23, 59, 59, 999)
            ])
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 0), { range: true }))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 0, 0),
              Date.UTC(1980, JAN, 1, 0, 0, 1, 0)
            ])
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 1), { range: true }))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 1, 1),
              Date.UTC(1980, JAN, 1, 0, 0, 1, 1)
            ])
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 999), { range: true }))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 1, 999),
              Date.UTC(1980, JAN, 1, 0, 0, 1, 999)
            ])
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 1, 0), { range: true }))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 2, 0),
              Date.UTC(1980, JAN, 1, 0, 0, 2, 0)
            ])
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

    describe('SMEAR', () => {
      const converter = Converter(data, MODELS.SMEAR)

      it('unixToAtomic', () => {
        expect(converter.unixToAtomic(0)).toBe(0)
        expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 11, 59, 59, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 11, 59, 59, 999))
        expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 12, 0, 0, 0)))
          .toBe(Date.UTC(1979, DEC, 31, 12, 0, 0, 0))
        expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 500))
        expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 12, 0, 0, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 12, 0, 1, 0))
        expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 12, 0, 0, 1)))
          .toBe(Date.UTC(1980, JAN, 1, 12, 0, 1, 1))
        expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 12, 0, 1, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 12, 0, 2, 0))
      })

      it('atomicToUnix', () => {
        expect(converter.atomicToUnix(0)).toBe(0)
        expect(converter.atomicToUnix(Date.UTC(1979, DEC, 31, 11, 59, 59, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 11, 59, 59, 999))
        expect(converter.atomicToUnix(Date.UTC(1979, DEC, 31, 12, 0, 0, 0)))
          .toBe(Date.UTC(1979, DEC, 31, 12, 0, 0, 0))
        expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 500)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))
        expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 12, 0, 1, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 12, 0, 0, 0))
        expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 12, 0, 1, 1)))
          .toBe(Date.UTC(1980, JAN, 1, 12, 0, 0, 1))
        expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 12, 0, 2, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 12, 0, 1, 0))
      })
    })
  })

  describe('removed leap second', () => {
    const data = [
      [Date.UTC(1970, JAN, 1), 0],
      [Date.UTC(1980, JAN, 1), -1]
    ]

    describe('OVERRUN', () => {
      const converter = Converter(data, MODELS.OVERRUN)

      describe('conversions grouped by instant', () => {
        it('start of time', () => {
          expect(converter.unixToAtomic(0, { array: true })).toEqual([0])
          expect(converter.unixToAtomic(0)).toEqual(0)
          expect(converter.atomicToUnix(0)).toBe(0)
        })

        it('millisecond before removed leap second discontinuity begins', () => {
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 58, 999), { array: true }))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 58, 999)
            ])
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
          expect(converter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
        })

        it('first instant of the Unix time discontinuity: one Unix time is zero TAI times', () => {
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 0), { array: true }))
            .toEqual([])
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toBe(NaN)
          // no atomicToUnix can return the value above
        })

        it('final instant of the Unix time discontinuity: one Unix time is zero TAI times', () => {
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999), { array: true }))
            .toEqual([])
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(NaN)
          // no atomicToUnix can return the value above
        })

        it('millisecond after discontinuity ends', () => {
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0), { array: true }))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 59, 0)
            ])
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 0))
          expect(converter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 0), { array: true }))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
        })
      })

      describe('conversions grouped by method', () => {
        it('unixToAtomic (array mode)', () => {
          expect(converter.unixToAtomic(0, { array: true }))
            .toEqual([0])
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 58, 999), { array: true }))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 58, 999)
            ])
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 0), { array: true }))
            .toEqual([])
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999), { array: true }))
            .toEqual([])
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0), { array: true }))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 59, 0)
            ])
        })

        it('unixToAtomic', () => {
          expect(converter.unixToAtomic(0))
            .toBe(0)
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toBe(NaN)
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(NaN)
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

    describe('BREAK', () => {
      const converter = Converter(data, MODELS.BREAK)

      describe('conversions grouped by instant', () => {
        it('start of time', () => {
          expect(converter.unixToAtomic(0)).toEqual(0)
          expect(converter.atomicToUnix(0)).toBe(0)
        })

        it('millisecond before removed leap second discontinuity begins', () => {
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
          expect(converter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
        })

        it('first instant of the Unix time discontinuity: one Unix time is zero TAI times', () => {
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toBe(NaN)
          // no atomicToUnix can return the value above
        })

        it('final instant of the Unix time discontinuity: one Unix time is zero TAI times', () => {
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(NaN)
          // no atomicToUnix can return the value above
        })

        it('millisecond after discontinuity ends', () => {
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 0))
          expect(converter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
        })
      })

      describe('conversions grouped by method', () => {
        it('unixToAtomic', () => {
          expect(converter.unixToAtomic(0))
            .toBe(0)
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toBe(NaN)
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(NaN)
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

    describe('STALL', () => {
      const converter = Converter(data, MODELS.STALL)

      describe('conversions grouped by instant', () => {
        it('start of time', () => {
          expect(converter.unixToAtomic(0, { range: true })).toEqual([0, 0])
          expect(converter.unixToAtomic(0)).toBe(0)
          expect(converter.atomicToUnix(0)).toBe(0)
        })

        it('millisecond before removed leap second discontinuity begins', () => {
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 58, 999), { range: true }))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 58, 999),
              Date.UTC(1979, DEC, 31, 23, 59, 58, 999)
            ])
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
          expect(converter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
        })

        it('first instant of the Unix time discontinuity: one Unix time is zero TAI times', () => {
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 0), { range: true }))
            .toEqual([NaN, NaN])
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toBe(NaN)
          // no atomicToUnix can return the value above
        })

        it('final instant of the Unix time discontinuity: one Unix time is zero TAI times', () => {
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999), { range: true }))
            .toEqual([NaN, NaN])
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(NaN)
          // no atomicToUnix can return the value above
        })

        it('millisecond after discontinuity ends', () => {
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0), { range: true }))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 59, 0),
              Date.UTC(1979, DEC, 31, 23, 59, 59, 0)
            ])
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 0))
          expect(converter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
        })
      })

      describe('conversions grouped by method', () => {
        it('unixToAtomic (range mode)', () => {
          expect(converter.unixToAtomic(0, { range: true }))
            .toEqual([0, 0])
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 58, 999), { range: true }))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 58, 999),
              Date.UTC(1979, DEC, 31, 23, 59, 58, 999)
            ])
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 0), { range: true }))
            .toEqual([NaN, NaN])
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999), { range: true }))
            .toEqual([NaN, NaN])
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0), { range: true }))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 59, 0),
              Date.UTC(1979, DEC, 31, 23, 59, 59, 0)
            ])
        })

        it('unixToAtomic', () => {
          expect(converter.unixToAtomic(0))
            .toBe(0)
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toBe(NaN)
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(NaN)
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

    describe('SMEAR', () => {
      const converter = Converter(data, MODELS.SMEAR)

      it('unixToAtomic', () => {
        expect(converter.unixToAtomic(0)).toBe(0)
        expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 11, 59, 59, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 11, 59, 59, 999))
        expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 12, 0, 0, 0)))
          .toBe(Date.UTC(1979, DEC, 31, 12, 0, 0, 0))
        expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))
          .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 500))
        expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 12, 0, 0, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 11, 59, 59, 0))
        expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 12, 0, 0, 1)))
          .toBe(Date.UTC(1980, JAN, 1, 11, 59, 59, 1))
        expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 12, 0, 1, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 12, 0, 0, 0))
      })

      it('atomicToUnix', () => {
        expect(converter.atomicToUnix(0)).toBe(0)
        expect(converter.atomicToUnix(Date.UTC(1979, DEC, 31, 11, 59, 59, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 11, 59, 59, 999))
        expect(converter.atomicToUnix(Date.UTC(1979, DEC, 31, 12, 0, 0, 0)))
          .toBe(Date.UTC(1979, DEC, 31, 12, 0, 0, 0))
        expect(converter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 500)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))
        expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 11, 59, 59, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 12, 0, 0, 0))
        expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 11, 59, 59, 1)))
          .toBe(Date.UTC(1980, JAN, 1, 12, 0, 0, 1))
        expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 12, 0, 0, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 12, 0, 1, 0))
      })
    })
  })

  describe('insane edge cases', () => {
    describe('when unixMillis converts to an atomicPicos which fits but an atomicMillis which does not', () => {
      it('at the start of the ray', () => {
        const data = [
          [Date.UTC(1970, JAN, 1, 0, 0, 0, 1), -0.0001]
        ]
        const converter = Converter(data, MODELS.OVERRUN)
        // 900_000_000n TAI picoseconds rounds down to 0 seconds, which is not in the ray
        expect(converter.unixToAtomic(1, { array: true })).toEqual([0])
      })

      it('at the end of the ray', () => {
        const data = [
          [Date.UTC(1969, DEC, 31, 23, 59, 59, 999), 0.0001],
          [Date.UTC(1970, JAN, 1, 0, 0, 0, 1), -0.0011]
        ]
        const converter = Converter(data, MODELS.OVERRUN)
        expect(converter.unixToAtomic(-1, { array: true })).toEqual([-1])
      })
    })
  })

  describe('new stalling behaviour', () => {
    describe('two inserted leap seconds', () => {
      const data = [
        [0, 0],
        [1000, 1],
        [1000, 2]
      ]

      describe('OVERRUN', () => {
        const converter = Converter(data, MODELS.OVERRUN)

        it('unixToAtomic (array mode)', () => {
          expect(converter.unixToAtomic(0, { array: true })).toEqual([0])
          expect(converter.unixToAtomic(999, { array: true }))
            .toEqual([
              999
            ])
          expect(converter.unixToAtomic(1000, { array: true }))
            .toEqual([
              1000,
              2000,
              3000
            ])
          expect(converter.unixToAtomic(1999, { array: true }))
            .toEqual([
              1999,
              2999,
              3999
            ])
          expect(converter.unixToAtomic(2000, { array: true }))
            .toEqual([
              4000
            ])
        })

        it('unixToAtomic', () => {
          expect(converter.unixToAtomic(0)).toBe(0)
          expect(converter.unixToAtomic(999))
            .toBe(999)
          expect(converter.unixToAtomic(1000))
            .toBe(3000)
          expect(converter.unixToAtomic(1999))
            .toBe(3999)
          expect(converter.unixToAtomic(2000))
            .toBe(4000)
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

      describe('BREAK', () => {
        it('disallows a zero-length segment between breaks', () => {
          expect(() => Converter(data, MODELS.BREAK))
            .toThrowError('Segment length must be positive')
        })
      })

      describe('STALL', () => {
        it('disallows a zero-length segment between stalls', () => {
          expect(() => Converter(data, MODELS.STALL))
            .toThrowError('Segment length must be positive')
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

      describe('OVERRUN', () => {
        const converter = Converter(data, MODELS.OVERRUN)

        it('unixToAtomic (array mode)', () => {
          expect(converter.unixToAtomic(0, { array: true })).toEqual([0])
          expect(converter.unixToAtomic(999, { array: true })).toEqual([999])
          expect(converter.unixToAtomic(1000, { array: true })).toEqual([1000, 2000])
          expect(converter.unixToAtomic(1499, { array: true })).toEqual([1499, 2499])
          expect(converter.unixToAtomic(1500, { array: true })).toEqual([1500, 2500, 3000])
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

      describe('BREAK', () => {
        const converter = Converter(data, MODELS.BREAK)

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
          expect(converter.atomicToUnix(1000)).toBe(NaN)
          expect(converter.atomicToUnix(1001)).toBe(NaN)
          expect(converter.atomicToUnix(1999)).toBe(NaN)
          expect(converter.atomicToUnix(2000)).toBe(1000)
          expect(converter.atomicToUnix(2001)).toBe(1001)
          expect(converter.atomicToUnix(2499)).toBe(1499)
          expect(converter.atomicToUnix(2500)).toBe(NaN)
          expect(converter.atomicToUnix(2501)).toBe(NaN)
          expect(converter.atomicToUnix(2999)).toBe(NaN)
          expect(converter.atomicToUnix(3000)).toBe(1500)
        })
      })

      describe('STALL', () => {
        const converter = Converter(data, MODELS.STALL)

        it('unixToAtomic (range mode)', () => {
          expect(converter.unixToAtomic(0, { range: true })).toEqual([0, 0])
          expect(converter.unixToAtomic(999, { range: true })).toEqual([999, 999])
          expect(converter.unixToAtomic(1000, { range: true })).toEqual([1000, 2000])
          expect(converter.unixToAtomic(1001, { range: true })).toEqual([2001, 2001])
          expect(converter.unixToAtomic(1499, { range: true })).toEqual([2499, 2499])
          expect(converter.unixToAtomic(1500, { range: true })).toEqual([2500, 3000])
          expect(converter.unixToAtomic(1501, { range: true })).toEqual([3001, 3001])
        })

        it('unixToAtomic', () => {
          expect(converter.unixToAtomic(0)).toBe(0)
          expect(converter.unixToAtomic(999)).toBe(999)
          expect(converter.unixToAtomic(1000)).toBe(2000)
          expect(converter.unixToAtomic(1001)).toBe(2001)
          expect(converter.unixToAtomic(1499)).toBe(2499)
          expect(converter.unixToAtomic(1500)).toBe(3000)
          expect(converter.unixToAtomic(1501)).toBe(3001)
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
      const data = [
        [0, 0],
        [1000, 1],
        [500, 2.5]
      ]

      describe('OVERRUN', () => {
        const converter = Converter(data, MODELS.OVERRUN)

        it('unixToAtomic (array mode)', () => {
          expect(converter.unixToAtomic(0, { array: true })).toEqual([0])
          expect(converter.unixToAtomic(499, { array: true })).toEqual([499])
          expect(converter.unixToAtomic(500, { array: true })).toEqual([500, 3000])
          expect(converter.unixToAtomic(999, { array: true })).toEqual([999, 3499])
          expect(converter.unixToAtomic(1000, { array: true })).toEqual([1000, 2000, 3500])
          expect(converter.unixToAtomic(1999, { array: true })).toEqual([1999, 2999, 4499])
          expect(converter.unixToAtomic(2000, { array: true })).toEqual([4500])
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

      describe('BREAK', () => {
        it('says no', () => {
          expect(() => Converter(data, MODELS.BREAK))
            .toThrowError('Segment length must be positive')
        })
      })

      describe('STALL', () => {
        it('says no', () => {
          expect(() => Converter(data, MODELS.STALL))
            .toThrowError('Segment length must be positive')
        })
      })
    })
  })

  describe('1 November 1963: 0.1 TAI seconds inserted', () => {
    const data = [
      [Date.UTC(1962, JAN, 1), 1.845_858_0, 37_665, 0.001_123_2],
      [Date.UTC(1963, NOV, 1), 1.945_858_0, 37_665, 0.001_123_2] // 0.1 TAI seconds added to UTC
    ]
    const converter = Converter(data, MODELS.OVERRUN)

    it('before anything clever occurs', () => {
      expect(converter.unixToAtomic(Date.UTC(1963, OCT, 31, 23, 59, 59, 999), { array: true }))
        .toEqual([
          Date.UTC(1963, NOV, 1, 0, 0, 2, 596)
        ])
        // -194_745_597_404_844_400_013n TAI picoseconds
    })

    it('exactly at the time', () => {
      expect(converter.unixToAtomic(Date.UTC(1963, NOV, 1, 0, 0, 0, 0), { array: true }))
        .toEqual([
          Date.UTC(1963, NOV, 1, 0, 0, 2, 597),
          Date.UTC(1963, NOV, 1, 0, 0, 2, 697)
        ])
      // expect(converter.unixToAtomicPicos(Date.UTC(1963, NOV, 1, 0, 0, 0, 0)))
    })

    it('then', () => {
      expect(converter.unixToAtomic(Date.UTC(1963, NOV, 1, 0, 0, 0, 1), { array: true }))
        .toEqual([
          Date.UTC(1963, NOV, 1, 0, 0, 2, 598),
          Date.UTC(1963, NOV, 1, 0, 0, 2, 698)
        ])

      expect(converter.unixToAtomic(Date.UTC(1963, NOV, 1, 0, 0, 0, 99), { array: true }))
        .toEqual([
          Date.UTC(1963, NOV, 1, 0, 0, 2, 696),
          Date.UTC(1963, NOV, 1, 0, 0, 2, 796) // -194_659_197_203_721_198_713n TAI
        ])

      expect(converter.unixToAtomic(Date.UTC(1963, NOV, 1, 0, 0, 0, 100), { array: true }))
        .toEqual([
          Date.UTC(1963, NOV, 1, 0, 0, 2, 797)
        ])

      expect(converter.unixToAtomic(Date.UTC(1963, NOV, 1, 0, 0, 0, 101), { array: true }))
        .toEqual([
          Date.UTC(1963, NOV, 1, 0, 0, 2, 798)
        ])
    })
  })
})

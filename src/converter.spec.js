/* eslint-env jest */

const { Converter, MODELS } = require('./converter')
const { munge } = require('./munge')

const { OVERRUN_ARRAY, OVERRUN_LAST, BREAK, STALL_RANGE, STALL_END } = MODELS

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

    describe('OVERRUN_ARRAY', () => {
      const converter = Converter(data, OVERRUN_ARRAY)

      it('manages basic conversions', () => {
        expect(converter.unixToAtomic(0)).toEqual([0])
        expect(converter.atomicToUnix(0)).toBe(0)
      })
    })

    describe('OVERRUN_LAST', () => {
      const converter = Converter(data, OVERRUN_LAST)

      it('manages basic conversions', () => {
        expect(converter.unixToAtomic(0)).toEqual(0)
        expect(converter.atomicToUnix(0)).toBe(0)
      })
    })

    describe('BREAK', () => {
      const converter = Converter(data, BREAK)

      it('manages basic conversions', () => {
        expect(converter.unixToAtomic(0)).toEqual(0)
        expect(converter.atomicToUnix(0)).toBe(0)
      })
    })

    describe('STALL_RANGE', () => {
      const converter = Converter(data, STALL_RANGE)

      it('manages basic conversions', () => {
        expect(converter.unixToAtomic(0)).toEqual([0, 0])
        expect(converter.atomicToUnix(0)).toBe(0)
      })
    })

    describe('STALL_END', () => {
      const converter = Converter(data, STALL_END)

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
        expect(converter.unixToAtomic(0)).toBe(0)
        expect(converter.atomicToUnix(0)).toBe(0)
      })
    })
  })

  describe('inserted leap second', () => {
    const data = [
      [Date.UTC(1970, JAN, 1), 0],
      [Date.UTC(1980, JAN, 1), 1]
    ]

    describe('OVERRUN_ARRAY', () => {
      const converter = Converter(data, OVERRUN_ARRAY)

      describe('conversions grouped by instant', () => {
        it('start of time', () => {
          expect(converter.unixToAtomic(0)).toEqual([0])
          expect(converter.atomicToUnix(0)).toBe(0)
        })

        it('millisecond before inserted leap second discontinuity begins', () => {
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 59, 999)
            ])
          expect(converter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
        })

        it('first instant of the Unix time discontinuity: one Unix time is two TAI times', () => {
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
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 1)))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 2)
            ])
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 2)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1))
        })
      })

      describe('conversions grouped by method', () => {
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

    describe('OVERRUN_LAST', () => {
      const converter = Converter(data, OVERRUN_LAST)

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
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
        })

        it('final instant of the Unix time discontinuity: one Unix time is two TAI times', () => {
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1, 999))
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))
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
      const converter = Converter(data, BREAK)

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

    describe('STALL_END', () => {
      const converter = Converter(data, STALL_END)

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
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0)) // stalled
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
        })

        it('final instant of the Unix time discontinuity: one Unix time is two TAI times', () => {
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1, 999))
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0)) // stalled
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

    describe('STALL_RANGE', () => {
      const converter = Converter(data, STALL_RANGE)

      describe('conversions grouped by instant', () => {
        it('start of time', () => {
          expect(converter.unixToAtomic(0)).toEqual([0, 0])
          expect(converter.atomicToUnix(0)).toBe(0)
        })

        it('millisecond before inserted leap second discontinuity begins', () => {
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 59, 999),
              Date.UTC(1979, DEC, 31, 23, 59, 59, 999)
            ])
          expect(converter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
        })

        it('first instant of the Unix time discontinuity: one Unix time is two TAI times', () => {
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 0, 0),
              Date.UTC(1980, JAN, 1, 0, 0, 1, 0) // stalled
            ])
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
        })

        it('final instant of the Unix time discontinuity: one Unix time is two TAI times', () => {
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 1, 999),
              Date.UTC(1980, JAN, 1, 0, 0, 1, 999)
            ])
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0)) // stalled
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))
        })

        it('millisecond after discontinuity ends', () => {
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 1, 0)))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 2, 0),
              Date.UTC(1980, JAN, 1, 0, 0, 2, 0)
            ])
          expect(converter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 2, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1, 0))
        })
      })

      describe('conversions grouped by method', () => {
        it('unixToAtomic', () => {
          expect(converter.unixToAtomic(0)).toEqual([0, 0])
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 59, 999),
              Date.UTC(1979, DEC, 31, 23, 59, 59, 999)
            ])
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 0, 0),
              Date.UTC(1980, JAN, 1, 0, 0, 1, 0)
            ])
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 1, 1),
              Date.UTC(1980, JAN, 1, 0, 0, 1, 1)
            ])
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 1, 999),
              Date.UTC(1980, JAN, 1, 0, 0, 1, 999)
            ])
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 1, 0)))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 2, 0),
              Date.UTC(1980, JAN, 1, 0, 0, 2, 0)
            ])
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

    describe('OVERRUN_ARRAY', () => {
      const converter = Converter(data, OVERRUN_ARRAY)

      describe('conversions grouped by instant', () => {
        it('start of time', () => {
          expect(converter.unixToAtomic(0)).toEqual([0])
          expect(converter.atomicToUnix(0)).toBe(0)
        })

        it('millisecond before removed leap second discontinuity begins', () => {
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 58, 999)
            ])
          expect(converter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
        })

        it('first instant of the Unix time discontinuity: one Unix time is zero TAI times', () => {
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toEqual([])
          // no atomicToUnix can return the value above
        })

        it('final instant of the Unix time discontinuity: one Unix time is zero TAI times', () => {
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toEqual([])
          // no atomicToUnix can return the value above
        })

        it('millisecond after discontinuity ends', () => {
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 59, 0)
            ])
          expect(converter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
        })
      })

      describe('conversions grouped by method', () => {
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

    describe('OVERRUN_LAST', () => {
      const converter = Converter(data, OVERRUN_LAST)

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

    describe('BREAK', () => {
      const converter = Converter(data, BREAK)

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

    describe('STALL_RANGE', () => {
      const converter = Converter(data, STALL_RANGE)

      describe('conversions grouped by instant', () => {
        it('start of time', () => {
          expect(converter.unixToAtomic(0)).toEqual([0, 0])
          expect(converter.atomicToUnix(0)).toBe(0)
        })

        it('millisecond before removed leap second discontinuity begins', () => {
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 58, 999),
              Date.UTC(1979, DEC, 31, 23, 59, 58, 999)
            ])
          expect(converter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
        })

        it('first instant of the Unix time discontinuity: one Unix time is zero TAI times', () => {
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toEqual([NaN, NaN])
          // no atomicToUnix can return the value above
        })

        it('final instant of the Unix time discontinuity: one Unix time is zero TAI times', () => {
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toEqual([NaN, NaN])
          // no atomicToUnix can return the value above
        })

        it('millisecond after discontinuity ends', () => {
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 59, 0),
              Date.UTC(1979, DEC, 31, 23, 59, 59, 0)
            ])
          expect(converter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
        })
      })

      describe('conversions grouped by method', () => {
        it('unixToAtomic', () => {
          expect(converter.unixToAtomic(0))
            .toEqual([0, 0])
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 58, 999),
              Date.UTC(1979, DEC, 31, 23, 59, 58, 999)
            ])
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toEqual([NaN, NaN])
          expect(converter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toEqual([NaN, NaN])
          expect(converter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 59, 0),
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

    describe('STALL_END', () => {
      const converter = Converter(data, STALL_END)

      describe('conversions grouped by instant', () => {
        it('start of time', () => {
          expect(converter.unixToAtomic(0)).toBe(0)
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
  })

  describe('insane edge cases', () => {
    describe('when unixMillis converts to an atomicPicos which fits but an atomicMillis which does not', () => {
      it('at the start of the ray', () => {
        const converter = Converter([
          [Date.UTC(1970, JAN, 1, 0, 0, 0, 1), -0.0001]
        ], OVERRUN_ARRAY)
        // 900_000_000n TAI picoseconds rounds down to 0 seconds, which is not in the ray
        expect(converter.unixToAtomic(1)).toEqual([])
      })

      it('at the end of the ray', () => {
        const converter = Converter([
          [Date.UTC(1969, DEC, 31, 23, 59, 59, 999), 0.0001],
          [Date.UTC(1970, JAN, 1, 0, 0, 0, 1), -0.0011]
        ], OVERRUN_ARRAY)
        // -900_000_000n TAI picoseconds rounds up to 0, which is not in the ray
        expect(converter.unixToAtomic(-1)).toEqual([])
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

      describe('OVERRUN_ARRAY', () => {
        const converter = Converter(data, OVERRUN_ARRAY)

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

      describe('OVERRUN_LAST', () => {
        const converter = Converter(data, OVERRUN_LAST)

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
        const converter = Converter(data, BREAK)

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
          expect(converter.atomicToUnix(1000)).toBe(NaN)
          expect(converter.atomicToUnix(1001)).toBe(NaN)
          expect(converter.atomicToUnix(1999)).toBe(NaN)
          expect(converter.atomicToUnix(2000)).toBe(NaN)
          expect(converter.atomicToUnix(2001)).toBe(NaN)
          expect(converter.atomicToUnix(2999)).toBe(NaN)
          expect(converter.atomicToUnix(3000)).toBe(1000)
          expect(converter.atomicToUnix(3001)).toBe(1001)
        })
      })

      describe('STALL_RANGE', () => {
        const converter = Converter(data, STALL_RANGE)

        it('unixToAtomic', () => {
          expect(converter.unixToAtomic(0)).toEqual([0, 0])
          expect(converter.unixToAtomic(999)).toEqual([999, 999])
          expect(converter.unixToAtomic(1000)).toEqual([1000, 3000]) // stall
          expect(converter.unixToAtomic(1001)).toEqual([3001, 3001])
          expect(converter.unixToAtomic(1999)).toEqual([3999, 3999])
          expect(converter.unixToAtomic(2000)).toEqual([4000, 4000])
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

      describe('STALL_END', () => {
        const converter = Converter(data, STALL_END)

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

      describe('OVERRUN_ARRAY', () => {
        const converter = Converter(data, OVERRUN_ARRAY)

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

      describe('OVERRUN_LAST', () => {
        const converter = Converter(data, OVERRUN_LAST)

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
        const converter = Converter(data, BREAK)

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

      describe('STALL_RANGE', () => {
        const converter = Converter(data, STALL_RANGE)

        it('unixToAtomic', () => {
          expect(converter.unixToAtomic(0)).toEqual([0, 0])
          expect(converter.unixToAtomic(999)).toEqual([999, 999])
          expect(converter.unixToAtomic(1000)).toEqual([1000, 2000])
          expect(converter.unixToAtomic(1001)).toEqual([2001, 2001])
          expect(converter.unixToAtomic(1499)).toEqual([2499, 2499])
          expect(converter.unixToAtomic(1500)).toEqual([2500, 3000])
          expect(converter.unixToAtomic(1501)).toEqual([3001, 3001])
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

      describe('STALL_END', () => {
        const converter = Converter(data, STALL_END)

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

      describe('OVERRUN_ARRAY', () => {
        const converter = Converter(data, OVERRUN_ARRAY)

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

      describe('OVERRUN_LAST', () => {
        const converter = Converter(data, OVERRUN_LAST)

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
        it('refuses to model it', () => {
          expect(() => Converter(data, BREAK))
            .toThrowError('Segment length must be non-negative')
        })
      })

      describe('STALL_RANGE', () => {
        it('refuses to model it', () => {
          expect(() => Converter(data, STALL_RANGE))
            .toThrowError('Segment length must be non-negative')
        })
      })

      describe('STALL_END', () => {
        it('refuses to model it', () => {
          expect(() => Converter(data, STALL_END))
            .toThrowError('Segment length must be non-negative')
        })
      })
    })
  })
})

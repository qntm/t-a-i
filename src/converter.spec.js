/* eslint-env jest */

const { Converter, MODELS } = require('./converter.js')
const { Rat } = require('./rat.js')
const { millisToExact } = require('./munge.js')

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
        expect(converter.unixToAtomic(new Rat(0n))).toEqual([{ start: new Rat(0n), end: new Rat(0n), closed: true }])
        expect(converter.unixMillisToAtomicMillis(0, { range: true, array: true })).toEqual([[0, 0]])
        expect(converter.unixMillisToAtomicMillis(0, { range: true })).toEqual([0, 0])
        expect(converter.unixMillisToAtomicMillis(0, { array: true })).toEqual([0])
        expect(converter.unixMillisToAtomicMillis(0)).toEqual(0)
        expect(converter.atomicToUnix(new Rat(0n))).toEqual(new Rat(0n))
        expect(converter.atomicMillisToUnixMillis(0)).toBe(0)
      })
    })

    describe('BREAK', () => {
      const converter = Converter(data, MODELS.BREAK)

      it('manages basic conversions', () => {
        expect(converter.unixToAtomic(new Rat(0n))).toEqual([{ start: new Rat(0n), end: new Rat(0n), closed: true }])
        expect(converter.unixMillisToAtomicMillis(0)).toEqual(0)
        expect(converter.atomicToUnix(new Rat(0n))).toEqual(new Rat(0n))
        expect(converter.atomicMillisToUnixMillis(0)).toBe(0)
      })
    })

    describe('STALL', () => {
      const converter = Converter(data, MODELS.STALL)

      it('fails on a non-integer number of milliseconds', () => {
        expect(() => converter.unixMillisToAtomicMillis(89.3)).toThrowError('Not an integer: 89.3')
        expect(() => converter.unixMillisToAtomicMillis('boop')).toThrowError('Not an integer: boop')
        expect(() => converter.atomicMillisToUnixMillis(Infinity)).toThrowError('Not an integer: Infinity')
        expect(() => converter.atomicMillisToUnixMillis('boops')).toThrowError('Not an integer: boops')
      })

      it('fails when the atomic count is out of bounds', () => {
        expect(converter.atomicToUnix(new Rat(0n))).toEqual(new Rat(0n))
        expect(converter.atomicMillisToUnixMillis(0)).toBe(0)
        expect(converter.atomicToUnix(new Rat(-1n, 1000n))).toBe(NaN)
        expect(converter.atomicMillisToUnixMillis(-1)).toBe(NaN)
      })

      it('fails when the Unix count is out of bounds', () => {
        expect(converter.unixToAtomic(new Rat(0n))).toEqual([{ start: new Rat(0n), end: new Rat(0n), closed: true }])
        expect(converter.unixMillisToAtomicMillis(0)).toBe(0)
        expect(converter.unixToAtomic(new Rat(-1n, 1000n))).toEqual([])
        expect(converter.unixMillisToAtomicMillis(-1)).toBe(NaN)
      })

      it('manages basic conversions', () => {
        expect(converter.unixToAtomic(new Rat(0n))).toEqual([{ start: new Rat(0n), end: new Rat(0n), closed: true }])
        expect(converter.unixMillisToAtomicMillis(0, { range: true, array: true })).toEqual([[0, 0]])
        expect(converter.unixMillisToAtomicMillis(0, { range: true })).toEqual([0, 0])
        expect(converter.unixMillisToAtomicMillis(0, { array: true })).toEqual([0])
        expect(converter.unixMillisToAtomicMillis(0)).toBe(0)
        expect(converter.atomicToUnix(new Rat(0n))).toEqual(new Rat(0n))
        expect(converter.atomicMillisToUnixMillis(0)).toBe(0)
      })
    })

    describe('SMEAR', () => {
      const converter = Converter(data, MODELS.SMEAR)

      it('manages basic conversions', () => {
        expect(converter.unixToAtomic(new Rat(0n))).toEqual([{ start: new Rat(0n), end: new Rat(0n), closed: true }])
        expect(converter.unixMillisToAtomicMillis(0)).toEqual(0)
        expect(converter.atomicToUnix(new Rat(0n))).toEqual(new Rat(0n))
        expect(converter.atomicMillisToUnixMillis(0)).toBe(0)
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
          expect(converter.unixToAtomic(new Rat(0n))).toEqual([{ start: new Rat(0n), end: new Rat(0n), closed: true }])
          expect(converter.unixMillisToAtomicMillis(0, { array: true })).toEqual([0])
          expect(converter.unixMillisToAtomicMillis(0)).toBe(0)
          expect(converter.atomicToUnix(new Rat(0n))).toEqual(new Rat(0n))
          expect(converter.atomicMillisToUnixMillis(0)).toBe(0)
        })

        it('millisecond before inserted leap second discontinuity begins', () => {
          expect(converter.unixToAtomic(millisToExact(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))))
            .toEqual([{
              start: millisToExact(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)),
              end: millisToExact(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)),
              closed: true
            }])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999), { array: true }))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 59, 999)
            ])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
          expect(converter.atomicToUnix(millisToExact(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))))
            .toEqual(millisToExact(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
        })

        it('first instant of the Unix time discontinuity: one Unix time is two TAI times', () => {
          expect(converter.unixToAtomic(millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 0))))
            .toEqual([{
              start: millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 0)),
              end: millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 0)),
              closed: true
            }, {
              start: millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 1)),
              end: millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 1)),
              closed: true
            }])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 0), { array: true }))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 0),
              Date.UTC(1980, JAN, 1, 0, 0, 1)
            ])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1))
          expect(converter.atomicToUnix(millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 0))))
            .toEqual(millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 0)))
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 0, 0, 1)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
        })

        it('final instant of the Unix time discontinuity: one Unix time is two TAI times', () => {
          expect(converter.unixToAtomic(millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))))
            .toEqual([{
              start: millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)),
              end: millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)),
              closed: true
            }, {
              start: millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 1, 999)),
              end: millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 1, 999)),
              closed: true
            }])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 999), { array: true }))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 0, 999),
              Date.UTC(1980, JAN, 1, 0, 0, 1, 999)
            ])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1, 999))
          expect(converter.atomicToUnix(millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))))
            .toEqual(millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 0, 0, 1, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))
        })

        it('millisecond after discontinuity ends', () => {
          expect(converter.unixToAtomic(millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 1))))
            .toEqual([{
              start: millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 2)),
              end: millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 2)),
              closed: true
            }])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 1), { array: true }))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 2)
            ])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 1)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 2))
          expect(converter.atomicToUnix(millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 2))))
            .toEqual(millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 1)))
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 0, 0, 2)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1))
        })
      })

      describe('conversions grouped by method', () => {
        it('unixToAtomic', () => {
          expect(converter.unixToAtomic(new Rat(0n))).toEqual([{ start: new Rat(0n), end: new Rat(0n), closed: true }])
          expect(converter.unixToAtomic(millisToExact(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))))
            .toEqual([{
              start: millisToExact(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)),
              end: millisToExact(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)),
              closed: true
            }])
          expect(converter.unixToAtomic(millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 0))))
            .toEqual([{
              start: millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 0)),
              end: millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 0)),
              closed: true
            }, {
              start: millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 1)),
              end: millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 1)),
              closed: true
            }])
          expect(converter.unixToAtomic(millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))))
            .toEqual([{
              start: millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)),
              end: millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)),
              closed: true
            }, {
              start: millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 1, 999)),
              end: millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 1, 999)),
              closed: true
            }])
          expect(converter.unixToAtomic(millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 1))))
            .toEqual([{
              start: millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 2)),
              end: millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 2)),
              closed: true
            }])
        })

        it('unixMillisToAtomicMillis (array mode)', () => {
          expect(converter.unixMillisToAtomicMillis(0, { array: true })).toEqual([0])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999), { array: true }))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 59, 999)
            ])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 0), { array: true }))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 0),
              Date.UTC(1980, JAN, 1, 0, 0, 1)
            ])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 999), { array: true }))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 0, 999),
              Date.UTC(1980, JAN, 1, 0, 0, 1, 999)
            ])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 1), { array: true }))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 2)
            ])
        })

        it('unixMillisToAtomicMillis', () => {
          expect(converter.unixMillisToAtomicMillis(0)).toBe(0)
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1))
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1, 999))
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 1)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 2))
        })

        it('atomicToUnix', () => {
          expect(converter.atomicToUnix(new Rat(0n))).toEqual(new Rat(0n))
          expect(converter.atomicToUnix(millisToExact(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))))
            .toEqual(millisToExact(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
          expect(converter.atomicToUnix(millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 0))))
            .toEqual(millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 0)))
          expect(converter.atomicToUnix(millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))))
            .toEqual(millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
          expect(converter.atomicToUnix(millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 2))))
            .toEqual(millisToExact(Date.UTC(1980, JAN, 1, 0, 0, 1)))
        })

        it('atomicMillisToUnixMillis', () => {
          expect(converter.atomicMillisToUnixMillis(0)).toBe(0)
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 0, 0, 1)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 0, 0, 1, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 0, 0, 2)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1))
        })
      })
    })

    // /////////////

    describe('BREAK', () => {
      const converter = Converter(data, MODELS.BREAK)

      describe('conversions grouped by instant', () => {
        it('start of time', () => {
          expect(converter.unixMillisToAtomicMillis(0)).toBe(0)
          expect(converter.atomicMillisToUnixMillis(0)).toBe(0)
        })

        it('millisecond before inserted leap second discontinuity begins', () => {
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
        })

        it('first instant of the Unix time discontinuity: one Unix time is two TAI times', () => {
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1))
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(NaN)
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 0, 0, 1)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
        })

        it('final instant of the Unix time discontinuity: one Unix time is two TAI times', () => {
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1, 999))
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toBe(NaN)
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 0, 0, 1, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))
        })

        it('millisecond after discontinuity ends', () => {
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 1)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 2))
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 0, 0, 2)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1))
        })
      })

      describe('conversions grouped by method', () => {
        it('unixMillisToAtomicMillis', () => {
          expect(converter.unixMillisToAtomicMillis(0)).toBe(0)
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1))
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1, 999))
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 1)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 2))
        })

        it('atomicMillisToUnixMillis', () => {
          expect(converter.atomicMillisToUnixMillis(0)).toBe(0)
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(NaN)
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toBe(NaN)
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 0, 0, 1)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 0, 0, 1, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 0, 0, 2)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1))
        })
      })
    })

    describe('STALL', () => {
      const converter = Converter(data, MODELS.STALL)

      describe('conversions grouped by instant', () => {
        it('start of time', () => {
          expect(converter.unixMillisToAtomicMillis(0, { range: true })).toEqual([0, 0])
          expect(converter.unixMillisToAtomicMillis(0)).toBe(0)
          expect(converter.atomicMillisToUnixMillis(0)).toBe(0)
        })

        it('millisecond before inserted leap second discontinuity begins', () => {
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999), { range: true }))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 59, 999),
              Date.UTC(1979, DEC, 31, 23, 59, 59, 999)
            ])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
        })

        it('first instant of the Unix time discontinuity: one Unix time is two TAI times', () => {
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 0), { range: true }))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 0, 0),
              Date.UTC(1980, JAN, 1, 0, 0, 1, 0) // stalled
            ])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1))
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 0, 0, 1)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
        })

        it('final instant of the Unix time discontinuity: one Unix time is two TAI times', () => {
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 999), { range: true }))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 1, 999),
              Date.UTC(1980, JAN, 1, 0, 0, 1, 999)
            ])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1, 999))
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0)) // stalled
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 0, 0, 1, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))
        })

        it('millisecond after discontinuity ends', () => {
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 1, 0), { range: true }))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 2, 0),
              Date.UTC(1980, JAN, 1, 0, 0, 2, 0)
            ])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 1)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 2, 0))
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 0, 0, 2, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1, 0))
        })
      })

      describe('conversions grouped by method', () => {
        it('unixMillisToAtomicMillis (range mode)', () => {
          expect(converter.unixMillisToAtomicMillis(0, { range: true })).toEqual([0, 0])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999), { range: true }))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 59, 999),
              Date.UTC(1979, DEC, 31, 23, 59, 59, 999)
            ])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 0), { range: true }))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 0, 0),
              Date.UTC(1980, JAN, 1, 0, 0, 1, 0)
            ])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 1), { range: true }))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 1, 1),
              Date.UTC(1980, JAN, 1, 0, 0, 1, 1)
            ])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 999), { range: true }))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 1, 999),
              Date.UTC(1980, JAN, 1, 0, 0, 1, 999)
            ])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 1, 0), { range: true }))
            .toEqual([
              Date.UTC(1980, JAN, 1, 0, 0, 2, 0),
              Date.UTC(1980, JAN, 1, 0, 0, 2, 0)
            ])
        })

        it('unixMillisToAtomicMillis', () => {
          expect(converter.unixMillisToAtomicMillis(0)).toBe(0)
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1))
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1, 999))
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 1)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 2))
        })

        it('atomicMillisToUnixMillis', () => {
          expect(converter.atomicMillisToUnixMillis(0)).toBe(0)
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0)) // stalled
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0)) // stalled
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 0, 0, 1)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 0, 0, 1, 999)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 0, 0, 2)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1))
        })
      })
    })

    describe('SMEAR', () => {
      const converter = Converter(data, MODELS.SMEAR)

      it('unixMillisToAtomicMillis', () => {
        expect(converter.unixMillisToAtomicMillis(0)).toBe(0)
        expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 11, 59, 59, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 11, 59, 59, 999))
        expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 12, 0, 0, 0)))
          .toBe(Date.UTC(1979, DEC, 31, 12, 0, 0, 0))
        expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 500))
        expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 12, 0, 0, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 12, 0, 1, 0))
        expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 12, 0, 0, 1)))
          .toBe(Date.UTC(1980, JAN, 1, 12, 0, 1, 1))
        expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 12, 0, 1, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 12, 0, 2, 0))
      })

      it('atomicMillisToUnixMillis', () => {
        expect(converter.atomicMillisToUnixMillis(0)).toBe(0)
        expect(converter.atomicMillisToUnixMillis(Date.UTC(1979, DEC, 31, 11, 59, 59, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 11, 59, 59, 999))
        expect(converter.atomicMillisToUnixMillis(Date.UTC(1979, DEC, 31, 12, 0, 0, 0)))
          .toBe(Date.UTC(1979, DEC, 31, 12, 0, 0, 0))
        expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 500)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))
        expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 12, 0, 1, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 12, 0, 0, 0))
        expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 12, 0, 1, 1)))
          .toBe(Date.UTC(1980, JAN, 1, 12, 0, 0, 1))
        expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 12, 0, 2, 0)))
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
          expect(converter.unixMillisToAtomicMillis(0, { array: true })).toEqual([0])
          expect(converter.unixMillisToAtomicMillis(0)).toEqual(0)
          expect(converter.atomicMillisToUnixMillis(0)).toBe(0)
        })

        it('millisecond before removed leap second discontinuity begins', () => {
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 58, 999), { array: true }))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 58, 999)
            ])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
        })

        it('first instant of the Unix time discontinuity: one Unix time is zero TAI times', () => {
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 0), { array: true }))
            .toEqual([])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toBe(NaN)
          // no atomicMillisToUnixMillis can return the value above
        })

        it('final instant of the Unix time discontinuity: one Unix time is zero TAI times', () => {
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999), { array: true }))
            .toEqual([])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(NaN)
          // no atomicMillisToUnixMillis can return the value above
        })

        it('millisecond after discontinuity ends', () => {
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 0), { array: true }))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 59, 0)
            ])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 0))
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 0), { array: true }))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
        })
      })

      describe('conversions grouped by method', () => {
        it('unixMillisToAtomicMillis (array mode)', () => {
          expect(converter.unixMillisToAtomicMillis(0, { array: true }))
            .toEqual([0])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 58, 999), { array: true }))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 58, 999)
            ])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 0), { array: true }))
            .toEqual([])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999), { array: true }))
            .toEqual([])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 0), { array: true }))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 59, 0)
            ])
        })

        it('unixMillisToAtomicMillis', () => {
          expect(converter.unixMillisToAtomicMillis(0))
            .toBe(0)
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toBe(NaN)
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(NaN)
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 0))
        })

        it('atomicMillisToUnixMillis', () => {
          expect(converter.atomicMillisToUnixMillis(0))
            .toBe(0)
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
        })
      })
    })

    describe('BREAK', () => {
      const converter = Converter(data, MODELS.BREAK)

      describe('conversions grouped by instant', () => {
        it('start of time', () => {
          expect(converter.unixMillisToAtomicMillis(0)).toEqual(0)
          expect(converter.atomicMillisToUnixMillis(0)).toBe(0)
        })

        it('millisecond before removed leap second discontinuity begins', () => {
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
        })

        it('first instant of the Unix time discontinuity: one Unix time is zero TAI times', () => {
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toBe(NaN)
          // no atomicMillisToUnixMillis can return the value above
        })

        it('final instant of the Unix time discontinuity: one Unix time is zero TAI times', () => {
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(NaN)
          // no atomicMillisToUnixMillis can return the value above
        })

        it('millisecond after discontinuity ends', () => {
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 0))
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
        })
      })

      describe('conversions grouped by method', () => {
        it('unixMillisToAtomicMillis', () => {
          expect(converter.unixMillisToAtomicMillis(0))
            .toBe(0)
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toBe(NaN)
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(NaN)
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 0))
        })

        it('atomicMillisToUnixMillis', () => {
          expect(converter.atomicMillisToUnixMillis(0))
            .toBe(0)
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
        })
      })
    })

    describe('STALL', () => {
      const converter = Converter(data, MODELS.STALL)

      describe('conversions grouped by instant', () => {
        it('start of time', () => {
          expect(converter.unixMillisToAtomicMillis(0, { range: true })).toEqual([0, 0])
          expect(converter.unixMillisToAtomicMillis(0)).toBe(0)
          expect(converter.atomicMillisToUnixMillis(0)).toBe(0)
        })

        it('millisecond before removed leap second discontinuity begins', () => {
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 58, 999), { range: true }))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 58, 999),
              Date.UTC(1979, DEC, 31, 23, 59, 58, 999)
            ])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
        })

        it('first instant of the Unix time discontinuity: one Unix time is zero TAI times', () => {
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 0), { range: true }))
            .toEqual([NaN, NaN])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toBe(NaN)
          // no atomicMillisToUnixMillis can return the value above
        })

        it('final instant of the Unix time discontinuity: one Unix time is zero TAI times', () => {
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999), { range: true }))
            .toEqual([NaN, NaN])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(NaN)
          // no atomicMillisToUnixMillis can return the value above
        })

        it('millisecond after discontinuity ends', () => {
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 0), { range: true }))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 59, 0),
              Date.UTC(1979, DEC, 31, 23, 59, 59, 0)
            ])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 0))
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
        })
      })

      describe('conversions grouped by method', () => {
        it('unixMillisToAtomicMillis (range mode)', () => {
          expect(converter.unixMillisToAtomicMillis(0, { range: true }))
            .toEqual([0, 0])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 58, 999), { range: true }))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 58, 999),
              Date.UTC(1979, DEC, 31, 23, 59, 58, 999)
            ])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 0), { range: true }))
            .toEqual([NaN, NaN])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999), { range: true }))
            .toEqual([NaN, NaN])
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 0), { range: true }))
            .toEqual([
              Date.UTC(1979, DEC, 31, 23, 59, 59, 0),
              Date.UTC(1979, DEC, 31, 23, 59, 59, 0)
            ])
        })

        it('unixMillisToAtomicMillis', () => {
          expect(converter.unixMillisToAtomicMillis(0))
            .toBe(0)
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toBe(NaN)
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
            .toBe(NaN)
          expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 0)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 0))
        })

        it('atomicMillisToUnixMillis', () => {
          expect(converter.atomicMillisToUnixMillis(0))
            .toBe(0)
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
            .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
          expect(converter.atomicMillisToUnixMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
            .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0))
        })
      })
    })

    describe('SMEAR', () => {
      const converter = Converter(data, MODELS.SMEAR)

      it('unixMillisToAtomicMillis', () => {
        expect(converter.unixMillisToAtomicMillis(0)).toBe(0)
        expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 11, 59, 59, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 11, 59, 59, 999))
        expect(converter.unixMillisToAtomicMillis(Date.UTC(1979, DEC, 31, 12, 0, 0, 0)))
          .toBe(Date.UTC(1979, DEC, 31, 12, 0, 0, 0))
        expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))
          .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 500))
        expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 12, 0, 0, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 11, 59, 59, 0))
        expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 12, 0, 0, 1)))
          .toBe(Date.UTC(1980, JAN, 1, 11, 59, 59, 1))
        expect(converter.unixMillisToAtomicMillis(Date.UTC(1980, JAN, 1, 12, 0, 1, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 12, 0, 0, 0))
      })

      it('atomicMillisToUnixMillis', () => {
        expect(converter.atomicMillisToUnixMillis(0)).toBe(0)
        expect(converter.atomicMillisToUnixMillis(Date.UTC(1979, DEC, 31, 11, 59, 59, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 11, 59, 59, 999))
        expect(converter.atomicMillisToUnixMillis(Date.UTC(1979, DEC, 31, 12, 0, 0, 0)))
          .toBe(Date.UTC(1979, DEC, 31, 12, 0, 0, 0))
        expect(converter.atomicMillisToUnixMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 500)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))
        expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 11, 59, 59, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 12, 0, 0, 0))
        expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 11, 59, 59, 1)))
          .toBe(Date.UTC(1980, JAN, 1, 12, 0, 0, 1))
        expect(converter.atomicMillisToUnixMillis(Date.UTC(1980, JAN, 1, 12, 0, 0, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 12, 0, 1, 0))
      })
    })
  })

  describe('insane edge cases', () => {
    describe('when unixMillis converts to an atomicPicos which fits but an atomicMillis which does not', () => {
      it('at the start of the ray', () => {
        const data = [
          [Date.UTC(1970, JAN, 1, 0, 0, 0, 1), -0.000_1]
        ]
        const converter = Converter(data, MODELS.OVERRUN)
        // 900_000_000n TAI picoseconds rounds down to 0 seconds, which is not in the ray
        expect(converter.unixMillisToAtomicMillis(1, { array: true })).toEqual([0])
      })

      it('at the end of the ray', () => {
        const data = [
          [Date.UTC(1969, DEC, 31, 23, 59, 59, 999), 0.000_1],
          [Date.UTC(1970, JAN, 1, 0, 0, 0, 1), -0.001_1]
        ]
        const converter = Converter(data, MODELS.OVERRUN)
        expect(converter.unixMillisToAtomicMillis(-1, { array: true })).toEqual([-1])
      })
    })
  })

  describe('new stalling behaviour', () => {
    describe('two inserted leap seconds', () => {
      const data = [
        [0, 0],
        [1_000, 1],
        [1_000, 2]
      ]

      describe('OVERRUN', () => {
        const converter = Converter(data, MODELS.OVERRUN)

        it('unixMillisToAtomicMillis (array mode)', () => {
          expect(converter.unixMillisToAtomicMillis(0, { array: true })).toEqual([0])
          expect(converter.unixMillisToAtomicMillis(999, { array: true }))
            .toEqual([
              999
            ])
          expect(converter.unixMillisToAtomicMillis(1_000, { array: true }))
            .toEqual([
              1_000,
              2_000,
              3_000
            ])
          expect(converter.unixMillisToAtomicMillis(1_999, { array: true }))
            .toEqual([
              1_999,
              2_999,
              3_999
            ])
          expect(converter.unixMillisToAtomicMillis(2_000, { array: true }))
            .toEqual([
              4_000
            ])
        })

        it('unixMillisToAtomicMillis', () => {
          expect(converter.unixMillisToAtomicMillis(0)).toBe(0)
          expect(converter.unixMillisToAtomicMillis(999))
            .toBe(999)
          expect(converter.unixMillisToAtomicMillis(1_000))
            .toBe(3_000)
          expect(converter.unixMillisToAtomicMillis(1_999))
            .toBe(3_999)
          expect(converter.unixMillisToAtomicMillis(2_000))
            .toBe(4_000)
        })

        it('atomicMillisToUnixMillis', () => {
          expect(converter.atomicMillisToUnixMillis(0)).toBe(0)
          expect(converter.atomicMillisToUnixMillis(1_000)).toBe(1_000)
          expect(converter.atomicMillisToUnixMillis(1_001)).toBe(1_001)
          expect(converter.atomicMillisToUnixMillis(1_999)).toBe(1_999)
          expect(converter.atomicMillisToUnixMillis(2_000)).toBe(1_000)
          expect(converter.atomicMillisToUnixMillis(2_001)).toBe(1_001)
          expect(converter.atomicMillisToUnixMillis(2_999)).toBe(1_999)
          expect(converter.atomicMillisToUnixMillis(3_000)).toBe(1_000)
          expect(converter.atomicMillisToUnixMillis(3_001)).toBe(1_001)
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
      // at TAI = 1_000, Unix time stalls for 1_000ms
      // then at TAI = 2_500, Unix time stalls for another 500ms
      const data = [
        [0, 0],
        [1_000, 1],
        [1_500, 1.5]
      ]

      describe('OVERRUN', () => {
        const converter = Converter(data, MODELS.OVERRUN)

        it('unixMillisToAtomicMillis (array mode)', () => {
          expect(converter.unixMillisToAtomicMillis(0, { array: true })).toEqual([0])
          expect(converter.unixMillisToAtomicMillis(999, { array: true })).toEqual([999])
          expect(converter.unixMillisToAtomicMillis(1_000, { array: true })).toEqual([1_000, 2_000])
          expect(converter.unixMillisToAtomicMillis(1_499, { array: true })).toEqual([1_499, 2_499])
          expect(converter.unixMillisToAtomicMillis(1_500, { array: true })).toEqual([1_500, 2_500, 3_000])
        })

        it('unixMillisToAtomicMillis', () => {
          expect(converter.unixMillisToAtomicMillis(0)).toBe(0)
          expect(converter.unixMillisToAtomicMillis(999)).toBe(999)
          expect(converter.unixMillisToAtomicMillis(1_000)).toBe(2_000)
          expect(converter.unixMillisToAtomicMillis(1_499)).toBe(2_499)
          expect(converter.unixMillisToAtomicMillis(1_500)).toBe(3_000)
        })

        it('atomicMillisToUnixMillis', () => {
          expect(converter.atomicMillisToUnixMillis(0)).toBe(0)
          expect(converter.atomicMillisToUnixMillis(999)).toBe(999)
          expect(converter.atomicMillisToUnixMillis(1_000)).toBe(1_000)
          expect(converter.atomicMillisToUnixMillis(1_001)).toBe(1_001)
          expect(converter.atomicMillisToUnixMillis(1_999)).toBe(1_999)
          expect(converter.atomicMillisToUnixMillis(2_000)).toBe(1_000)
          expect(converter.atomicMillisToUnixMillis(2_001)).toBe(1_001)
          expect(converter.atomicMillisToUnixMillis(2_499)).toBe(1_499)
          expect(converter.atomicMillisToUnixMillis(2_500)).toBe(1_500)
          expect(converter.atomicMillisToUnixMillis(2_999)).toBe(1_999)
          expect(converter.atomicMillisToUnixMillis(3_000)).toBe(1_500)
        })
      })

      describe('BREAK', () => {
        const converter = Converter(data, MODELS.BREAK)

        it('unixMillisToAtomicMillis', () => {
          expect(converter.unixMillisToAtomicMillis(0)).toBe(0)
          expect(converter.unixMillisToAtomicMillis(999)).toBe(999)
          expect(converter.unixMillisToAtomicMillis(1_000)).toBe(2_000)
          expect(converter.unixMillisToAtomicMillis(1_499)).toBe(2_499)
          expect(converter.unixMillisToAtomicMillis(1_500)).toBe(3_000)
        })

        it('atomicMillisToUnixMillis', () => {
          expect(converter.atomicMillisToUnixMillis(0)).toBe(0)
          expect(converter.atomicMillisToUnixMillis(999)).toBe(999)
          expect(converter.atomicMillisToUnixMillis(1_000)).toBe(NaN)
          expect(converter.atomicMillisToUnixMillis(1_001)).toBe(NaN)
          expect(converter.atomicMillisToUnixMillis(1_999)).toBe(NaN)
          expect(converter.atomicMillisToUnixMillis(2_000)).toBe(1_000)
          expect(converter.atomicMillisToUnixMillis(2_001)).toBe(1_001)
          expect(converter.atomicMillisToUnixMillis(2_499)).toBe(1_499)
          expect(converter.atomicMillisToUnixMillis(2_500)).toBe(NaN)
          expect(converter.atomicMillisToUnixMillis(2_501)).toBe(NaN)
          expect(converter.atomicMillisToUnixMillis(2_999)).toBe(NaN)
          expect(converter.atomicMillisToUnixMillis(3_000)).toBe(1_500)
        })
      })

      describe('STALL', () => {
        const converter = Converter(data, MODELS.STALL)

        it('unixMillisToAtomicMillis (range mode)', () => {
          expect(converter.unixMillisToAtomicMillis(0, { range: true })).toEqual([0, 0])
          expect(converter.unixMillisToAtomicMillis(999, { range: true })).toEqual([999, 999])
          expect(converter.unixMillisToAtomicMillis(1_000, { range: true })).toEqual([1_000, 2_000])
          expect(converter.unixMillisToAtomicMillis(1_001, { range: true })).toEqual([2_001, 2_001])
          expect(converter.unixMillisToAtomicMillis(1_499, { range: true })).toEqual([2_499, 2_499])
          expect(converter.unixMillisToAtomicMillis(1_500, { range: true })).toEqual([2_500, 3_000])
          expect(converter.unixMillisToAtomicMillis(1_501, { range: true })).toEqual([3_001, 3_001])
        })

        it('unixMillisToAtomicMillis', () => {
          expect(converter.unixMillisToAtomicMillis(0)).toBe(0)
          expect(converter.unixMillisToAtomicMillis(999)).toBe(999)
          expect(converter.unixMillisToAtomicMillis(1_000)).toBe(2_000)
          expect(converter.unixMillisToAtomicMillis(1_001)).toBe(2_001)
          expect(converter.unixMillisToAtomicMillis(1_499)).toBe(2_499)
          expect(converter.unixMillisToAtomicMillis(1_500)).toBe(3_000)
          expect(converter.unixMillisToAtomicMillis(1_501)).toBe(3_001)
        })

        it('atomicMillisToUnixMillis', () => {
          expect(converter.atomicMillisToUnixMillis(0)).toBe(0)
          expect(converter.atomicMillisToUnixMillis(999)).toBe(999)
          expect(converter.atomicMillisToUnixMillis(1_000)).toBe(1_000)
          expect(converter.atomicMillisToUnixMillis(1_001)).toBe(1_000)
          expect(converter.atomicMillisToUnixMillis(1_999)).toBe(1_000)
          expect(converter.atomicMillisToUnixMillis(2_000)).toBe(1_000)
          expect(converter.atomicMillisToUnixMillis(2_001)).toBe(1_001)
          expect(converter.atomicMillisToUnixMillis(2_499)).toBe(1_499)
          expect(converter.atomicMillisToUnixMillis(2_500)).toBe(1_500)
          expect(converter.atomicMillisToUnixMillis(2_501)).toBe(1_500)
          expect(converter.atomicMillisToUnixMillis(2_999)).toBe(1_500)
          expect(converter.atomicMillisToUnixMillis(3_000)).toBe(1_500)
          expect(converter.atomicMillisToUnixMillis(3_001)).toBe(1_501)
        })
      })
    })

    describe('2.5 inserted leap seconds', () => {
      // Insertion of 1.5 additional seconds means ray #3 retroactively eliminates ray #2.
      const data = [
        [0, 0],
        [1_000, 1],
        [500, 2.5]
      ]

      describe('OVERRUN', () => {
        const converter = Converter(data, MODELS.OVERRUN)

        it('unixMillisToAtomicMillis (array mode)', () => {
          expect(converter.unixMillisToAtomicMillis(0, { array: true })).toEqual([0])
          expect(converter.unixMillisToAtomicMillis(499, { array: true })).toEqual([499])
          expect(converter.unixMillisToAtomicMillis(500, { array: true })).toEqual([500, 3_000])
          expect(converter.unixMillisToAtomicMillis(999, { array: true })).toEqual([999, 3_499])
          expect(converter.unixMillisToAtomicMillis(1_000, { array: true })).toEqual([1_000, 2_000, 3_500])
          expect(converter.unixMillisToAtomicMillis(1_999, { array: true })).toEqual([1_999, 2_999, 4_499])
          expect(converter.unixMillisToAtomicMillis(2_000, { array: true })).toEqual([4_500])
        })

        it('unixMillisToAtomicMillis', () => {
          expect(converter.unixMillisToAtomicMillis(0)).toBe(0)
          expect(converter.unixMillisToAtomicMillis(499)).toBe(499)
          expect(converter.unixMillisToAtomicMillis(500)).toBe(3_000)
          expect(converter.unixMillisToAtomicMillis(999)).toBe(3_499)
          expect(converter.unixMillisToAtomicMillis(1_000)).toBe(3_500)
          expect(converter.unixMillisToAtomicMillis(1_999)).toBe(4_499)
          expect(converter.unixMillisToAtomicMillis(2_000)).toBe(4_500)
        })

        it('atomicMillisToUnixMillis', () => {
          expect(converter.atomicMillisToUnixMillis(0)).toBe(0)
          expect(converter.atomicMillisToUnixMillis(499)).toBe(499)
          expect(converter.atomicMillisToUnixMillis(500)).toBe(500)
          expect(converter.atomicMillisToUnixMillis(999)).toBe(999)
          expect(converter.atomicMillisToUnixMillis(1_000)).toBe(1_000)
          expect(converter.atomicMillisToUnixMillis(1_001)).toBe(1_001)
          expect(converter.atomicMillisToUnixMillis(1_999)).toBe(1_999)
          expect(converter.atomicMillisToUnixMillis(2_000)).toBe(1_000)
          expect(converter.atomicMillisToUnixMillis(2_001)).toBe(1_001)
          expect(converter.atomicMillisToUnixMillis(2_999)).toBe(1_999)
          expect(converter.atomicMillisToUnixMillis(3_000)).toBe(500)
          expect(converter.atomicMillisToUnixMillis(3_001)).toBe(501)
          expect(converter.atomicMillisToUnixMillis(4_499)).toBe(1_999)
          expect(converter.atomicMillisToUnixMillis(4_500)).toBe(2_000)
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
      expect(converter.unixMillisToAtomicMillis(Date.UTC(1963, OCT, 31, 23, 59, 59, 999), { array: true }))
        .toEqual([
          Date.UTC(1963, NOV, 1, 0, 0, 2, 596)
        ])
        // -194_745_597_404_844_400_013n TAI picoseconds
    })

    it('exactly at the time', () => {
      expect(converter.unixMillisToAtomicMillis(Date.UTC(1963, NOV, 1, 0, 0, 0, 0), { array: true }))
        .toEqual([
          Date.UTC(1963, NOV, 1, 0, 0, 2, 597),
          Date.UTC(1963, NOV, 1, 0, 0, 2, 697)
        ])
      // expect(converter.unixMillisToAtomicMillisPicos(Date.UTC(1963, NOV, 1, 0, 0, 0, 0)))
    })

    it('then', () => {
      expect(converter.unixMillisToAtomicMillis(Date.UTC(1963, NOV, 1, 0, 0, 0, 1), { array: true }))
        .toEqual([
          Date.UTC(1963, NOV, 1, 0, 0, 2, 598),
          Date.UTC(1963, NOV, 1, 0, 0, 2, 698)
        ])

      expect(converter.unixMillisToAtomicMillis(Date.UTC(1963, NOV, 1, 0, 0, 0, 99), { array: true }))
        .toEqual([
          Date.UTC(1963, NOV, 1, 0, 0, 2, 696),
          Date.UTC(1963, NOV, 1, 0, 0, 2, 796) // -194_659_197_203_721_198_713n TAI
        ])

      expect(converter.unixMillisToAtomicMillis(Date.UTC(1963, NOV, 1, 0, 0, 0, 100), { array: true }))
        .toEqual([
          Date.UTC(1963, NOV, 1, 0, 0, 2, 797)
        ])

      expect(converter.unixMillisToAtomicMillis(Date.UTC(1963, NOV, 1, 0, 0, 0, 101), { array: true }))
        .toEqual([
          Date.UTC(1963, NOV, 1, 0, 0, 2, 798)
        ])
    })
  })
})

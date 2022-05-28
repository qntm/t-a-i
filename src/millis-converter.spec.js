/* eslint-env jest */

const { MODELS } = require('./munge.js')
const { MillisConverter } = require('./millis-converter.js')

const JAN = 0
const OCT = 9
const NOV = 10
const DEC = 11

describe('MillisConverter', () => {
  describe('one ray', () => {
    const data = [
      [Date.UTC(1970, JAN, 1), 0]
    ]

    describe('OVERRUN', () => {
      const millisConverter = new MillisConverter(data, MODELS.OVERRUN)

      it('manages basic conversions', () => {
        expect(millisConverter.unixToAtomic(0, { range: true, array: true }))
          .toEqual([[0, 0]])
        expect(millisConverter.unixToAtomic(0, { range: true }))
          .toEqual([0, 0])
        expect(millisConverter.unixToAtomic(0, { array: true }))
          .toEqual([0])
        expect(millisConverter.unixToAtomic(0))
          .toBe(0)
        expect(millisConverter.atomicToUnix(0))
          .toBe(0)
      })
    })

    describe('BREAK', () => {
      const millisConverter = new MillisConverter(data, MODELS.BREAK)

      it('manages basic conversions', () => {
        expect(millisConverter.unixToAtomic(0))
          .toBe(0)
        expect(millisConverter.atomicToUnix(0))
          .toBe(0)
      })
    })

    describe('STALL', () => {
      const millisConverter = new MillisConverter(data, MODELS.STALL)

      it('fails on a non-integer number of milliseconds', () => {
        expect(() => millisConverter.unixToAtomic(89.3)).toThrowError('Not an integer: 89.3')
        expect(() => millisConverter.unixToAtomic('boop')).toThrowError('Not an integer: boop')
        expect(() => millisConverter.atomicToUnix(Infinity)).toThrowError('Not an integer: Infinity')
        expect(() => millisConverter.atomicToUnix('boops')).toThrowError('Not an integer: boops')
      })

      it('fails when the atomic count is out of bounds', () => {
        expect(millisConverter.atomicToUnix(0))
          .toBe(0)
        expect(millisConverter.atomicToUnix(-1))
          .toBe(NaN)
      })

      it('fails when the Unix count is out of bounds', () => {
        expect(millisConverter.unixToAtomic(0))
          .toBe(0)
        expect(millisConverter.unixToAtomic(-1))
          .toBe(NaN)
      })

      it('manages basic conversions', () => {
        expect(millisConverter.unixToAtomic(0, { range: true, array: true })).toEqual([[0, 0]])
        expect(millisConverter.unixToAtomic(0, { range: true })).toEqual([0, 0])
        expect(millisConverter.unixToAtomic(0, { array: true })).toEqual([0])
        expect(millisConverter.unixToAtomic(0)).toBe(0)
        expect(millisConverter.atomicToUnix(0)).toBe(0)
      })
    })

    describe('SMEAR', () => {
      const millisConverter = new MillisConverter(data, MODELS.SMEAR)

      it('manages basic conversions', () => {
        expect(millisConverter.unixToAtomic(0))
          .toBe(0)
        expect(millisConverter.atomicToUnix(0))
          .toBe(0)
      })
    })
  })

  describe('inserted leap second', () => {
    const data = [
      [Date.UTC(1970, JAN, 1), 0],
      [Date.UTC(1980, JAN, 1), 1]
    ]

    describe('OVERRUN', () => {
      const millisConverter = new MillisConverter(data, MODELS.OVERRUN)

      it('unixToAtomic (array mode)', () => {
        expect(millisConverter.unixToAtomic(0, { array: true }))
          .toEqual([
            0
          ])

        // BIFURCATION
        expect(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999), { array: true }))
          .toEqual([
            Date.UTC(1979, DEC, 31, 23, 59, 59, 999)
          ])
        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 0), { array: true }))
          .toEqual([
            Date.UTC(1980, JAN, 1, 0, 0, 0, 0),
            Date.UTC(1980, JAN, 1, 0, 0, 1, 0)
          ])
        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 1), { array: true }))
          .toEqual([
            Date.UTC(1980, JAN, 1, 0, 0, 0, 1),
            Date.UTC(1980, JAN, 1, 0, 0, 1, 1)
          ])

        // COLLAPSE
        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 999), { array: true }))
          .toEqual([
            Date.UTC(1980, JAN, 1, 0, 0, 0, 999),
            Date.UTC(1980, JAN, 1, 0, 0, 1, 999)
          ])
        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 1, 0), { array: true }))
          .toEqual([
            Date.UTC(1980, JAN, 1, 0, 0, 2, 0)
          ])
        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 1, 1), { array: true }))
          .toEqual([
            Date.UTC(1980, JAN, 1, 0, 0, 2, 1)
          ])
      })

      it('unixToAtomic', () => {
        expect(millisConverter.unixToAtomic(0))
          .toBe(0)

        // FORWARD JUMP
        expect(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1, 0))
        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1, 1))

        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1, 999))
        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 1, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 2, 0))
        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 1, 1)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 2, 1))
      })

      it('atomicToUnix', () => {
        expect(millisConverter.atomicToUnix(0))
          .toBe(0)

        expect(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
        expect(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))
        expect(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 1))

        // BACKTRACK
        expect(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))
        expect(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))
        expect(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1, 1)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 1))
      })
    })

    describe('BREAK', () => {
      const millisConverter = new MillisConverter(data, MODELS.BREAK)

      it('unixToAtomic', () => {
        expect(millisConverter.unixToAtomic(0))
          .toBe(0)

        // FORWARD JUMP
        expect(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1, 0))
        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1, 1))

        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1, 999))
        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 1, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 2, 0))
        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 1, 1)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 2, 1))
      })

      it('atomicToUnix', () => {
        expect(millisConverter.atomicToUnix(0))
          .toBe(0)

        // UNDEFINED UNIX TIME STARTS
        expect(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
        expect(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))
          .toBe(NaN)
        expect(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)))
          .toBe(NaN)

        // UNDEFINED UNIX TIME ENDS
        expect(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
          .toBe(NaN)
        expect(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))
        expect(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1, 1)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 1))
      })
    })

    describe('STALL', () => {
      const millisConverter = new MillisConverter(data, MODELS.STALL)

      it('unixToAtomic (range mode)', () => {
        expect(millisConverter.unixToAtomic(0, { range: true }))
          .toEqual([0, 0])

        // STALL POINT
        expect(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999), { range: true }))
          .toEqual([
            Date.UTC(1979, DEC, 31, 23, 59, 59, 999),
            Date.UTC(1979, DEC, 31, 23, 59, 59, 999)
          ])
        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 0), { range: true }))
          .toEqual([
            Date.UTC(1980, JAN, 1, 0, 0, 0, 0),
            Date.UTC(1980, JAN, 1, 0, 0, 1, 0)
          ])
        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 1), { range: true }))
          .toEqual([
            Date.UTC(1980, JAN, 1, 0, 0, 1, 1),
            Date.UTC(1980, JAN, 1, 0, 0, 1, 1)
          ])
      })

      it('unixToAtomic', () => {
        expect(millisConverter.unixToAtomic(0))
          .toBe(0)

        // FORWARD JUMP
        expect(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1, 0))
        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 1, 1))
      })

      it('atomicToUnix', () => {
        expect(millisConverter.atomicToUnix(0))
          .toBe(0)

        // STALL STARTS
        expect(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
        expect(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))
        expect(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))

        // STALL ENDS
        expect(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))
        expect(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))
        expect(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1, 1)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 1))
      })
    })

    describe('SMEAR', () => {
      const millisConverter = new MillisConverter(data, MODELS.SMEAR)

      it('unixToAtomic', () => {
        expect(millisConverter.unixToAtomic(0))
          .toBe(0)

        // SMEAR STARTS
        expect(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 11, 59, 59, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 11, 59, 59, 999))
        expect(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 12, 0, 0, 0)))
          .toBe(Date.UTC(1979, DEC, 31, 12, 0, 0, 0))
        expect(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 12, 0, 0, 1)))
          .toBe(Date.UTC(1979, DEC, 31, 12, 0, 0, 1))

        // SMEAR MIDPOINT
        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 500))

        // SMEAR ENDS
        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 11, 59, 59, 999)))
          .toBe(Date.UTC(1980, JAN, 1, 12, 0, 0, 998)) // truncated down
        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 12, 0, 0, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 12, 0, 1, 0))
        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 12, 0, 0, 1)))
          .toBe(Date.UTC(1980, JAN, 1, 12, 0, 1, 1))
      })

      it('atomicToUnix', () => {
        expect(millisConverter.atomicToUnix(0))
          .toBe(0)

        // SMEAR STARTS
        expect(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 11, 59, 59, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 11, 59, 59, 999))
        expect(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 12, 0, 0, 0)))
          .toBe(Date.UTC(1979, DEC, 31, 12, 0, 0, 0))
        expect(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 12, 0, 0, 1)))
          .toBe(Date.UTC(1979, DEC, 31, 12, 0, 0, 0)) // truncated down

        // SMEAR MIDPOINT
        expect(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 500)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))

        // SMEAR ENDS
        expect(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 12, 0, 0, 999)))
          .toBe(Date.UTC(1980, JAN, 1, 11, 59, 59, 999))
        expect(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 12, 0, 1, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 12, 0, 0, 0))
        expect(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 12, 0, 1, 1)))
          .toBe(Date.UTC(1980, JAN, 1, 12, 0, 0, 1))
      })
    })
  })

  describe('removed leap second', () => {
    const data = [
      [Date.UTC(1970, JAN, 1), 0],
      [Date.UTC(1980, JAN, 1), -1]
    ]

    describe('OVERRUN', () => {
      const millisConverter = new MillisConverter(data, MODELS.OVERRUN)

      it('unixToAtomic (array mode)', () => {
        expect(millisConverter.unixToAtomic(0, { array: true }))
          .toEqual([0])

        // START OF MISSING TIME
        expect(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 58, 999), { array: true }))
          .toEqual([
            Date.UTC(1979, DEC, 31, 23, 59, 58, 999)
          ])
        expect(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 0), { array: true }))
          .toEqual([])
        expect(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 1), { array: true }))
          .toEqual([])

        // END OF MISSING TIME
        expect(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999), { array: true }))
          .toEqual([])
        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 0), { array: true }))
          .toEqual([
            Date.UTC(1979, DEC, 31, 23, 59, 59, 0)
          ])
        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 1), { array: true }))
          .toEqual([
            Date.UTC(1979, DEC, 31, 23, 59, 59, 1)
          ])
      })

      it('unixToAtomic', () => {
        expect(millisConverter.unixToAtomic(0))
          .toBe(0)

        // START OF MISSING TIME
        expect(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
        expect(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
          .toBe(NaN)
        expect(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 1)))
          .toBe(NaN)

        // END OF MISSING TIME
        expect(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
          .toBe(NaN)
        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))
          .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 0))
        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)))
          .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 1))
      })

      it('atomicToUnix', () => {
        expect(millisConverter.atomicToUnix(0))
          .toBe(0)

        // JUMP AHEAD
        expect(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
        expect(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))
        expect(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 1)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 1))
      })
    })

    describe('BREAK', () => {
      const millisConverter = new MillisConverter(data, MODELS.BREAK)

      it('unixToAtomic', () => {
        expect(millisConverter.unixToAtomic(0))
          .toBe(0)

        // START OF MISSING TIME
        expect(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
        expect(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
          .toBe(NaN)
        expect(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 1)))
          .toBe(NaN)

        // END OF MISSING TIME
        expect(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
          .toBe(NaN)
        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))
          .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 0))
        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)))
          .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 1))
      })

      it('atomicToUnix', () => {
        expect(millisConverter.atomicToUnix(0))
          .toBe(0)

        // JUMP AHEAD
        expect(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
        expect(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))
        expect(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 1)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 1))
      })
    })

    describe('STALL', () => {
      const millisConverter = new MillisConverter(data, MODELS.STALL)

      it('unixToAtomic (range mode)', () => {
        expect(millisConverter.unixToAtomic(0, { range: true }))
          .toEqual([
            0,
            0
          ])

        // START OF MISSING TIME
        expect(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 58, 999), { range: true }))
          .toEqual([
            Date.UTC(1979, DEC, 31, 23, 59, 58, 999),
            Date.UTC(1979, DEC, 31, 23, 59, 58, 999)
          ])
        expect(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 0), { range: true }))
          .toEqual([
            NaN,
            NaN
          ])
        expect(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 1), { range: true }))
          .toEqual([
            NaN,
            NaN
          ])

        // END OF MISSING TIME
        expect(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999), { range: true }))
          .toEqual([
            NaN,
            NaN
          ])
        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 0), { range: true }))
          .toEqual([
            Date.UTC(1979, DEC, 31, 23, 59, 59, 0),
            Date.UTC(1979, DEC, 31, 23, 59, 59, 0)
          ])
        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 1), { range: true }))
          .toEqual([
            Date.UTC(1979, DEC, 31, 23, 59, 59, 1),
            Date.UTC(1979, DEC, 31, 23, 59, 59, 1)
          ])
      })

      it('unixToAtomic', () => {
        expect(millisConverter.unixToAtomic(0))
          .toBe(0)

        // START OF MISSING TIME
        expect(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
        expect(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
          .toBe(NaN)
        expect(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 1)))
          .toBe(NaN)

        // END OF MISSING TIME
        expect(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
          .toBe(NaN)
        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))
          .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 0))
        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)))
          .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 1))
      })

      it('atomicToUnix', () => {
        expect(millisConverter.atomicToUnix(0))
          .toBe(0)

        // JUMP AHEAD
        expect(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
        expect(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))
        expect(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 1)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 1))
      })
    })

    describe('SMEAR', () => {
      const millisConverter = new MillisConverter(data, MODELS.SMEAR)

      it('unixToAtomic', () => {
        expect(millisConverter.unixToAtomic(0))
          .toBe(0)

        // START OF SMEAR
        expect(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 11, 59, 59, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 11, 59, 59, 999))
        expect(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 12, 0, 0, 0)))
          .toBe(Date.UTC(1979, DEC, 31, 12, 0, 0, 0))
        expect(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 12, 0, 0, 1)))
          .toBe(Date.UTC(1979, DEC, 31, 12, 0, 0, 0)) // truncated

        // MIDPOINT OF SMEAR
        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))
          .toBe(Date.UTC(1979, DEC, 31, 23, 59, 59, 500))

        // END OF SMEAR
        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 11, 59, 59, 999)))
          .toBe(Date.UTC(1980, JAN, 1, 11, 59, 58, 999))
        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 12, 0, 0, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 11, 59, 59, 0))
        expect(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 12, 0, 0, 1)))
          .toBe(Date.UTC(1980, JAN, 1, 11, 59, 59, 1))
      })

      it('atomicToUnix', () => {
        expect(millisConverter.atomicToUnix(0))
          .toBe(0)

        // START OF SMEAR
        expect(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 11, 59, 59, 999)))
          .toBe(Date.UTC(1979, DEC, 31, 11, 59, 59, 999))
        expect(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 12, 0, 0, 0)))
          .toBe(Date.UTC(1979, DEC, 31, 12, 0, 0, 0))
        expect(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 12, 0, 0, 1)))
          .toBe(Date.UTC(1979, DEC, 31, 12, 0, 0, 1))

        // MIDPOINT OF SMEAR
        expect(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 500)))
          .toBe(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))

        // END OF SMEAR
        expect(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 11, 59, 59, 999)))
          .toBe(Date.UTC(1980, JAN, 1, 12, 0, 0, 999))
        expect(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 11, 59, 59, 0)))
          .toBe(Date.UTC(1980, JAN, 1, 12, 0, 0, 0))
        expect(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 11, 59, 59, 1)))
          .toBe(Date.UTC(1980, JAN, 1, 12, 0, 0, 1))
      })
    })
  })

  describe('insane edge cases', () => {
    describe('precise round trips work but milliseconds do not', () => {
      it('at the start of the ray', () => {
        const data = [
          [Date.UTC(1970, JAN, 1, 0, 0, 0, 1), -0.000_1]
        ]
        const millisConverter = new MillisConverter(data, MODELS.OVERRUN)

        expect(millisConverter.unixToAtomic(1, { array: true }))
          .toEqual([0]) // truncated from .9 to 0
        expect(millisConverter.atomicToUnix(0))
          .toBe(NaN)
      })

      it('at the end of the ray', () => {
        const data = [
          [Date.UTC(1969, DEC, 31, 23, 59, 59, 999), 0.000_1],
          [Date.UTC(1970, JAN, 1, 0, 0, 0, 1), -0.001_1]
        ]
        const millisConverter = new MillisConverter(data, MODELS.OVERRUN)

        expect(millisConverter.unixToAtomic(-1, { array: true }))
          .toEqual([-1])
        expect(millisConverter.atomicToUnix(-1))
          .toBe(NaN)
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
        const millisConverter = new MillisConverter(data, MODELS.OVERRUN)

        it('unixToAtomic (array mode)', () => {
          expect(millisConverter.unixToAtomic(0, { array: true })).toEqual([0])
          expect(millisConverter.unixToAtomic(999, { array: true }))
            .toEqual([
              999
            ])
          expect(millisConverter.unixToAtomic(1_000, { array: true }))
            .toEqual([
              1_000,
              2_000,
              3_000
            ])
          expect(millisConverter.unixToAtomic(1_999, { array: true }))
            .toEqual([
              1_999,
              2_999,
              3_999
            ])
          expect(millisConverter.unixToAtomic(2_000, { array: true }))
            .toEqual([
              4_000
            ])
        })

        it('unixToAtomic', () => {
          expect(millisConverter.unixToAtomic(0)).toBe(0)
          expect(millisConverter.unixToAtomic(999))
            .toBe(999)
          expect(millisConverter.unixToAtomic(1_000))
            .toBe(3_000)
          expect(millisConverter.unixToAtomic(1_999))
            .toBe(3_999)
          expect(millisConverter.unixToAtomic(2_000))
            .toBe(4_000)
        })

        it('atomicToUnix', () => {
          expect(millisConverter.atomicToUnix(0)).toBe(0)
          expect(millisConverter.atomicToUnix(1_000)).toBe(1_000)
          expect(millisConverter.atomicToUnix(1_001)).toBe(1_001)
          expect(millisConverter.atomicToUnix(1_999)).toBe(1_999)
          expect(millisConverter.atomicToUnix(2_000)).toBe(1_000)
          expect(millisConverter.atomicToUnix(2_001)).toBe(1_001)
          expect(millisConverter.atomicToUnix(2_999)).toBe(1_999)
          expect(millisConverter.atomicToUnix(3_000)).toBe(1_000)
          expect(millisConverter.atomicToUnix(3_001)).toBe(1_001)
        })
      })

      describe('BREAK', () => {
        const millisConverter = new MillisConverter(data, MODELS.BREAK)

        it('unixToAtomic (range mode)', () => {
          expect(millisConverter.unixToAtomic(0, { range: true }))
            .toEqual([
              0,
              0
            ])

          // STALL POINT
          expect(millisConverter.unixToAtomic(999, { range: true }))
            .toEqual([
              999,
              999
            ])
          expect(millisConverter.unixToAtomic(1000, { range: true }))
            .toEqual([
              3000,
              3000
            ])
          expect(millisConverter.unixToAtomic(1001, { range: true }))
            .toEqual([
              3001,
              3001
            ])
        })

        it('unixToAtomic', () => {
          expect(millisConverter.unixToAtomic(0))
            .toBe(0)

          // STALL POINT
          expect(millisConverter.unixToAtomic(999))
            .toBe(999)
          expect(millisConverter.unixToAtomic(1000))
            .toBe(3000)
          expect(millisConverter.unixToAtomic(1001))
            .toBe(3001)
        })

        it('atomicToUnix', () => {
          expect(millisConverter.atomicToUnix(0))
            .toBe(0)

          // STALL STARTS
          expect(millisConverter.atomicToUnix(999))
            .toBe(999)
          expect(millisConverter.atomicToUnix(1000))
            .toBe(NaN)
          expect(millisConverter.atomicToUnix(1001))
            .toBe(NaN)

          // STALL ENDS
          expect(millisConverter.atomicToUnix(2999))
            .toBe(NaN)
          expect(millisConverter.atomicToUnix(3000))
            .toEqual(1000)
          expect(millisConverter.atomicToUnix(3001))
            .toEqual(1001)
        })
      })

      describe('STALL', () => {
        const millisConverter = new MillisConverter(data, MODELS.STALL)

        it('unixToAtomic (range mode)', () => {
          expect(millisConverter.unixToAtomic(0, { range: true }))
            .toEqual([
              0,
              0
            ])

          // STALL POINT
          expect(millisConverter.unixToAtomic(999, { range: true }))
            .toEqual([
              999,
              999
            ])
          expect(millisConverter.unixToAtomic(1000, { range: true }))
            .toEqual([
              1000,
              3000
            ])
          expect(millisConverter.unixToAtomic(1001, { range: true }))
            .toEqual([
              3001,
              3001
            ])
        })

        it('unixToAtomic', () => {
          expect(millisConverter.unixToAtomic(0))
            .toBe(0)

          // STALL POINT
          expect(millisConverter.unixToAtomic(999))
            .toBe(999)
          expect(millisConverter.unixToAtomic(1000))
            .toBe(3000)
          expect(millisConverter.unixToAtomic(1001))
            .toBe(3001)
        })

        it('atomicToUnix', () => {
          expect(millisConverter.atomicToUnix(0))
            .toBe(0)

          // STALL STARTS
          expect(millisConverter.atomicToUnix(999))
            .toBe(999)
          expect(millisConverter.atomicToUnix(1000))
            .toBe(1000)
          expect(millisConverter.atomicToUnix(1001))
            .toBe(1000)

          // STALL ENDS
          expect(millisConverter.atomicToUnix(2999))
            .toEqual(1000)
          expect(millisConverter.atomicToUnix(3000))
            .toEqual(1000)
          expect(millisConverter.atomicToUnix(3001))
            .toEqual(1001)
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
        const millisConverter = new MillisConverter(data, MODELS.OVERRUN)

        it('unixToAtomic (array mode)', () => {
          expect(millisConverter.unixToAtomic(0, { array: true })).toEqual([0])
          expect(millisConverter.unixToAtomic(999, { array: true })).toEqual([999])
          expect(millisConverter.unixToAtomic(1_000, { array: true })).toEqual([1_000, 2_000])
          expect(millisConverter.unixToAtomic(1_499, { array: true })).toEqual([1_499, 2_499])
          expect(millisConverter.unixToAtomic(1_500, { array: true })).toEqual([1_500, 2_500, 3_000])
        })

        it('unixToAtomic', () => {
          expect(millisConverter.unixToAtomic(0)).toBe(0)
          expect(millisConverter.unixToAtomic(999)).toBe(999)
          expect(millisConverter.unixToAtomic(1_000)).toBe(2_000)
          expect(millisConverter.unixToAtomic(1_499)).toBe(2_499)
          expect(millisConverter.unixToAtomic(1_500)).toBe(3_000)
        })

        it('atomicToUnix', () => {
          expect(millisConverter.atomicToUnix(0)).toBe(0)
          expect(millisConverter.atomicToUnix(999)).toBe(999)
          expect(millisConverter.atomicToUnix(1_000)).toBe(1_000)
          expect(millisConverter.atomicToUnix(1_001)).toBe(1_001)
          expect(millisConverter.atomicToUnix(1_999)).toBe(1_999)
          expect(millisConverter.atomicToUnix(2_000)).toBe(1_000)
          expect(millisConverter.atomicToUnix(2_001)).toBe(1_001)
          expect(millisConverter.atomicToUnix(2_499)).toBe(1_499)
          expect(millisConverter.atomicToUnix(2_500)).toBe(1_500)
          expect(millisConverter.atomicToUnix(2_999)).toBe(1_999)
          expect(millisConverter.atomicToUnix(3_000)).toBe(1_500)
        })
      })

      describe('BREAK', () => {
        const millisConverter = new MillisConverter(data, MODELS.BREAK)

        it('unixToAtomic', () => {
          expect(millisConverter.unixToAtomic(0)).toBe(0)
          expect(millisConverter.unixToAtomic(999)).toBe(999)
          expect(millisConverter.unixToAtomic(1_000)).toBe(2_000)
          expect(millisConverter.unixToAtomic(1_499)).toBe(2_499)
          expect(millisConverter.unixToAtomic(1_500)).toBe(3_000)
        })

        it('atomicToUnix', () => {
          expect(millisConverter.atomicToUnix(0)).toBe(0)
          expect(millisConverter.atomicToUnix(999)).toBe(999)
          expect(millisConverter.atomicToUnix(1_000)).toBe(NaN)
          expect(millisConverter.atomicToUnix(1_001)).toBe(NaN)
          expect(millisConverter.atomicToUnix(1_999)).toBe(NaN)
          expect(millisConverter.atomicToUnix(2_000)).toBe(1_000)
          expect(millisConverter.atomicToUnix(2_001)).toBe(1_001)
          expect(millisConverter.atomicToUnix(2_499)).toBe(1_499)
          expect(millisConverter.atomicToUnix(2_500)).toBe(NaN)
          expect(millisConverter.atomicToUnix(2_501)).toBe(NaN)
          expect(millisConverter.atomicToUnix(2_999)).toBe(NaN)
          expect(millisConverter.atomicToUnix(3_000)).toBe(1_500)
        })
      })

      describe('STALL', () => {
        const millisConverter = new MillisConverter(data, MODELS.STALL)

        it('unixToAtomic (range mode)', () => {
          expect(millisConverter.unixToAtomic(0, { range: true })).toEqual([0, 0])
          expect(millisConverter.unixToAtomic(999, { range: true })).toEqual([999, 999])
          expect(millisConverter.unixToAtomic(1_000, { range: true })).toEqual([1_000, 2_000])
          expect(millisConverter.unixToAtomic(1_001, { range: true })).toEqual([2_001, 2_001])
          expect(millisConverter.unixToAtomic(1_499, { range: true })).toEqual([2_499, 2_499])
          expect(millisConverter.unixToAtomic(1_500, { range: true })).toEqual([2_500, 3_000])
          expect(millisConverter.unixToAtomic(1_501, { range: true })).toEqual([3_001, 3_001])
        })

        it('unixToAtomic', () => {
          expect(millisConverter.unixToAtomic(0)).toBe(0)
          expect(millisConverter.unixToAtomic(999)).toBe(999)
          expect(millisConverter.unixToAtomic(1_000)).toBe(2_000)
          expect(millisConverter.unixToAtomic(1_001)).toBe(2_001)
          expect(millisConverter.unixToAtomic(1_499)).toBe(2_499)
          expect(millisConverter.unixToAtomic(1_500)).toBe(3_000)
          expect(millisConverter.unixToAtomic(1_501)).toBe(3_001)
        })

        it('atomicToUnix', () => {
          expect(millisConverter.atomicToUnix(0)).toBe(0)
          expect(millisConverter.atomicToUnix(999)).toBe(999)
          expect(millisConverter.atomicToUnix(1_000)).toBe(1_000)
          expect(millisConverter.atomicToUnix(1_001)).toBe(1_000)
          expect(millisConverter.atomicToUnix(1_999)).toBe(1_000)
          expect(millisConverter.atomicToUnix(2_000)).toBe(1_000)
          expect(millisConverter.atomicToUnix(2_001)).toBe(1_001)
          expect(millisConverter.atomicToUnix(2_499)).toBe(1_499)
          expect(millisConverter.atomicToUnix(2_500)).toBe(1_500)
          expect(millisConverter.atomicToUnix(2_501)).toBe(1_500)
          expect(millisConverter.atomicToUnix(2_999)).toBe(1_500)
          expect(millisConverter.atomicToUnix(3_000)).toBe(1_500)
          expect(millisConverter.atomicToUnix(3_001)).toBe(1_501)
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
        const millisConverter = new MillisConverter(data, MODELS.OVERRUN)

        it('unixToAtomic (array mode)', () => {
          expect(millisConverter.unixToAtomic(0, { array: true })).toEqual([0])
          expect(millisConverter.unixToAtomic(499, { array: true })).toEqual([499])
          expect(millisConverter.unixToAtomic(500, { array: true })).toEqual([500, 3_000])
          expect(millisConverter.unixToAtomic(999, { array: true })).toEqual([999, 3_499])
          expect(millisConverter.unixToAtomic(1_000, { array: true })).toEqual([1_000, 2_000, 3_500])
          expect(millisConverter.unixToAtomic(1_999, { array: true })).toEqual([1_999, 2_999, 4_499])
          expect(millisConverter.unixToAtomic(2_000, { array: true })).toEqual([4_500])
        })

        it('unixToAtomic', () => {
          expect(millisConverter.unixToAtomic(0)).toBe(0)
          expect(millisConverter.unixToAtomic(499)).toBe(499)
          expect(millisConverter.unixToAtomic(500)).toBe(3_000)
          expect(millisConverter.unixToAtomic(999)).toBe(3_499)
          expect(millisConverter.unixToAtomic(1_000)).toBe(3_500)
          expect(millisConverter.unixToAtomic(1_999)).toBe(4_499)
          expect(millisConverter.unixToAtomic(2_000)).toBe(4_500)
        })

        it('atomicToUnix', () => {
          expect(millisConverter.atomicToUnix(0)).toBe(0)
          expect(millisConverter.atomicToUnix(499)).toBe(499)
          expect(millisConverter.atomicToUnix(500)).toBe(500)
          expect(millisConverter.atomicToUnix(999)).toBe(999)
          expect(millisConverter.atomicToUnix(1_000)).toBe(1_000)
          expect(millisConverter.atomicToUnix(1_001)).toBe(1_001)
          expect(millisConverter.atomicToUnix(1_999)).toBe(1_999)
          expect(millisConverter.atomicToUnix(2_000)).toBe(1_000)
          expect(millisConverter.atomicToUnix(2_001)).toBe(1_001)
          expect(millisConverter.atomicToUnix(2_999)).toBe(1_999)
          expect(millisConverter.atomicToUnix(3_000)).toBe(500)
          expect(millisConverter.atomicToUnix(3_001)).toBe(501)
          expect(millisConverter.atomicToUnix(4_499)).toBe(1_999)
          expect(millisConverter.atomicToUnix(4_500)).toBe(2_000)
        })
      })

      describe('BREAK', () => {
        it('says no', () => {
          expect(() => new MillisConverter(data, MODELS.BREAK))
            .toThrowError('Segment length must be positive')
        })
      })

      describe('STALL', () => {
        it('says no', () => {
          expect(() => new MillisConverter(data, MODELS.STALL))
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
    const millisConverter = new MillisConverter(data, MODELS.OVERRUN)

    it('before anything clever occurs', () => {
      expect(millisConverter.unixToAtomic(Date.UTC(1963, OCT, 31, 23, 59, 59, 999), { array: true }))
        .toEqual([
          Date.UTC(1963, NOV, 1, 0, 0, 2, 596)
        ])
        // -194_745_597_404_844_400_013n TAI picoseconds
    })

    it('exactly at the time', () => {
      expect(millisConverter.unixToAtomic(Date.UTC(1963, NOV, 1, 0, 0, 0, 0), { array: true }))
        .toEqual([
          Date.UTC(1963, NOV, 1, 0, 0, 2, 597),
          Date.UTC(1963, NOV, 1, 0, 0, 2, 697)
        ])
      // expect(millisConverter.unixToAtomicPicos(Date.UTC(1963, NOV, 1, 0, 0, 0, 0)))
    })

    it('then', () => {
      expect(millisConverter.unixToAtomic(Date.UTC(1963, NOV, 1, 0, 0, 0, 1), { array: true }))
        .toEqual([
          Date.UTC(1963, NOV, 1, 0, 0, 2, 598),
          Date.UTC(1963, NOV, 1, 0, 0, 2, 698)
        ])

      expect(millisConverter.unixToAtomic(Date.UTC(1963, NOV, 1, 0, 0, 0, 99), { array: true }))
        .toEqual([
          Date.UTC(1963, NOV, 1, 0, 0, 2, 696),
          Date.UTC(1963, NOV, 1, 0, 0, 2, 796) // -194_659_197_203_721_198_713n TAI
        ])

      expect(millisConverter.unixToAtomic(Date.UTC(1963, NOV, 1, 0, 0, 0, 100), { array: true }))
        .toEqual([
          Date.UTC(1963, NOV, 1, 0, 0, 2, 797)
        ])

      expect(millisConverter.unixToAtomic(Date.UTC(1963, NOV, 1, 0, 0, 0, 101), { array: true }))
        .toEqual([
          Date.UTC(1963, NOV, 1, 0, 0, 2, 798)
        ])
    })
  })
})

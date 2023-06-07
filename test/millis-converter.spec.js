import assert from 'node:assert'
import { describe, it } from 'mocha'
import { MODELS } from '../src/munge.js'
import { MillisConverter } from '../src/millis-converter.js'

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
        assert.deepStrictEqual(millisConverter.unixToAtomic(0, { range: true, array: true }),
          [[0, 0]])
        assert.deepStrictEqual(millisConverter.unixToAtomic(0, { range: true }),
          [0, 0])
        assert.deepStrictEqual(millisConverter.unixToAtomic(0, { array: true }),
          [0])
        assert.strictEqual(millisConverter.unixToAtomic(0),
          0)
        assert.strictEqual(millisConverter.atomicToUnix(0),
          0)
      })
    })

    describe('BREAK', () => {
      const millisConverter = new MillisConverter(data, MODELS.BREAK)

      it('manages basic conversions', () => {
        assert.strictEqual(millisConverter.unixToAtomic(0),
          0)
        assert.strictEqual(millisConverter.atomicToUnix(0),
          0)
      })
    })

    describe('STALL', () => {
      const millisConverter = new MillisConverter(data, MODELS.STALL)

      it('fails on a non-integer number of milliseconds', () => {
        assert.throws(() => millisConverter.unixToAtomic(89.3), /Not an integer: 89.3/)
        assert.throws(() => millisConverter.unixToAtomic('boop'), /Not an integer: boop/)
        assert.throws(() => millisConverter.atomicToUnix(Infinity), /Not an integer: Infinity/)
        assert.throws(() => millisConverter.atomicToUnix('boops'), /Not an integer: boops/)
      })

      it('fails when the atomic count is out of bounds', () => {
        assert.strictEqual(millisConverter.atomicToUnix(0),
          0)
        assert.strictEqual(millisConverter.atomicToUnix(-1),
          NaN)
      })

      it('fails when the Unix count is out of bounds', () => {
        assert.strictEqual(millisConverter.unixToAtomic(0),
          0)
        assert.strictEqual(millisConverter.unixToAtomic(-1),
          NaN)
      })

      it('manages basic conversions', () => {
        assert.deepStrictEqual(millisConverter.unixToAtomic(0, { range: true, array: true }), [[0, 0]])
        assert.deepStrictEqual(millisConverter.unixToAtomic(0, { range: true }), [0, 0])
        assert.deepStrictEqual(millisConverter.unixToAtomic(0, { array: true }), [0])
        assert.strictEqual(millisConverter.unixToAtomic(0), 0)
        assert.strictEqual(millisConverter.atomicToUnix(0), 0)
      })
    })

    describe('SMEAR', () => {
      const millisConverter = new MillisConverter(data, MODELS.SMEAR)

      it('manages basic conversions', () => {
        assert.strictEqual(millisConverter.unixToAtomic(0),
          0)
        assert.strictEqual(millisConverter.atomicToUnix(0),
          0)
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
        assert.deepStrictEqual(millisConverter.unixToAtomic(0, { array: true }),
          [
            0
          ])

        // BIFURCATION
        assert.deepStrictEqual(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999), { array: true }),
          [
            Date.UTC(1979, DEC, 31, 23, 59, 59, 999)
          ])
        assert.deepStrictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 0), { array: true }),
          [
            Date.UTC(1980, JAN, 1, 0, 0, 0, 0),
            Date.UTC(1980, JAN, 1, 0, 0, 1, 0)
          ])
        assert.deepStrictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 1), { array: true }),
          [
            Date.UTC(1980, JAN, 1, 0, 0, 0, 1),
            Date.UTC(1980, JAN, 1, 0, 0, 1, 1)
          ])

        // COLLAPSE
        assert.deepStrictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 999), { array: true }),
          [
            Date.UTC(1980, JAN, 1, 0, 0, 0, 999),
            Date.UTC(1980, JAN, 1, 0, 0, 1, 999)
          ])
        assert.deepStrictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 1, 0), { array: true }),
          [
            Date.UTC(1980, JAN, 1, 0, 0, 2, 0)
          ])
        assert.deepStrictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 1, 1), { array: true }),
          [
            Date.UTC(1980, JAN, 1, 0, 0, 2, 1)
          ])
      })

      it('unixToAtomic', () => {
        assert.strictEqual(millisConverter.unixToAtomic(0),
          0)

        // FORWARD JUMP
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)),
          Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)),
          Date.UTC(1980, JAN, 1, 0, 0, 1, 0))
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)),
          Date.UTC(1980, JAN, 1, 0, 0, 1, 1))

        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)),
          Date.UTC(1980, JAN, 1, 0, 0, 1, 999))
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 1, 0)),
          Date.UTC(1980, JAN, 1, 0, 0, 2, 0))
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 1, 1)),
          Date.UTC(1980, JAN, 1, 0, 0, 2, 1))
      })

      it('atomicToUnix', () => {
        assert.strictEqual(millisConverter.atomicToUnix(0),
          0)

        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)),
          Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)),
          Date.UTC(1980, JAN, 1, 0, 0, 0, 0))
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)),
          Date.UTC(1980, JAN, 1, 0, 0, 0, 1))

        // BACKTRACK
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)),
          Date.UTC(1980, JAN, 1, 0, 0, 0, 999))
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1, 0)),
          Date.UTC(1980, JAN, 1, 0, 0, 0, 0))
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1, 1)),
          Date.UTC(1980, JAN, 1, 0, 0, 0, 1))
      })
    })

    describe('BREAK', () => {
      const millisConverter = new MillisConverter(data, MODELS.BREAK)

      it('unixToAtomic', () => {
        assert.strictEqual(millisConverter.unixToAtomic(0),
          0)

        // FORWARD JUMP
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)),
          Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)),
          Date.UTC(1980, JAN, 1, 0, 0, 1, 0))
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)),
          Date.UTC(1980, JAN, 1, 0, 0, 1, 1))

        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)),
          Date.UTC(1980, JAN, 1, 0, 0, 1, 999))
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 1, 0)),
          Date.UTC(1980, JAN, 1, 0, 0, 2, 0))
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 1, 1)),
          Date.UTC(1980, JAN, 1, 0, 0, 2, 1))
      })

      it('atomicToUnix', () => {
        assert.strictEqual(millisConverter.atomicToUnix(0),
          0)

        // UNDEFINED UNIX TIME STARTS
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)),
          Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)),
          NaN)
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)),
          NaN)

        // UNDEFINED UNIX TIME ENDS
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)),
          NaN)
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1, 0)),
          Date.UTC(1980, JAN, 1, 0, 0, 0, 0))
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1, 1)),
          Date.UTC(1980, JAN, 1, 0, 0, 0, 1))
      })
    })

    describe('STALL', () => {
      const millisConverter = new MillisConverter(data, MODELS.STALL)

      it('unixToAtomic (range mode)', () => {
        assert.deepStrictEqual(millisConverter.unixToAtomic(0, { range: true }),
          [0, 0])

        // STALL POINT
        assert.deepStrictEqual(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999), { range: true }),
          [
            Date.UTC(1979, DEC, 31, 23, 59, 59, 999),
            Date.UTC(1979, DEC, 31, 23, 59, 59, 999)
          ])
        assert.deepStrictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 0), { range: true }),
          [
            Date.UTC(1980, JAN, 1, 0, 0, 0, 0),
            Date.UTC(1980, JAN, 1, 0, 0, 1, 0)
          ])
        assert.deepStrictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 1), { range: true }),
          [
            Date.UTC(1980, JAN, 1, 0, 0, 1, 1),
            Date.UTC(1980, JAN, 1, 0, 0, 1, 1)
          ])
      })

      it('unixToAtomic', () => {
        assert.strictEqual(millisConverter.unixToAtomic(0),
          0)

        // FORWARD JUMP
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)),
          Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)),
          Date.UTC(1980, JAN, 1, 0, 0, 1, 0))
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)),
          Date.UTC(1980, JAN, 1, 0, 0, 1, 1))
      })

      it('atomicToUnix', () => {
        assert.strictEqual(millisConverter.atomicToUnix(0),
          0)

        // STALL STARTS
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)),
          Date.UTC(1979, DEC, 31, 23, 59, 59, 999))
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)),
          Date.UTC(1980, JAN, 1, 0, 0, 0, 0))
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)),
          Date.UTC(1980, JAN, 1, 0, 0, 0, 0))

        // STALL ENDS
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)),
          Date.UTC(1980, JAN, 1, 0, 0, 0, 0))
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1, 0)),
          Date.UTC(1980, JAN, 1, 0, 0, 0, 0))
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 1, 1)),
          Date.UTC(1980, JAN, 1, 0, 0, 0, 1))
      })
    })

    describe('SMEAR', () => {
      const millisConverter = new MillisConverter(data, MODELS.SMEAR)

      it('unixToAtomic', () => {
        assert.strictEqual(millisConverter.unixToAtomic(0),
          0)

        // SMEAR STARTS
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 11, 59, 59, 999)),
          Date.UTC(1979, DEC, 31, 11, 59, 59, 999))
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 12, 0, 0, 0)),
          Date.UTC(1979, DEC, 31, 12, 0, 0, 0))
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 12, 0, 0, 1)),
          Date.UTC(1979, DEC, 31, 12, 0, 0, 1))

        // SMEAR MIDPOINT
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)),
          Date.UTC(1980, JAN, 1, 0, 0, 0, 500))

        // SMEAR ENDS
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 11, 59, 59, 999)),
          Date.UTC(1980, JAN, 1, 12, 0, 0, 998)) // truncated down
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 12, 0, 0, 0)),
          Date.UTC(1980, JAN, 1, 12, 0, 1, 0))
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 12, 0, 0, 1)),
          Date.UTC(1980, JAN, 1, 12, 0, 1, 1))
      })

      it('atomicToUnix', () => {
        assert.strictEqual(millisConverter.atomicToUnix(0),
          0)

        // SMEAR STARTS
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 11, 59, 59, 999)),
          Date.UTC(1979, DEC, 31, 11, 59, 59, 999))
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 12, 0, 0, 0)),
          Date.UTC(1979, DEC, 31, 12, 0, 0, 0))
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 12, 0, 0, 1)),
          Date.UTC(1979, DEC, 31, 12, 0, 0, 0)) // truncated down

        // SMEAR MIDPOINT
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 0, 0, 0, 500)),
          Date.UTC(1980, JAN, 1, 0, 0, 0, 0))

        // SMEAR ENDS
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 12, 0, 0, 999)),
          Date.UTC(1980, JAN, 1, 11, 59, 59, 999))
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 12, 0, 1, 0)),
          Date.UTC(1980, JAN, 1, 12, 0, 0, 0))
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 12, 0, 1, 1)),
          Date.UTC(1980, JAN, 1, 12, 0, 0, 1))
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
        assert.deepStrictEqual(millisConverter.unixToAtomic(0, { array: true }),
          [0])

        // START OF MISSING TIME
        assert.deepStrictEqual(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 58, 999), { array: true }),
          [
            Date.UTC(1979, DEC, 31, 23, 59, 58, 999)
          ])
        assert.deepStrictEqual(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 0), { array: true }),
          [])
        assert.deepStrictEqual(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 1), { array: true }),
          [])

        // END OF MISSING TIME
        assert.deepStrictEqual(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999), { array: true }),
          [])
        assert.deepStrictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 0), { array: true }),
          [
            Date.UTC(1979, DEC, 31, 23, 59, 59, 0)
          ])
        assert.deepStrictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 1), { array: true }),
          [
            Date.UTC(1979, DEC, 31, 23, 59, 59, 1)
          ])
      })

      it('unixToAtomic', () => {
        assert.strictEqual(millisConverter.unixToAtomic(0),
          0)

        // START OF MISSING TIME
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)),
          Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)),
          NaN)
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 1)),
          NaN)

        // END OF MISSING TIME
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)),
          NaN)
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)),
          Date.UTC(1979, DEC, 31, 23, 59, 59, 0))
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)),
          Date.UTC(1979, DEC, 31, 23, 59, 59, 1))
      })

      it('atomicToUnix', () => {
        assert.strictEqual(millisConverter.atomicToUnix(0),
          0)

        // JUMP AHEAD
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)),
          Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)),
          Date.UTC(1980, JAN, 1, 0, 0, 0, 0))
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 1)),
          Date.UTC(1980, JAN, 1, 0, 0, 0, 1))
      })
    })

    describe('BREAK', () => {
      const millisConverter = new MillisConverter(data, MODELS.BREAK)

      it('unixToAtomic', () => {
        assert.strictEqual(millisConverter.unixToAtomic(0),
          0)

        // START OF MISSING TIME
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)),
          Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)),
          NaN)
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 1)),
          NaN)

        // END OF MISSING TIME
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)),
          NaN)
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)),
          Date.UTC(1979, DEC, 31, 23, 59, 59, 0))
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)),
          Date.UTC(1979, DEC, 31, 23, 59, 59, 1))
      })

      it('atomicToUnix', () => {
        assert.strictEqual(millisConverter.atomicToUnix(0),
          0)

        // JUMP AHEAD
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)),
          Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)),
          Date.UTC(1980, JAN, 1, 0, 0, 0, 0))
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 1)),
          Date.UTC(1980, JAN, 1, 0, 0, 0, 1))
      })
    })

    describe('STALL', () => {
      const millisConverter = new MillisConverter(data, MODELS.STALL)

      it('unixToAtomic (range mode)', () => {
        assert.deepStrictEqual(millisConverter.unixToAtomic(0, { range: true }),
          [
            0,
            0
          ])

        // START OF MISSING TIME
        assert.deepStrictEqual(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 58, 999), { range: true }),
          [
            Date.UTC(1979, DEC, 31, 23, 59, 58, 999),
            Date.UTC(1979, DEC, 31, 23, 59, 58, 999)
          ])
        assert.deepStrictEqual(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 0), { range: true }),
          [
            NaN,
            NaN
          ])
        assert.deepStrictEqual(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 1), { range: true }),
          [
            NaN,
            NaN
          ])

        // END OF MISSING TIME
        assert.deepStrictEqual(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999), { range: true }),
          [
            NaN,
            NaN
          ])
        assert.deepStrictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 0), { range: true }),
          [
            Date.UTC(1979, DEC, 31, 23, 59, 59, 0),
            Date.UTC(1979, DEC, 31, 23, 59, 59, 0)
          ])
        assert.deepStrictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 1), { range: true }),
          [
            Date.UTC(1979, DEC, 31, 23, 59, 59, 1),
            Date.UTC(1979, DEC, 31, 23, 59, 59, 1)
          ])
      })

      it('unixToAtomic', () => {
        assert.strictEqual(millisConverter.unixToAtomic(0),
          0)

        // START OF MISSING TIME
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)),
          Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)),
          NaN)
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 1)),
          NaN)

        // END OF MISSING TIME
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)),
          NaN)
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)),
          Date.UTC(1979, DEC, 31, 23, 59, 59, 0))
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)),
          Date.UTC(1979, DEC, 31, 23, 59, 59, 1))
      })

      it('atomicToUnix', () => {
        assert.strictEqual(millisConverter.atomicToUnix(0),
          0)

        // JUMP AHEAD
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)),
          Date.UTC(1979, DEC, 31, 23, 59, 58, 999))
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)),
          Date.UTC(1980, JAN, 1, 0, 0, 0, 0))
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 1)),
          Date.UTC(1980, JAN, 1, 0, 0, 0, 1))
      })
    })

    describe('SMEAR', () => {
      const millisConverter = new MillisConverter(data, MODELS.SMEAR)

      it('unixToAtomic', () => {
        assert.strictEqual(millisConverter.unixToAtomic(0),
          0)

        // START OF SMEAR
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 11, 59, 59, 999)),
          Date.UTC(1979, DEC, 31, 11, 59, 59, 999))
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 12, 0, 0, 0)),
          Date.UTC(1979, DEC, 31, 12, 0, 0, 0))
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1979, DEC, 31, 12, 0, 0, 1)),
          Date.UTC(1979, DEC, 31, 12, 0, 0, 0)) // truncated

        // MIDPOINT OF SMEAR
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)),
          Date.UTC(1979, DEC, 31, 23, 59, 59, 500))

        // END OF SMEAR
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 11, 59, 59, 999)),
          Date.UTC(1980, JAN, 1, 11, 59, 58, 999))
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 12, 0, 0, 0)),
          Date.UTC(1980, JAN, 1, 11, 59, 59, 0))
        assert.strictEqual(millisConverter.unixToAtomic(Date.UTC(1980, JAN, 1, 12, 0, 0, 1)),
          Date.UTC(1980, JAN, 1, 11, 59, 59, 1))
      })

      it('atomicToUnix', () => {
        assert.strictEqual(millisConverter.atomicToUnix(0),
          0)

        // START OF SMEAR
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 11, 59, 59, 999)),
          Date.UTC(1979, DEC, 31, 11, 59, 59, 999))
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 12, 0, 0, 0)),
          Date.UTC(1979, DEC, 31, 12, 0, 0, 0))
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 12, 0, 0, 1)),
          Date.UTC(1979, DEC, 31, 12, 0, 0, 1))

        // MIDPOINT OF SMEAR
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1979, DEC, 31, 23, 59, 59, 500)),
          Date.UTC(1980, JAN, 1, 0, 0, 0, 0))

        // END OF SMEAR
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 11, 59, 59, 999)),
          Date.UTC(1980, JAN, 1, 12, 0, 0, 999))
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 11, 59, 59, 0)),
          Date.UTC(1980, JAN, 1, 12, 0, 0, 0))
        assert.strictEqual(millisConverter.atomicToUnix(Date.UTC(1980, JAN, 1, 11, 59, 59, 1)),
          Date.UTC(1980, JAN, 1, 12, 0, 0, 1))
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

        assert.deepStrictEqual(millisConverter.unixToAtomic(1, { array: true }),
          [0]) // truncated from .9 to 0
        assert.strictEqual(millisConverter.atomicToUnix(0),
          NaN)
      })

      it('at the end of the ray', () => {
        const data = [
          [Date.UTC(1969, DEC, 31, 23, 59, 59, 999), 0.000_1],
          [Date.UTC(1970, JAN, 1, 0, 0, 0, 1), -0.001_1]
        ]
        const millisConverter = new MillisConverter(data, MODELS.OVERRUN)

        assert.deepStrictEqual(millisConverter.unixToAtomic(-1, { array: true }),
          [-1])
        assert.strictEqual(millisConverter.atomicToUnix(-1),
          NaN)
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
          assert.deepStrictEqual(millisConverter.unixToAtomic(0, { array: true }), [0])
          assert.deepStrictEqual(millisConverter.unixToAtomic(999, { array: true }),
            [
              999
            ])
          assert.deepStrictEqual(millisConverter.unixToAtomic(1_000, { array: true }),
            [
              1_000,
              2_000,
              3_000
            ])
          assert.deepStrictEqual(millisConverter.unixToAtomic(1_999, { array: true }),
            [
              1_999,
              2_999,
              3_999
            ])
          assert.deepStrictEqual(millisConverter.unixToAtomic(2_000, { array: true }),
            [
              4_000
            ])
        })

        it('unixToAtomic', () => {
          assert.strictEqual(millisConverter.unixToAtomic(0), 0)
          assert.strictEqual(millisConverter.unixToAtomic(999),
            999)
          assert.strictEqual(millisConverter.unixToAtomic(1_000),
            3_000)
          assert.strictEqual(millisConverter.unixToAtomic(1_999),
            3_999)
          assert.strictEqual(millisConverter.unixToAtomic(2_000),
            4_000)
        })

        it('atomicToUnix', () => {
          assert.strictEqual(millisConverter.atomicToUnix(0), 0)
          assert.strictEqual(millisConverter.atomicToUnix(1_000), 1_000)
          assert.strictEqual(millisConverter.atomicToUnix(1_001), 1_001)
          assert.strictEqual(millisConverter.atomicToUnix(1_999), 1_999)
          assert.strictEqual(millisConverter.atomicToUnix(2_000), 1_000)
          assert.strictEqual(millisConverter.atomicToUnix(2_001), 1_001)
          assert.strictEqual(millisConverter.atomicToUnix(2_999), 1_999)
          assert.strictEqual(millisConverter.atomicToUnix(3_000), 1_000)
          assert.strictEqual(millisConverter.atomicToUnix(3_001), 1_001)
        })
      })

      describe('BREAK', () => {
        const millisConverter = new MillisConverter(data, MODELS.BREAK)

        it('unixToAtomic (range mode)', () => {
          assert.deepStrictEqual(millisConverter.unixToAtomic(0, { range: true }),
            [
              0,
              0
            ])

          // STALL POINT
          assert.deepStrictEqual(millisConverter.unixToAtomic(999, { range: true }),
            [
              999,
              999
            ])
          assert.deepStrictEqual(millisConverter.unixToAtomic(1000, { range: true }),
            [
              3000,
              3000
            ])
          assert.deepStrictEqual(millisConverter.unixToAtomic(1001, { range: true }),
            [
              3001,
              3001
            ])
        })

        it('unixToAtomic', () => {
          assert.strictEqual(millisConverter.unixToAtomic(0),
            0)

          // STALL POINT
          assert.strictEqual(millisConverter.unixToAtomic(999),
            999)
          assert.strictEqual(millisConverter.unixToAtomic(1000),
            3000)
          assert.strictEqual(millisConverter.unixToAtomic(1001),
            3001)
        })

        it('atomicToUnix', () => {
          assert.strictEqual(millisConverter.atomicToUnix(0),
            0)

          // STALL STARTS
          assert.strictEqual(millisConverter.atomicToUnix(999),
            999)
          assert.strictEqual(millisConverter.atomicToUnix(1000),
            NaN)
          assert.strictEqual(millisConverter.atomicToUnix(1001),
            NaN)

          // STALL ENDS
          assert.strictEqual(millisConverter.atomicToUnix(2999),
            NaN)
          assert.deepStrictEqual(millisConverter.atomicToUnix(3000),
            1000)
          assert.deepStrictEqual(millisConverter.atomicToUnix(3001),
            1001)
        })
      })

      describe('STALL', () => {
        const millisConverter = new MillisConverter(data, MODELS.STALL)

        it('unixToAtomic (range mode)', () => {
          assert.deepStrictEqual(millisConverter.unixToAtomic(0, { range: true }),
            [
              0,
              0
            ])

          // STALL POINT
          assert.deepStrictEqual(millisConverter.unixToAtomic(999, { range: true }),
            [
              999,
              999
            ])
          assert.deepStrictEqual(millisConverter.unixToAtomic(1000, { range: true }),
            [
              1000,
              3000
            ])
          assert.deepStrictEqual(millisConverter.unixToAtomic(1001, { range: true }),
            [
              3001,
              3001
            ])
        })

        it('unixToAtomic', () => {
          assert.strictEqual(millisConverter.unixToAtomic(0),
            0)

          // STALL POINT
          assert.strictEqual(millisConverter.unixToAtomic(999),
            999)
          assert.strictEqual(millisConverter.unixToAtomic(1000),
            3000)
          assert.strictEqual(millisConverter.unixToAtomic(1001),
            3001)
        })

        it('atomicToUnix', () => {
          assert.strictEqual(millisConverter.atomicToUnix(0),
            0)

          // STALL STARTS
          assert.strictEqual(millisConverter.atomicToUnix(999),
            999)
          assert.strictEqual(millisConverter.atomicToUnix(1000),
            1000)
          assert.strictEqual(millisConverter.atomicToUnix(1001),
            1000)

          // STALL ENDS
          assert.deepStrictEqual(millisConverter.atomicToUnix(2999),
            1000)
          assert.deepStrictEqual(millisConverter.atomicToUnix(3000),
            1000)
          assert.deepStrictEqual(millisConverter.atomicToUnix(3001),
            1001)
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
          assert.deepStrictEqual(millisConverter.unixToAtomic(0, { array: true }), [0])
          assert.deepStrictEqual(millisConverter.unixToAtomic(999, { array: true }), [999])
          assert.deepStrictEqual(millisConverter.unixToAtomic(1_000, { array: true }), [1_000, 2_000])
          assert.deepStrictEqual(millisConverter.unixToAtomic(1_499, { array: true }), [1_499, 2_499])
          assert.deepStrictEqual(millisConverter.unixToAtomic(1_500, { array: true }), [1_500, 2_500, 3_000])
        })

        it('unixToAtomic', () => {
          assert.strictEqual(millisConverter.unixToAtomic(0), 0)
          assert.strictEqual(millisConverter.unixToAtomic(999), 999)
          assert.strictEqual(millisConverter.unixToAtomic(1_000), 2_000)
          assert.strictEqual(millisConverter.unixToAtomic(1_499), 2_499)
          assert.strictEqual(millisConverter.unixToAtomic(1_500), 3_000)
        })

        it('atomicToUnix', () => {
          assert.strictEqual(millisConverter.atomicToUnix(0), 0)
          assert.strictEqual(millisConverter.atomicToUnix(999), 999)
          assert.strictEqual(millisConverter.atomicToUnix(1_000), 1_000)
          assert.strictEqual(millisConverter.atomicToUnix(1_001), 1_001)
          assert.strictEqual(millisConverter.atomicToUnix(1_999), 1_999)
          assert.strictEqual(millisConverter.atomicToUnix(2_000), 1_000)
          assert.strictEqual(millisConverter.atomicToUnix(2_001), 1_001)
          assert.strictEqual(millisConverter.atomicToUnix(2_499), 1_499)
          assert.strictEqual(millisConverter.atomicToUnix(2_500), 1_500)
          assert.strictEqual(millisConverter.atomicToUnix(2_999), 1_999)
          assert.strictEqual(millisConverter.atomicToUnix(3_000), 1_500)
        })
      })

      describe('BREAK', () => {
        const millisConverter = new MillisConverter(data, MODELS.BREAK)

        it('unixToAtomic', () => {
          assert.strictEqual(millisConverter.unixToAtomic(0), 0)
          assert.strictEqual(millisConverter.unixToAtomic(999), 999)
          assert.strictEqual(millisConverter.unixToAtomic(1_000), 2_000)
          assert.strictEqual(millisConverter.unixToAtomic(1_499), 2_499)
          assert.strictEqual(millisConverter.unixToAtomic(1_500), 3_000)
        })

        it('atomicToUnix', () => {
          assert.strictEqual(millisConverter.atomicToUnix(0), 0)
          assert.strictEqual(millisConverter.atomicToUnix(999), 999)
          assert.strictEqual(millisConverter.atomicToUnix(1_000), NaN)
          assert.strictEqual(millisConverter.atomicToUnix(1_001), NaN)
          assert.strictEqual(millisConverter.atomicToUnix(1_999), NaN)
          assert.strictEqual(millisConverter.atomicToUnix(2_000), 1_000)
          assert.strictEqual(millisConverter.atomicToUnix(2_001), 1_001)
          assert.strictEqual(millisConverter.atomicToUnix(2_499), 1_499)
          assert.strictEqual(millisConverter.atomicToUnix(2_500), NaN)
          assert.strictEqual(millisConverter.atomicToUnix(2_501), NaN)
          assert.strictEqual(millisConverter.atomicToUnix(2_999), NaN)
          assert.strictEqual(millisConverter.atomicToUnix(3_000), 1_500)
        })
      })

      describe('STALL', () => {
        const millisConverter = new MillisConverter(data, MODELS.STALL)

        it('unixToAtomic (range mode)', () => {
          assert.deepStrictEqual(millisConverter.unixToAtomic(0, { range: true }), [0, 0])
          assert.deepStrictEqual(millisConverter.unixToAtomic(999, { range: true }), [999, 999])
          assert.deepStrictEqual(millisConverter.unixToAtomic(1_000, { range: true }), [1_000, 2_000])
          assert.deepStrictEqual(millisConverter.unixToAtomic(1_001, { range: true }), [2_001, 2_001])
          assert.deepStrictEqual(millisConverter.unixToAtomic(1_499, { range: true }), [2_499, 2_499])
          assert.deepStrictEqual(millisConverter.unixToAtomic(1_500, { range: true }), [2_500, 3_000])
          assert.deepStrictEqual(millisConverter.unixToAtomic(1_501, { range: true }), [3_001, 3_001])
        })

        it('unixToAtomic', () => {
          assert.strictEqual(millisConverter.unixToAtomic(0), 0)
          assert.strictEqual(millisConverter.unixToAtomic(999), 999)
          assert.strictEqual(millisConverter.unixToAtomic(1_000), 2_000)
          assert.strictEqual(millisConverter.unixToAtomic(1_001), 2_001)
          assert.strictEqual(millisConverter.unixToAtomic(1_499), 2_499)
          assert.strictEqual(millisConverter.unixToAtomic(1_500), 3_000)
          assert.strictEqual(millisConverter.unixToAtomic(1_501), 3_001)
        })

        it('atomicToUnix', () => {
          assert.strictEqual(millisConverter.atomicToUnix(0), 0)
          assert.strictEqual(millisConverter.atomicToUnix(999), 999)
          assert.strictEqual(millisConverter.atomicToUnix(1_000), 1_000)
          assert.strictEqual(millisConverter.atomicToUnix(1_001), 1_000)
          assert.strictEqual(millisConverter.atomicToUnix(1_999), 1_000)
          assert.strictEqual(millisConverter.atomicToUnix(2_000), 1_000)
          assert.strictEqual(millisConverter.atomicToUnix(2_001), 1_001)
          assert.strictEqual(millisConverter.atomicToUnix(2_499), 1_499)
          assert.strictEqual(millisConverter.atomicToUnix(2_500), 1_500)
          assert.strictEqual(millisConverter.atomicToUnix(2_501), 1_500)
          assert.strictEqual(millisConverter.atomicToUnix(2_999), 1_500)
          assert.strictEqual(millisConverter.atomicToUnix(3_000), 1_500)
          assert.strictEqual(millisConverter.atomicToUnix(3_001), 1_501)
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
          assert.deepStrictEqual(millisConverter.unixToAtomic(0, { array: true }), [0])
          assert.deepStrictEqual(millisConverter.unixToAtomic(499, { array: true }), [499])
          assert.deepStrictEqual(millisConverter.unixToAtomic(500, { array: true }), [500, 3_000])
          assert.deepStrictEqual(millisConverter.unixToAtomic(999, { array: true }), [999, 3_499])
          assert.deepStrictEqual(millisConverter.unixToAtomic(1_000, { array: true }), [1_000, 2_000, 3_500])
          assert.deepStrictEqual(millisConverter.unixToAtomic(1_999, { array: true }), [1_999, 2_999, 4_499])
          assert.deepStrictEqual(millisConverter.unixToAtomic(2_000, { array: true }), [4_500])
        })

        it('unixToAtomic', () => {
          assert.strictEqual(millisConverter.unixToAtomic(0), 0)
          assert.strictEqual(millisConverter.unixToAtomic(499), 499)
          assert.strictEqual(millisConverter.unixToAtomic(500), 3_000)
          assert.strictEqual(millisConverter.unixToAtomic(999), 3_499)
          assert.strictEqual(millisConverter.unixToAtomic(1_000), 3_500)
          assert.strictEqual(millisConverter.unixToAtomic(1_999), 4_499)
          assert.strictEqual(millisConverter.unixToAtomic(2_000), 4_500)
        })

        it('atomicToUnix', () => {
          assert.strictEqual(millisConverter.atomicToUnix(0), 0)
          assert.strictEqual(millisConverter.atomicToUnix(499), 499)
          assert.strictEqual(millisConverter.atomicToUnix(500), 500)
          assert.strictEqual(millisConverter.atomicToUnix(999), 999)
          assert.strictEqual(millisConverter.atomicToUnix(1_000), 1_000)
          assert.strictEqual(millisConverter.atomicToUnix(1_001), 1_001)
          assert.strictEqual(millisConverter.atomicToUnix(1_999), 1_999)
          assert.strictEqual(millisConverter.atomicToUnix(2_000), 1_000)
          assert.strictEqual(millisConverter.atomicToUnix(2_001), 1_001)
          assert.strictEqual(millisConverter.atomicToUnix(2_999), 1_999)
          assert.strictEqual(millisConverter.atomicToUnix(3_000), 500)
          assert.strictEqual(millisConverter.atomicToUnix(3_001), 501)
          assert.strictEqual(millisConverter.atomicToUnix(4_499), 1_999)
          assert.strictEqual(millisConverter.atomicToUnix(4_500), 2_000)
        })
      })

      describe('BREAK', () => {
        it('says no', () => {
          assert.throws(() => new MillisConverter(data, MODELS.BREAK),
            /Segment length must be positive/)
        })
      })

      describe('STALL', () => {
        it('says no', () => {
          assert.throws(() => new MillisConverter(data, MODELS.STALL),
            /Segment length must be positive/)
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
      assert.deepStrictEqual(millisConverter.unixToAtomic(Date.UTC(1963, OCT, 31, 23, 59, 59, 999), { array: true }),
        [
          Date.UTC(1963, NOV, 1, 0, 0, 2, 596)
        ])
      // -194_745_597_404_844_400_013n TAI picoseconds
    })

    it('exactly at the time', () => {
      assert.deepStrictEqual(millisConverter.unixToAtomic(Date.UTC(1963, NOV, 1, 0, 0, 0, 0), { array: true }),
        [
          Date.UTC(1963, NOV, 1, 0, 0, 2, 597),
          Date.UTC(1963, NOV, 1, 0, 0, 2, 697)
        ])
      // assert.deepStrictEqual(millisConverter.unixToAtomicPicos(Date.UTC(1963, NOV, 1, 0, 0, 0, 0)))
    })

    it('then', () => {
      assert.deepStrictEqual(millisConverter.unixToAtomic(Date.UTC(1963, NOV, 1, 0, 0, 0, 1), { array: true }),
        [
          Date.UTC(1963, NOV, 1, 0, 0, 2, 598),
          Date.UTC(1963, NOV, 1, 0, 0, 2, 698)
        ])

      assert.deepStrictEqual(millisConverter.unixToAtomic(Date.UTC(1963, NOV, 1, 0, 0, 0, 99), { array: true }),
        [
          Date.UTC(1963, NOV, 1, 0, 0, 2, 696),
          Date.UTC(1963, NOV, 1, 0, 0, 2, 796) // -194_659_197_203_721_198_713n TAI
        ])

      assert.deepStrictEqual(millisConverter.unixToAtomic(Date.UTC(1963, NOV, 1, 0, 0, 0, 100), { array: true }),
        [
          Date.UTC(1963, NOV, 1, 0, 0, 2, 797)
        ])

      assert.deepStrictEqual(millisConverter.unixToAtomic(Date.UTC(1963, NOV, 1, 0, 0, 0, 101), { array: true }),
        [
          Date.UTC(1963, NOV, 1, 0, 0, 2, 798)
        ])
    })
  })
})

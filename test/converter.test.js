import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { Converter } from '../src/converter.js'
import { MODELS } from '../src/munge.js'
import { Range } from '../src/range.js'
import { Rat } from '../src/rat.js'
import { Second } from '../src/second.js'

const JAN = 0
const DEC = 11

describe('Converter', () => {
  describe('one ray', () => {
    const data = [
      [Date.UTC(1970, JAN, 1), 0]
    ]

    describe('OVERRUN', () => {
      const converter = new Converter(data, MODELS.OVERRUN)

      it('manages basic conversions', () => {
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(0n)),
          [new Range(Second.fromMillis(0n))])
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(0n)),
          Second.fromMillis(0n))
      })
    })

    describe('BREAK', () => {
      const converter = new Converter(data, MODELS.BREAK)

      it('manages basic conversions', () => {
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(0n)),
          [new Range(Second.fromMillis(0n))])
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(0n)),
          Second.fromMillis(0n))
      })
    })

    describe('STALL', () => {
      const converter = new Converter(data, MODELS.STALL)

      it('fails when the atomic count is out of bounds', () => {
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(0n)),
          Second.fromMillis(0n))
        assert.equal(converter.atomicToUnix(Second.fromMillis(-1n)),
          NaN)
      })

      it('fails when the Unix count is out of bounds', () => {
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(0n)),
          [new Range(Second.fromMillis(0n))])
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(-1n)),
          [])
      })

      it('manages basic conversions', () => {
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(0n)), [new Range(Second.fromMillis(0n))])
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(0n)), Second.fromMillis(0n))
      })
    })

    describe('SMEAR', () => {
      const converter = new Converter(data, MODELS.SMEAR)

      it('manages basic conversions', () => {
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(0n)),
          [new Range(Second.fromMillis(0n))])
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(0n)),
          Second.fromMillis(0n))
      })
    })
  })

  describe('inserted leap second', () => {
    const data = [
      [Date.UTC(1970, JAN, 1), 0],
      [Date.UTC(1980, JAN, 1), 1]
    ]

    describe('OVERRUN', () => {
      const converter = new Converter(data, MODELS.OVERRUN)

      it('unixToAtomic', () => {
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(0n)),
          [
            new Range(Second.fromMillis(0n))
          ])

        // BIFURCATION
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))))
          ])
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))),
            new Range(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 1, 0))))
          ])
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)))),
            new Range(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 1, 1))))
          ])

        // COLLAPSE
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))),
            new Range(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 1, 999))))
          ])
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 1, 0)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 2, 0))))
          ])
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 1, 1)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 2, 1))))
          ])
      })

      it('atomicToUnix', () => {
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(0n)),
          Second.fromMillis(0n))

        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))),
          Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))))
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))),
          Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))))
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)))),
          Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 1))))

        // BACKTRACK
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))),
          Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))))
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 1, 0)))),
          Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))))
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 1, 1)))),
          Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 1))))
      })
    })

    describe('BREAK', () => {
      const converter = new Converter(data, MODELS.BREAK)

      it('unixToAtomic', () => {
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(0n)),
          [
            new Range(Second.fromMillis(0n))
          ])

        // FORWARD JUMP
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))))
          ])
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 1, 0))))
          ])
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 1, 1))))
          ])

        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 1, 999))))
          ])
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 1, 0)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 2, 0))))
          ])
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 1, 1)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 2, 1))))
          ])
      })

      it('atomicToUnix', () => {
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(0n)),
          Second.fromMillis(0n))

        // UNDEFINED UNIX TIME STARTS
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))),
          Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))))
        assert.equal(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))),
          NaN)
        assert.equal(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)))),
          NaN)

        // UNDEFINED UNIX TIME ENDS
        assert.equal(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))),
          NaN)
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 1, 0)))),
          Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))))
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 1, 1)))),
          Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 1))))
      })
    })

    describe('STALL', () => {
      const converter = new Converter(data, MODELS.STALL)

      it('unixToAtomic', () => {
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(0n)),
          [
            new Range(Second.fromMillis(0n))
          ])

        // STALL POINT
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))))
          ])
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))),
          [
            new Range(
              Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))),
              Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 1, 0)))
            )
          ])
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 1, 1))))
          ])
      })

      it('atomicToUnix', () => {
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(0n)),
          Second.fromMillis(0n))

        // STALL STARTS
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))),
          Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))))
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))),
          Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))))
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)))),
          Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))))

        // STALL ENDS
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))),
          Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))))
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 1, 0)))),
          Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))))
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 1, 1)))),
          Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 1))))
      })
    })

    describe('SMEAR', () => {
      const converter = new Converter(data, MODELS.SMEAR)

      it('unixToAtomic', () => {
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(0n)),
          [
            new Range(Second.fromMillis(0n))
          ])

        // SMEAR STARTS, ATOMIC TIME "RUNS A LITTLE FASTER" THAN UNIX (actually Unix is slower)
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 11, 59, 59, 999)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 11, 59, 59, 999))))
          ])
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 12, 0, 0, 0)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 12, 0, 0, 0))))
          ])
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 12, 0, 0, 1)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 12, 0, 0, 1))).plusS(new Second(new Rat(1n, 86_400_000n))))
          ])

        // SMEAR MIDPOINT
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 500))))
          ])

        // SMEAR ENDS, ATOMIC IS A FULL SECOND AHEAD (actually Unix is a full second behind)
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 11, 59, 59, 999)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 11, 59, 59, 999))).plusS(new Second(new Rat(86_399_999n, 86_400_000n))))
          ])
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 12, 0, 0, 0)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 12, 0, 1, 0))))
          ])
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 12, 0, 0, 1)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 12, 0, 1, 1))))
          ])
      })

      it('atomicToUnix', () => {
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(0n)),
          Second.fromMillis(0n))

        // SMEAR STARTS, UNIX TIME RUNS A LITTLE SLOWER THAN ATOMIC
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 11, 59, 59, 999)))),
          Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 11, 59, 59, 999))))
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 12, 0, 0, 0)))),
          Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 12, 0, 0, 0))))
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 12, 0, 0, 1)))),
          Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 12, 0, 0, 1))).minusS(new Second(new Rat(1n, 86_401_000n))))

        // SMEAR MIDPOINT
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 500)))),
          Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))))

        // SMEAR ENDS, UNIX HAS DROPPED A FULL SECOND BEHIND
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 12, 0, 0, 999)))),
          Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 12, 0, 0, 999))).minusS(new Second(new Rat(86_400_999n, 86_401_000n))))
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 12, 0, 1, 0)))),
          Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 12, 0, 0, 0))))
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 12, 0, 1, 1)))),
          Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 12, 0, 0, 1))))
      })
    })
  })

  describe('removed leap second', () => {
    const data = [
      [Date.UTC(1970, JAN, 1), 0],
      [Date.UTC(1980, JAN, 1), -1]
    ]

    describe('OVERRUN', () => {
      const converter = new Converter(data, MODELS.OVERRUN)

      it('unixToAtomic', () => {
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(0n)),
          [
            new Range(Second.fromMillis(0n))
          ])

        // START OF MISSING TIME
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))))
          ])
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))),
          [])
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 1)))),
          [])

        // END OF MISSING TIME
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))),
          [])
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 0))))
          ])
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 1))))
          ])
      })

      it('atomicToUnix', () => {
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(0n)),
          Second.fromMillis(0n))

        // JUMP AHEAD
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))),
          Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))))
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))),
          Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))))
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 1)))),
          Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 1))))
      })
    })

    describe('BREAK', () => {
      const converter = new Converter(data, MODELS.BREAK)

      it('unixToAtomic', () => {
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(0n)),
          [
            new Range(Second.fromMillis(0n))
          ])

        // START OF MISSING TIME
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))))
          ])
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))),
          [])
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 1)))),
          [])

        // END OF MISSING TIME
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))),
          [])
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 0))))
          ])
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 1))))
          ])
      })

      it('atomicToUnix', () => {
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(0n)),
          Second.fromMillis(0n))

        // JUMP AHEAD
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))),
          Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))))
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))),
          Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))))
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 1)))),
          Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 1))))
      })
    })

    describe('STALL', () => {
      const converter = new Converter(data, MODELS.STALL)

      it('unixToAtomic', () => {
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(0n)),
          [
            new Range(Second.fromMillis(0n))
          ])

        // START OF MISSING TIME
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))))
          ])
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))),
          [])
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 1)))),
          [])

        // END OF MISSING TIME
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))),
          [])
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 0))))
          ])
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 1))))
          ])
      })

      it('atomicToUnix', () => {
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(0n)),
          Second.fromMillis(0n))

        // JUMP AHEAD
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))),
          Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))))
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))),
          Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))))
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 1)))),
          Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 1))))
      })
    })

    describe('SMEAR', () => {
      const converter = new Converter(data, MODELS.SMEAR)

      it('unixToAtomic', () => {
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(0n)),
          [
            new Range(Second.fromMillis(0n))
          ])

        // SMEAR STARTS, ATOMIC "RUNS A LITTLE SLOWER" THAN UNIX (actually Unix runs faster)
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 11, 59, 59, 999)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 11, 59, 59, 999))))
          ])
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 12, 0, 0, 0)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 12, 0, 0, 0))))
          ])
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 12, 0, 0, 1)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 12, 0, 0, 1))).minusS(new Second(new Rat(1n, 86_400_000n))))
          ])

        // SMEAR MIDPOINT
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 500))))
          ])

        // SMEAR ENDS, ATOMIC IS A FULL SECOND BEHIND (actually Unix is a full second ahead)
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 11, 59, 59, 999)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 11, 59, 59, 999))).minusS(new Second(new Rat(86_399_999n, 86_400_000n))))
          ])
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 12, 0, 0, 0)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 11, 59, 59, 0))))
          ])
        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 12, 0, 0, 1)))),
          [
            new Range(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 11, 59, 59, 1))))
          ])
      })

      it('atomicToUnix', () => {
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(0n)),
          Second.fromMillis(0n))

        // SMEAR STARTS, UNIX TIME RUNS A LITTLE FASTER THAN ATOMIC
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 11, 59, 59, 999)))),
          Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 11, 59, 59, 999))))
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 12, 0, 0, 0)))),
          Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 12, 0, 0, 0))))
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 12, 0, 0, 1)))),
          Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 12, 0, 0, 1))).plusS(new Second(new Rat(1n, 86_399_000n))))

        // SMEAR MIDPOINT
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1979, DEC, 31, 23, 59, 59, 500)))),
          Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))))

        // SMEAR ENDS, UNIX HAS RUN A FULL SECOND FASTER THAN ATOMIC
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 11, 59, 58, 999)))),
          Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 11, 59, 58, 999))).plusS(new Second(new Rat(86_398_999n, 86_399_000n))))
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 11, 59, 59, 0)))),
          Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 12, 0, 0, 0))))
        assert.deepEqual(converter.atomicToUnix(Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 11, 59, 59, 1)))),
          Second.fromMillis(BigInt(Date.UTC(1980, JAN, 1, 12, 0, 0, 1))))
      })
    })
  })

  describe('insane edge cases', () => {
    describe('precise round trips work but milliseconds do not', () => {
      it('at the start of the ray', () => {
        const data = [
          [Date.UTC(1970, JAN, 1, 0, 0, 0, 1), -0.000_1]
        ]
        const converter = new Converter(data, MODELS.OVERRUN)

        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(1n)),
          [
            new Range(new Second(new Rat(900n, 1_000_000n)))
          ])
        assert.deepEqual(converter.atomicToUnix(new Second(new Rat(900n, 1_000_000n))),
          Second.fromMillis(1n))
      })

      it('at the end of the ray', () => {
        const data = [
          [Date.UTC(1969, DEC, 31, 23, 59, 59, 999), 0.000_1],
          [Date.UTC(1970, JAN, 1, 0, 0, 0, 1), -0.001_1]
        ]
        const converter = new Converter(data, MODELS.OVERRUN)

        assert.deepEqual(converter.unixToAtomic(Second.fromMillis(-1n)),
          [
            new Range(new Second(new Rat(-900n, 1_000_000n)))
          ])
        assert.deepEqual(converter.atomicToUnix(new Second(new Rat(-900n, 1_000_000n))),
          Second.fromMillis(-1n))
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

      describe('BREAK', () => {
        const converter = new Converter(data, MODELS.BREAK)

        it('unixToAtomic', () => {
          assert.deepEqual(converter.unixToAtomic(Second.fromMillis(0n)),
            [
              new Range(Second.fromMillis(0n))
            ])

          // STALL POINT
          assert.deepEqual(converter.unixToAtomic(Second.fromMillis(999n)),
            [
              new Range(Second.fromMillis(999n))
            ])
          assert.deepEqual(converter.unixToAtomic(Second.fromMillis(1000n)),
            [
              new Range(Second.fromMillis(3000n))
            ])
          assert.deepEqual(converter.unixToAtomic(Second.fromMillis(1001n)),
            [
              new Range(Second.fromMillis(3001n))
            ])
        })

        it('atomicToUnix', () => {
          assert.deepEqual(converter.atomicToUnix(Second.fromMillis(0n)),
            Second.fromMillis(0n))

          // STALL STARTS
          assert.deepEqual(converter.atomicToUnix(Second.fromMillis(999n)),
            Second.fromMillis(999n))
          assert.equal(converter.atomicToUnix(Second.fromMillis(1000n)),
            NaN)
          assert.equal(converter.atomicToUnix(Second.fromMillis(1001n)),
            NaN)

          // STALL ENDS
          assert.equal(converter.atomicToUnix(Second.fromMillis(2999n)),
            NaN)
          assert.deepEqual(converter.atomicToUnix(Second.fromMillis(3000n)),
            Second.fromMillis(1000n))
          assert.deepEqual(converter.atomicToUnix(Second.fromMillis(3001n)),
            Second.fromMillis(1001n))
        })
      })

      describe('STALL', () => {
        const converter = new Converter(data, MODELS.STALL)

        it('unixToAtomic', () => {
          assert.deepEqual(converter.unixToAtomic(Second.fromMillis(0n)),
            [
              new Range(Second.fromMillis(0n))
            ])

          // STALL POINT
          assert.deepEqual(converter.unixToAtomic(Second.fromMillis(999n)),
            [
              new Range(Second.fromMillis(999n))
            ])
          assert.deepEqual(converter.unixToAtomic(Second.fromMillis(1000n)),
            [
              new Range(Second.fromMillis(1000n), Second.fromMillis(3000n))
            ])
          assert.deepEqual(converter.unixToAtomic(Second.fromMillis(1001n)),
            [
              new Range(Second.fromMillis(3001n))
            ])
        })

        it('atomicToUnix', () => {
          assert.deepEqual(converter.atomicToUnix(Second.fromMillis(0n)),
            Second.fromMillis(0n))

          // STALL STARTS
          assert.deepEqual(converter.atomicToUnix(Second.fromMillis(999n)),
            Second.fromMillis(999n))
          assert.deepEqual(converter.atomicToUnix(Second.fromMillis(1000n)),
            Second.fromMillis(1000n))
          assert.deepEqual(converter.atomicToUnix(Second.fromMillis(1001n)),
            Second.fromMillis(1000n))

          // STALL ENDS
          assert.deepEqual(converter.atomicToUnix(Second.fromMillis(2999n)),
            Second.fromMillis(1000n))
          assert.deepEqual(converter.atomicToUnix(Second.fromMillis(3000n)),
            Second.fromMillis(1000n))
          assert.deepEqual(converter.atomicToUnix(Second.fromMillis(3001n)),
            Second.fromMillis(1001n))
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

      describe('BREAK', () => {
        it('says no', () => {
          assert.throws(() => new Converter(data, MODELS.BREAK),
            /segment length must be positive/)
        })
      })

      describe('STALL', () => {
        it('says no', () => {
          assert.throws(() => new Converter(data, MODELS.STALL),
            /segment length must be positive/)
        })
      })
    })
  })
})

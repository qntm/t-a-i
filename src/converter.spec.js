/* eslint-env jest */

const { MODELS } = require('./munge.js')
const { Converter } = require('./converter.js')
const { Rat } = require('./rat.js')
const { Range } = require('./range.js')

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
        expect(converter.unixToAtomic(Rat.fromMillis(0)))
          .toEqual([new Range(Rat.fromMillis(0))])
        expect(converter.atomicToUnix(Rat.fromMillis(0)))
          .toEqual(Rat.fromMillis(0))
      })
    })

    describe('BREAK', () => {
      const converter = new Converter(data, MODELS.BREAK)

      it('manages basic conversions', () => {
        expect(converter.unixToAtomic(Rat.fromMillis(0)))
          .toEqual([new Range(Rat.fromMillis(0))])
        expect(converter.atomicToUnix(Rat.fromMillis(0)))
          .toEqual(Rat.fromMillis(0))
      })
    })

    describe('STALL', () => {
      const converter = new Converter(data, MODELS.STALL)

      it('fails when the atomic count is out of bounds', () => {
        expect(converter.atomicToUnix(Rat.fromMillis(0)))
          .toEqual(Rat.fromMillis(0))
        expect(converter.atomicToUnix(Rat.fromMillis(-1)))
          .toBe(NaN)
      })

      it('fails when the Unix count is out of bounds', () => {
        expect(converter.unixToAtomic(Rat.fromMillis(0)))
          .toEqual([new Range(Rat.fromMillis(0))])
        expect(converter.unixToAtomic(Rat.fromMillis(-1)))
          .toEqual([])
      })

      it('manages basic conversions', () => {
        expect(converter.unixToAtomic(Rat.fromMillis(0))).toEqual([new Range(Rat.fromMillis(0))])
        expect(converter.atomicToUnix(Rat.fromMillis(0))).toEqual(Rat.fromMillis(0))
      })
    })

    describe('SMEAR', () => {
      const converter = new Converter(data, MODELS.SMEAR)

      it('manages basic conversions', () => {
        expect(converter.unixToAtomic(Rat.fromMillis(0)))
          .toEqual([new Range(Rat.fromMillis(0))])
        expect(converter.atomicToUnix(Rat.fromMillis(0)))
          .toEqual(Rat.fromMillis(0))
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
        expect(converter.unixToAtomic(Rat.fromMillis(0)))
          .toEqual([
            new Range(Rat.fromMillis(0))
          ])

        // BIFURCATION
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
          ])
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))),
            new Range(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 1, 0)))
          ])
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 1))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 1))),
            new Range(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 1, 1)))
          ])

        // COLLAPSE
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))),
            new Range(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 1, 999)))
          ])
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 1, 0))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 2, 0)))
          ])
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 1, 1))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 2, 1)))
          ])
      })

      it('atomicToUnix', () => {
        expect(converter.atomicToUnix(Rat.fromMillis(0)))
          .toEqual(Rat.fromMillis(0))

        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))))
          .toEqual(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))))
          .toEqual(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 1))))
          .toEqual(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)))

        // BACKTRACK
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))))
          .toEqual(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 999)))
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 1, 0))))
          .toEqual(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 1, 1))))
          .toEqual(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)))
      })
    })

    describe('BREAK', () => {
      const converter = new Converter(data, MODELS.BREAK)

      it('unixToAtomic', () => {
        expect(converter.unixToAtomic(Rat.fromMillis(0)))
          .toEqual([
            new Range(Rat.fromMillis(0))
          ])

        // FORWARD JUMP
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
          ])
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 1, 0)))
          ])
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 1))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 1, 1)))
          ])

        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 1, 999)))
          ])
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 1, 0))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 2, 0)))
          ])
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 1, 1))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 2, 1)))
          ])
      })

      it('atomicToUnix', () => {
        expect(converter.atomicToUnix(Rat.fromMillis(0)))
          .toEqual(Rat.fromMillis(0))

        // UNDEFINED UNIX TIME STARTS
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))))
          .toEqual(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))))
          .toBe(NaN)
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 1))))
          .toBe(NaN)

        // UNDEFINED UNIX TIME ENDS
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))))
          .toBe(NaN)
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 1, 0))))
          .toEqual(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 1, 1))))
          .toEqual(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)))
      })
    })

    describe('STALL', () => {
      const converter = new Converter(data, MODELS.STALL)

      it('unixToAtomic', () => {
        expect(converter.unixToAtomic(Rat.fromMillis(0)))
          .toEqual([
            new Range(Rat.fromMillis(0))
          ])

        // STALL POINT
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
          ])
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))))
          .toEqual([
            new Range(
              Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)),
              Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 1, 0))
            )
          ])
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 1))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 1, 1)))
          ])
      })

      it('atomicToUnix', () => {
        expect(converter.atomicToUnix(Rat.fromMillis(0)))
          .toEqual(Rat.fromMillis(0))

        // STALL STARTS
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))))
          .toEqual(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999)))
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))))
          .toEqual(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 1))))
          .toEqual(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))

        // STALL ENDS
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 999))))
          .toEqual(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 1, 0))))
          .toEqual(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 1, 1))))
          .toEqual(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)))
      })
    })

    describe('SMEAR', () => {
      const converter = new Converter(data, MODELS.SMEAR)

      it('unixToAtomic', () => {
        expect(converter.unixToAtomic(Rat.fromMillis(0)))
          .toEqual([
            new Range(Rat.fromMillis(0))
          ])

        // SMEAR STARTS, ATOMIC TIME "RUNS A LITTLE FASTER" THAN UNIX (actually Unix is slower)
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1979, DEC, 31, 11, 59, 59, 999))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1979, DEC, 31, 11, 59, 59, 999)))
          ])
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1979, DEC, 31, 12, 0, 0, 0))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1979, DEC, 31, 12, 0, 0, 0)))
          ])
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1979, DEC, 31, 12, 0, 0, 1))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1979, DEC, 31, 12, 0, 0, 1)).plus(new Rat(1n, 86_400_000n)))
          ])

        // SMEAR MIDPOINT
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 500)))
          ])

        // SMEAR ENDS, ATOMIC IS A FULL SECOND AHEAD (actually Unix is a full second behind)
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1980, JAN, 1, 11, 59, 59, 999))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1980, JAN, 1, 11, 59, 59, 999)).plus(new Rat(86_399_999n, 86_400_000n)))
          ])
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1980, JAN, 1, 12, 0, 0, 0))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1980, JAN, 1, 12, 0, 1, 0)))
          ])
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1980, JAN, 1, 12, 0, 0, 1))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1980, JAN, 1, 12, 0, 1, 1)))
          ])
      })

      it('atomicToUnix', () => {
        expect(converter.atomicToUnix(Rat.fromMillis(0)))
          .toEqual(Rat.fromMillis(0))

        // SMEAR STARTS, UNIX TIME RUNS A LITTLE SLOWER THAN ATOMIC
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1979, DEC, 31, 11, 59, 59, 999))))
          .toEqual(Rat.fromMillis(Date.UTC(1979, DEC, 31, 11, 59, 59, 999)))
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1979, DEC, 31, 12, 0, 0, 0))))
          .toEqual(Rat.fromMillis(Date.UTC(1979, DEC, 31, 12, 0, 0, 0)))
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1979, DEC, 31, 12, 0, 0, 1))))
          .toEqual(Rat.fromMillis(Date.UTC(1979, DEC, 31, 12, 0, 0, 1)).minus(new Rat(1n, 86_401_000n)))

        // SMEAR MIDPOINT
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 500))))
          .toEqual(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))

        // SMEAR ENDS, UNIX HAS DROPPED A FULL SECOND BEHIND
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1980, JAN, 1, 12, 0, 0, 999))))
          .toEqual(Rat.fromMillis(Date.UTC(1980, JAN, 1, 12, 0, 0, 999)).minus(new Rat(86_400_999n, 86_401_000n)))
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1980, JAN, 1, 12, 0, 1, 0))))
          .toEqual(Rat.fromMillis(Date.UTC(1980, JAN, 1, 12, 0, 0, 0)))
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1980, JAN, 1, 12, 0, 1, 1))))
          .toEqual(Rat.fromMillis(Date.UTC(1980, JAN, 1, 12, 0, 0, 1)))
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
        expect(converter.unixToAtomic(Rat.fromMillis(0)))
          .toEqual([
            new Range(Rat.fromMillis(0))
          ])

        // START OF MISSING TIME
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
          ])
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 0))))
          .toEqual([])
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 1))))
          .toEqual([])

        // END OF MISSING TIME
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))))
          .toEqual([])
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
          ])
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 1))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 1)))
          ])
      })

      it('atomicToUnix', () => {
        expect(converter.atomicToUnix(Rat.fromMillis(0)))
          .toEqual(Rat.fromMillis(0))

        // JUMP AHEAD
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))))
          .toEqual(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 0))))
          .toEqual(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 1))))
          .toEqual(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)))
      })
    })

    describe('BREAK', () => {
      const converter = new Converter(data, MODELS.BREAK)

      it('unixToAtomic', () => {
        expect(converter.unixToAtomic(Rat.fromMillis(0)))
          .toEqual([
            new Range(Rat.fromMillis(0))
          ])

        // START OF MISSING TIME
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
          ])
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 0))))
          .toEqual([])
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 1))))
          .toEqual([])

        // END OF MISSING TIME
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))))
          .toEqual([])
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
          ])
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 1))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 1)))
          ])
      })

      it('atomicToUnix', () => {
        expect(converter.atomicToUnix(Rat.fromMillis(0)))
          .toEqual(Rat.fromMillis(0))

        // JUMP AHEAD
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))))
          .toEqual(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 0))))
          .toEqual(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 1))))
          .toEqual(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)))
      })
    })

    describe('STALL', () => {
      const converter = new Converter(data, MODELS.STALL)

      it('unixToAtomic', () => {
        expect(converter.unixToAtomic(Rat.fromMillis(0)))
          .toEqual([
            new Range(Rat.fromMillis(0))
          ])

        // START OF MISSING TIME
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
          ])
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 0))))
          .toEqual([])
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 1))))
          .toEqual([])

        // END OF MISSING TIME
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 999))))
          .toEqual([])
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 0)))
          ])
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 1))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 1)))
          ])
      })

      it('atomicToUnix', () => {
        expect(converter.atomicToUnix(Rat.fromMillis(0)))
          .toEqual(Rat.fromMillis(0))

        // JUMP AHEAD
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 58, 999))))
          .toEqual(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 58, 999)))
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 0))))
          .toEqual(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 1))))
          .toEqual(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 1)))
      })
    })

    describe('SMEAR', () => {
      const converter = new Converter(data, MODELS.SMEAR)

      it('unixToAtomic', () => {
        expect(converter.unixToAtomic(Rat.fromMillis(0)))
          .toEqual([
            new Range(Rat.fromMillis(0))
          ])

        // SMEAR STARTS, ATOMIC "RUNS A LITTLE SLOWER" THAN UNIX (actually Unix runs faster)
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1979, DEC, 31, 11, 59, 59, 999))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1979, DEC, 31, 11, 59, 59, 999)))
          ])
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1979, DEC, 31, 12, 0, 0, 0))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1979, DEC, 31, 12, 0, 0, 0)))
          ])
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1979, DEC, 31, 12, 0, 0, 1))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1979, DEC, 31, 12, 0, 0, 1)).minus(new Rat(1n, 86_400_000n)))
          ])

        // SMEAR MIDPOINT
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 0))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 500)))
          ])

        // SMEAR ENDS, ATOMIC IS A FULL SECOND BEHIND (actually Unix is a full second ahead)
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1980, JAN, 1, 11, 59, 59, 999))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1980, JAN, 1, 11, 59, 59, 999)).minus(new Rat(86_399_999n, 86_400_000n)))
          ])
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1980, JAN, 1, 12, 0, 0, 0))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1980, JAN, 1, 11, 59, 59, 0)))
          ])
        expect(converter.unixToAtomic(Rat.fromMillis(Date.UTC(1980, JAN, 1, 12, 0, 0, 1))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1980, JAN, 1, 11, 59, 59, 1)))
          ])
      })

      it('atomicToUnix', () => {
        expect(converter.atomicToUnix(Rat.fromMillis(0)))
          .toEqual(Rat.fromMillis(0))

        // SMEAR STARTS, UNIX TIME RUNS A LITTLE FASTER THAN ATOMIC
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1979, DEC, 31, 11, 59, 59, 999))))
          .toEqual(Rat.fromMillis(Date.UTC(1979, DEC, 31, 11, 59, 59, 999)))
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1979, DEC, 31, 12, 0, 0, 0))))
          .toEqual(Rat.fromMillis(Date.UTC(1979, DEC, 31, 12, 0, 0, 0)))
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1979, DEC, 31, 12, 0, 0, 1))))
          .toEqual(Rat.fromMillis(Date.UTC(1979, DEC, 31, 12, 0, 0, 1)).plus(new Rat(1n, 86_399_000n)))

        // SMEAR MIDPOINT
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1979, DEC, 31, 23, 59, 59, 500))))
          .toEqual(Rat.fromMillis(Date.UTC(1980, JAN, 1, 0, 0, 0, 0)))

        // SMEAR ENDS, UNIX HAS RUN A FULL SECOND FASTER THAN ATOMIC
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1980, JAN, 1, 11, 59, 58, 999))))
          .toEqual(Rat.fromMillis(Date.UTC(1980, JAN, 1, 11, 59, 58, 999)).plus(new Rat(86_398_999n, 86_399_000n)))
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1980, JAN, 1, 11, 59, 59, 0))))
          .toEqual(Rat.fromMillis(Date.UTC(1980, JAN, 1, 12, 0, 0, 0)))
        expect(converter.atomicToUnix(Rat.fromMillis(Date.UTC(1980, JAN, 1, 11, 59, 59, 1))))
          .toEqual(Rat.fromMillis(Date.UTC(1980, JAN, 1, 12, 0, 0, 1)))
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

        expect(converter.unixToAtomic(Rat.fromMillis(1)))
          .toEqual([
            new Range(new Rat(900n, 1_000_000n))
          ])
        expect(converter.atomicToUnix(new Rat(900n, 1_000_000n)))
          .toEqual(Rat.fromMillis(1))
      })

      it('at the end of the ray', () => {
        const data = [
          [Date.UTC(1969, DEC, 31, 23, 59, 59, 999), 0.000_1],
          [Date.UTC(1970, JAN, 1, 0, 0, 0, 1), -0.001_1]
        ]
        const converter = new Converter(data, MODELS.OVERRUN)

        expect(converter.unixToAtomic(Rat.fromMillis(-1)))
          .toEqual([
            new Range(new Rat(-900n, 1_000_000n))
          ])
        expect(converter.atomicToUnix(new Rat(-900n, 1_000_000n)))
          .toEqual(Rat.fromMillis(-1))
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
          expect(converter.unixToAtomic(Rat.fromMillis(0)))
            .toEqual([
              new Range(Rat.fromMillis(0))
            ])

          // STALL POINT
          expect(converter.unixToAtomic(Rat.fromMillis(999)))
            .toEqual([
              new Range(Rat.fromMillis(999))
            ])
          expect(converter.unixToAtomic(Rat.fromMillis(1000)))
            .toEqual([
              new Range(Rat.fromMillis(3000))
            ])
          expect(converter.unixToAtomic(Rat.fromMillis(1001)))
            .toEqual([
              new Range(Rat.fromMillis(3001))
            ])
        })

        it('atomicToUnix', () => {
          expect(converter.atomicToUnix(Rat.fromMillis(0)))
            .toEqual(Rat.fromMillis(0))

          // STALL STARTS
          expect(converter.atomicToUnix(Rat.fromMillis(999)))
            .toEqual(Rat.fromMillis(999))
          expect(converter.atomicToUnix(Rat.fromMillis(1000)))
            .toBe(NaN)
          expect(converter.atomicToUnix(Rat.fromMillis(1001)))
            .toBe(NaN)

          // STALL ENDS
          expect(converter.atomicToUnix(Rat.fromMillis(2999)))
            .toBe(NaN)
          expect(converter.atomicToUnix(Rat.fromMillis(3000)))
            .toEqual(Rat.fromMillis(1000))
          expect(converter.atomicToUnix(Rat.fromMillis(3001)))
            .toEqual(Rat.fromMillis(1001))
        })
      })

      describe('STALL', () => {
        const converter = new Converter(data, MODELS.STALL)

        it('unixToAtomic', () => {
          expect(converter.unixToAtomic(Rat.fromMillis(0)))
            .toEqual([
              new Range(Rat.fromMillis(0))
            ])

          // STALL POINT
          expect(converter.unixToAtomic(Rat.fromMillis(999)))
            .toEqual([
              new Range(Rat.fromMillis(999))
            ])
          expect(converter.unixToAtomic(Rat.fromMillis(1000)))
            .toEqual([
              new Range(Rat.fromMillis(1000), Rat.fromMillis(3000))
            ])
          expect(converter.unixToAtomic(Rat.fromMillis(1001)))
            .toEqual([
              new Range(Rat.fromMillis(3001))
            ])
        })

        it('atomicToUnix', () => {
          expect(converter.atomicToUnix(Rat.fromMillis(0)))
            .toEqual(Rat.fromMillis(0))

          // STALL STARTS
          expect(converter.atomicToUnix(Rat.fromMillis(999)))
            .toEqual(Rat.fromMillis(999))
          expect(converter.atomicToUnix(Rat.fromMillis(1000)))
            .toEqual(Rat.fromMillis(1000))
          expect(converter.atomicToUnix(Rat.fromMillis(1001)))
            .toEqual(Rat.fromMillis(1000))

          // STALL ENDS
          expect(converter.atomicToUnix(Rat.fromMillis(2999)))
            .toEqual(Rat.fromMillis(1000))
          expect(converter.atomicToUnix(Rat.fromMillis(3000)))
            .toEqual(Rat.fromMillis(1000))
          expect(converter.atomicToUnix(Rat.fromMillis(3001)))
            .toEqual(Rat.fromMillis(1001))
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
          expect(() => new Converter(data, MODELS.BREAK))
            .toThrowError('Segment length must be positive')
        })
      })

      describe('STALL', () => {
        it('says no', () => {
          expect(() => new Converter(data, MODELS.STALL))
            .toThrowError('Segment length must be positive')
        })
      })
    })
  })
})

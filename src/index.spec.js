/* eslint-env jest */

const { TaiConverter, MODELS } = require('.')

const JAN = 0
const FEB = 1
const MAR = 2
const APR = 3
const JUL = 6
const AUG = 7
const SEP = 8
const OCT = 9
const DEC = 11

describe('TaiConverter', () => {
  describe('OVERRUN', () => {
    const converter = TaiConverter(MODELS.OVERRUN)

    describe('unixToAtomic (array mode)', () => {
      const unixToAtomic = unixMillis => converter.unixToAtomic(unixMillis, { array: true })

      it('starts TAI at 1961-01-01 00:00:01.422_818', () => {
        // 00:00:01.422_818 is in range, but rounds down to 00:00:01.422 which is not
        expect(unixToAtomic(Date.UTC(1961, JAN, 1, 0, 0, 0, 0)))
          .toEqual([-283_996_798_578])
      })

      it('advances 15 TAI picoseconds per Unix millisecond', () => {
        expect(unixToAtomic(Date.UTC(1961, JAN, 1, 0, 0, 0, 1)))
          .toEqual([Date.UTC(1961, JAN, 1, 0, 0, 1, 423)])
        expect(unixToAtomic(Date.UTC(1961, JAN, 1, 0, 0, 0, 2)))
          .toEqual([Date.UTC(1961, JAN, 1, 0, 0, 1, 424)])
        expect(unixToAtomic(Date.UTC(1961, JAN, 1, 0, 0, 0, 3)))
          .toEqual([Date.UTC(1961, JAN, 1, 0, 0, 1, 425)])
      })

      it('advances 0.001_296 TAI seconds per Unix day', () => {
        expect(unixToAtomic(Date.UTC(1961, JAN, 2, 0, 0, 0, 0)))
          .toEqual([Date.UTC(1961, JAN, 2, 0, 0, 1, 424)])
        // It's 1.424_114 but gets rounded down to 1.424_000
      })

      it('makes certain TAI millisecond counts inaccessible', () => {
        expect(unixToAtomic(-283984666668))
          .toEqual([-283984665246]) // -283984665245.000000020 rounded towards negative infinity
        expect(unixToAtomic(-283984666667))
          .toEqual([-283984665245]) // -283984665244.000000005 rounded towards negative infinity

        // it's not possible to get a result of [-283984665244.xxxxxxxxxn]

        expect(unixToAtomic(-283984666666))
          .toEqual([-283984665243]) // -283984665242.999999990 rounded towards negative infinity
        expect(unixToAtomic(-283984666665))
          .toEqual([-283984665242]) // -283984665241.999999975 rounded towards negative infinity
      })
    })

    describe('unixToAtomic', () => {
      const unixToAtomic = converter.unixToAtomic

      it('starts TAI at 1961-01-01 00:00:01.422818', () => {
        // 00:00:01.422818 is in range, but rounds down to 00:00:01.422 which is not
        expect(unixToAtomic(Date.UTC(1961, JAN, 1, 0, 0, 0, 0)))
          .toBe(-283_996_798_578)
      })

      it('advances 15 TAI picoseconds per Unix millisecond', () => {
        expect(unixToAtomic(Date.UTC(1961, JAN, 1, 0, 0, 0, 1)))
          .toBe(Date.UTC(1961, JAN, 1, 0, 0, 1, 423))
        expect(unixToAtomic(Date.UTC(1961, JAN, 1, 0, 0, 0, 2)))
          .toBe(Date.UTC(1961, JAN, 1, 0, 0, 1, 424))
        expect(unixToAtomic(Date.UTC(1961, JAN, 1, 0, 0, 0, 3)))
          .toBe(Date.UTC(1961, JAN, 1, 0, 0, 1, 425))
      })

      it('advances 0.001296 TAI seconds per Unix day', () => {
        expect(unixToAtomic(Date.UTC(1961, JAN, 2, 0, 0, 0, 0)))
          .toBe(Date.UTC(1961, JAN, 2, 0, 0, 1, 424))
        // It's 1.424114 but gets rounded down to 1.424000
      })

      it('makes certain TAI millisecond counts inaccessible', () => {
        expect(unixToAtomic(-283984666668))
          .toBe(-283984665246) // -283984665245.000000020 rounded towards negative infinity
        expect(unixToAtomic(-283984666667))
          .toBe(-283984665245) // -283984665244.000000005 rounded towards negative infinity

        // it's not possible to get a result of -283984665244.xxxxxxxxxn

        expect(unixToAtomic(-283984666666))
          .toBe(-283984665243) // -283984665242.999999990 rounded towards negative infinity
        expect(unixToAtomic(-283984666665))
          .toBe(-283984665242) // -283984665241.999999975 rounded towards negative infinity
      })
    })

    describe('atomicToUnix', () => {
      const atomicToUnix = converter.atomicToUnix

      it('The NEW earliest instant in TAI', () => {
        expect(atomicToUnix(Date.UTC(1961, JAN, 1, 0, 0, 1, 422)))
          .toBe(NaN)

        // Actual start of TAI: 1961-01-01 00:00:01.422818
        expect(atomicToUnix(Date.UTC(1961, JAN, 1, 0, 0, 1, 423)))
          .toBe(Date.UTC(1961, JAN, 1, 0, 0, 0, 0))
        expect(atomicToUnix(-283996798577))
          .toBe(-283996800000) // same
      })

      it('start of 1972', () => {
        expect(atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 9, 998)))
          .toBe(Date.UTC(1972, JAN, 1, 0, 0, 0, 105))
        expect(atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 9, 998)))
          .toBe(63072000105) // same

        expect(atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 9, 999)))
          .toBe(Date.UTC(1972, JAN, 1, 0, 0, 0, 106))
        expect(atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 9, 999)))
          .toBe(63072000106) // same

        // After this point in time, conversions become far simpler and always integer numbers of milliseconds
        expect(atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 10, 0)))
          .toBe(Date.UTC(1972, JAN, 1, 0, 0, 0, 0))
        expect(atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 10, 1)))
          .toBe(Date.UTC(1972, JAN, 1, 0, 0, 0, 1))
        expect(atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 10, 2)))
          .toBe(Date.UTC(1972, JAN, 1, 0, 0, 0, 2))
        // etc.
      })

      it('typical', () => {
        // A typical leap second from the past, note repetition
        expect(atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 29, 750)))
          .toBe(Date.UTC(1998, DEC, 31, 23, 59, 58, 750))
        expect(atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30, 0)))
          .toBe(Date.UTC(1998, DEC, 31, 23, 59, 59, 0))
        expect(atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30, 250)))
          .toBe(Date.UTC(1998, DEC, 31, 23, 59, 59, 250))
        expect(atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30, 500)))
          .toBe(Date.UTC(1998, DEC, 31, 23, 59, 59, 500))
        expect(atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30, 750)))
          .toBe(Date.UTC(1998, DEC, 31, 23, 59, 59, 750))
        expect(atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 0)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 0, 0))
        expect(atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 250)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 0, 250))
        expect(atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 500)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 0, 500))
        expect(atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 750)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 0, 750))
        expect(atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 32, 0)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 0, 0)) // repetition
        expect(atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 32, 250)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 0, 250)) // repetition
        expect(atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 32, 500)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 0, 500)) // repetition
        expect(atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 32, 750)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 0, 750)) // repetition
        expect(atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 33, 0)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 1, 0))
        expect(atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 33, 250)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 1, 250))
      })
    })

    describe('TAI->Unix conversions', () => {
      it('now-ish', () => {
        expect(converter.atomicToUnix(Date.UTC(2016, OCT, 27, 20, 5, 50, 678)))
          .toBe(Date.UTC(2016, OCT, 27, 20, 5, 14, 678))
      })
    })

    describe('Unix->TAI conversions', () => {
      it('The NEW earliest instant in TAI', () => {
        expect(converter.unixToAtomic(Date.UTC(1960, DEC, 31, 23, 59, 59, 999), { array: true }))
          .toEqual([])
        expect(converter.unixToAtomic(Date.UTC(1960, DEC, 31, 23, 59, 59, 999)))
          .toBe(NaN)
      })

      it('icky', () => {
        // Again with the icky floating point comparisons. Fun fact! There is about 105 leap milliseconds here!
        expect(converter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 0), { array: true }))
          .toEqual([
            Date.UTC(1972, JAN, 1, 0, 0, 9, 892), // should be + 0.242004 but rounded towards 1970
            Date.UTC(1972, JAN, 1, 0, 0, 10, 0)
          ])
        expect(converter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 0)))
          .toBe(Date.UTC(1972, JAN, 1, 0, 0, 10, 0))
        expect(converter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 1), { array: true }).length)
          .toBe(2)
        expect(converter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 1), { array: true })[1])
          .toBe(Date.UTC(1972, JAN, 1, 0, 0, 10, 1))
        expect(converter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 1)))
          .toBe(Date.UTC(1972, JAN, 1, 0, 0, 10, 1))
        expect(converter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 2)))
          .toBe(Date.UTC(1972, JAN, 1, 0, 0, 10, 2))
        // etc.
      })

      it('typical (array mode)', () => {
        // A typical leap second from the past, note repetition
        expect(converter.unixToAtomic(Date.UTC(1998, DEC, 31, 23, 59, 59, 750), { array: true }))
          .toEqual([
            Date.UTC(1999, JAN, 1, 0, 0, 30, 750)
          ])
        expect(converter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 0), { array: true }))
          .toEqual([
            Date.UTC(1999, JAN, 1, 0, 0, 31, 0),
            Date.UTC(1999, JAN, 1, 0, 0, 32, 0)
          ])
        expect(converter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 250), { array: true }))
          .toEqual([
            Date.UTC(1999, JAN, 1, 0, 0, 31, 250),
            Date.UTC(1999, JAN, 1, 0, 0, 32, 250)
          ])
        expect(converter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 500), { array: true }))
          .toEqual([
            Date.UTC(1999, JAN, 1, 0, 0, 31, 500),
            Date.UTC(1999, JAN, 1, 0, 0, 32, 500)
          ])
        expect(converter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 750), { array: true }))
          .toEqual([
            Date.UTC(1999, JAN, 1, 0, 0, 31, 750),
            Date.UTC(1999, JAN, 1, 0, 0, 32, 750)
          ])
        expect(converter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 1, 0), { array: true }))
          .toEqual([
            Date.UTC(1999, JAN, 1, 0, 0, 33, 0)
          ])
      })

      it('typical', () => {
        // A typical leap second from the past, note repetition
        expect(converter.unixToAtomic(Date.UTC(1998, DEC, 31, 23, 59, 59, 750)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 30, 750))
        expect(converter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 0)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 32, 0))
        expect(converter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 250)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 32, 250))
        expect(converter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 500)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 32, 500))
        expect(converter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 750)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 32, 750))
        expect(converter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 1, 0)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 33, 0))
      })
    })

    it('Demo', () => {
      expect(converter.unixToAtomic(915148800000, { array: true }))
        .toEqual([915148831000, 915148832000])
      expect(converter.unixToAtomic(915148800000))
        .toBe(915148832000)
      expect(converter.atomicToUnix(915148831000))
        .toBe(915148800000)
      expect(converter.atomicToUnix(915148832000))
        .toBe(915148800000)
    })

    it('Crazy pre-1972 nonsense', () => {
      // At the beginning of 1962, the drift rate changed, with no discontinuity in UTC.

      // Prior ray
      // TAI picosecond count rounds to -252_460_798_155 which is not in range
      expect(converter.unixToAtomic(Date.UTC(1961, DEC, 31, 23, 59, 59, 999), { array: true }))
        .toEqual([Date.UTC(1962, JAN, 1, 0, 0, 1, 844)])
      expect(converter.unixToAtomic(Date.UTC(1962, JAN, 1, 0, 0, 0, 0), { array: true }))
        .toEqual([-252_460_798_155])
      expect(converter.unixToAtomic(Date.UTC(1962, JAN, 1, 0, 0, 0, 0)))
        .toBe(-252_460_798_155)

      // Next ray
      expect(converter.unixToAtomic(Date.UTC(1962, JAN, 1, 0, 0, 0, 1), { array: true }))
        .toEqual([Date.UTC(1962, JAN, 1, 0, 0, 1, 846)])
      expect(converter.unixToAtomic(Date.UTC(1962, JAN, 1, 0, 0, 0, 1)))
        .toBe(-252_460_798_154)
    })

    it('inserted tenth', () => {
      // Oh look, an inserted leap tenth of a second!
      // The period between 1965-09-01 00:00:00 and 00:00:00.100 UTC happened twice!
      expect(converter.unixToAtomic(Date.UTC(1965, SEP, 1, 0, 0, 0, 50), { array: true }))
        .toEqual([
          Date.UTC(1965, SEP, 1, 0, 0, 4, 105),
          Date.UTC(1965, SEP, 1, 0, 0, 4, 205)
        ])
      expect(converter.unixToAtomic(Date.UTC(1965, SEP, 1, 0, 0, 0, 50)))
        .toBe(Date.UTC(1965, SEP, 1, 0, 0, 4, 205))
    })

    it('removed twentieth', () => {
      // Hey, what! A removed leap twentieth of a second???
      // Well, technically, that's 1/20th of a TAI second, which is SLIGHTLY LESS than 1/20th of a UTC second
      // Which means that 23:59:59.950 UTC *does* actually exist...
      expect(converter.unixToAtomic(Date.UTC(1961, JUL, 31, 23, 59, 59, 949), { array: true }).length)
        .toBe(1)
      expect(converter.unixToAtomic(Date.UTC(1961, JUL, 31, 23, 59, 59, 949)))
        .toBe(-265_679_998_354)

      expect(converter.unixToAtomic(Date.UTC(1961, JUL, 31, 23, 59, 59, 950), { array: true }))
        .toEqual([-265_679_998_353])
      expect(converter.unixToAtomic(Date.UTC(1961, JUL, 31, 23, 59, 59, 950)))
        .toBe(-265_679_998_353)

      expect(converter.unixToAtomic(Date.UTC(1961, JUL, 31, 23, 59, 59, 951), { array: true }).length)
        .toBe(0)
      expect(converter.unixToAtomic(Date.UTC(1961, JUL, 31, 23, 59, 59, 951)))
        .toBe(NaN)

      expect(converter.unixToAtomic(Date.UTC(1961, JUL, 31, 23, 59, 59, 999), { array: true }).length)
        .toBe(0)
      expect(converter.unixToAtomic(Date.UTC(1961, JUL, 31, 23, 59, 59, 999)))
        .toBe(NaN)

      expect(converter.unixToAtomic(Date.UTC(1961, AUG, 1, 0, 0, 0, 0), { array: true }).length)
        .toBe(1)
      expect(converter.unixToAtomic(Date.UTC(1961, AUG, 1, 0, 0, 0, 0)))
        .toBe(-265_679_998_353)

      expect(converter.unixToAtomic(Date.UTC(1961, AUG, 1, 0, 0, 0, 1), { array: true }).length)
        .toBe(1)
      expect(converter.unixToAtomic(Date.UTC(1961, AUG, 1, 0, 0, 0, 1)))
        .toBe(-265_679_998_352)

      expect(converter.unixToAtomic(Date.UTC(1961, AUG, 1, 0, 0, 0, 2), { array: true }).length)
        .toBe(1)
      expect(converter.unixToAtomic(Date.UTC(1961, AUG, 1, 0, 0, 0, 2)))
        .toBe(-265_679_998_351)

      expect(converter.atomicToUnix(Date.UTC(1961, AUG, 1, 0, 0, 1, 647)))
        .toBe(Date.UTC(1961, JUL, 31, 23, 59, 59, 949))
    })

    it('boundaries', () => {
      // Let's check out some boundaries where the relationship between TAI and UTC changed
      // 1 January 1962: Perfect continuity (although the drift rate changed)
      expect(converter.unixToAtomic(Date.UTC(1961, DEC, 31, 23, 59, 59, 999), { array: true }).length)
        .toBe(1)
      expect(converter.unixToAtomic(Date.UTC(1962, JAN, 1, 0, 0, 0, 0), { array: true }).length)
        .toBe(1)
      expect(converter.unixToAtomic(Date.UTC(1962, JAN, 1, 0, 0, 0, 1), { array: true }).length)
        .toBe(1)

      // 1 January 1964: Perfect continuity (drift rate changes)
      expect(converter.unixToAtomic(Date.UTC(1963, DEC, 31, 23, 59, 59, 999), { array: true }).length)
        .toBe(1)
      expect(converter.unixToAtomic(Date.UTC(1964, JAN, 1, 0, 0, 0, 0), { array: true }).length)
        .toBe(1)
      expect(converter.unixToAtomic(Date.UTC(1964, JAN, 1, 0, 0, 0, 1), { array: true }).length)
        .toBe(1)

      // 1 April 1964: 0.1 TAI seconds inserted
      expect(converter.unixToAtomic(Date.UTC(1964, MAR, 31, 23, 59, 59, 999), { array: true }).length)
        .toBe(1)
      expect(converter.unixToAtomic(Date.UTC(1964, APR, 1, 0, 0, 0, 0), { array: true }).length)
        .toBe(2)
      expect(converter.unixToAtomic(Date.UTC(1964, APR, 1, 0, 0, 0, 99), { array: true }).length)
        .toBe(2)
      expect(converter.unixToAtomic(Date.UTC(1964, APR, 1, 0, 0, 0, 100), { array: true }).length)
        .toBe(1)

      // etc. (various occasions when 0.1 TAI seconds were inserted)
      expect(converter.unixToAtomic(Date.UTC(1964, SEP, 1, 0, 0, 0, 99), { array: true }).length)
        .toBe(2)
      expect(converter.unixToAtomic(Date.UTC(1965, JAN, 1, 0, 0, 0, 99), { array: true }).length)
        .toBe(2)
      expect(converter.unixToAtomic(Date.UTC(1965, MAR, 1, 0, 0, 0, 99), { array: true }).length)
        .toBe(2)
      expect(converter.unixToAtomic(Date.UTC(1965, JUL, 1, 0, 0, 0, 99), { array: true }).length)
        .toBe(2)
      expect(converter.unixToAtomic(Date.UTC(1965, SEP, 1, 0, 0, 0, 99), { array: true }).length)
        .toBe(2)

      // 1 January 1966: Perfect continuity (drift rate changes)
      expect(converter.unixToAtomic(Date.UTC(1965, DEC, 31, 23, 59, 59, 999), { array: true }).length)
        .toBe(1)
      expect(converter.unixToAtomic(Date.UTC(1966, JAN, 1, 0, 0, 0, 0), { array: true }).length)
        .toBe(1)
      expect(converter.unixToAtomic(Date.UTC(1966, JAN, 1, 0, 0, 0, 1), { array: true }).length)
        .toBe(1)

      // 1 February 1968: 0.1 TAI seconds removed
      expect(converter.unixToAtomic(Date.UTC(1968, JAN, 31, 23, 59, 59, 899), { array: true }).length)
        .toBe(1)
      expect(converter.unixToAtomic(Date.UTC(1968, JAN, 31, 23, 59, 59, 900), { array: true }))
        .toEqual([-60_479_993_815])

      expect(converter.unixToAtomic(Date.UTC(1968, JAN, 31, 23, 59, 59, 901), { array: true }).length)
        .toBe(0)
      expect(converter.unixToAtomic(Date.UTC(1968, JAN, 31, 23, 59, 59, 999), { array: true }).length)
        .toBe(0)
      expect(converter.unixToAtomic(Date.UTC(1968, FEB, 1, 0, 0, 0, 0), { array: true }).length)
        .toBe(1)

      // 1 January 1972: 0.107758 TAI seconds inserted
      expect(converter.unixToAtomic(Date.UTC(1971, DEC, 31, 23, 59, 59, 999), { array: true }).length)
        .toBe(1)
      expect(converter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 0), { array: true }).length)
        .toBe(2)
      expect(converter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 107), { array: true }).length)
        .toBe(2)
      expect(converter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 108), { array: true }).length)
        .toBe(1)

      // Removed time
      expect(converter.unixToAtomic(-265680000051, { array: true }).length)
        .toBe(1)
      expect(converter.unixToAtomic(-265680000050, { array: true }).length)
        .toBe(1)
      expect(converter.unixToAtomic(-265680000049, { array: true }).length)
        .toBe(0)
      expect(converter.unixToAtomic(-265680000048, { array: true }).length)
        .toBe(0)

      expect(converter.unixToAtomic(-252460800000, { array: true }).length)
        .toBe(1)
      expect(converter.unixToAtomic(-194659199900, { array: true }).length)
        .toBe(1)
      expect(converter.unixToAtomic(-189388800000, { array: true }).length)
        .toBe(1)
      expect(converter.unixToAtomic(-181526399900, { array: true }).length)
        .toBe(1)
      expect(converter.unixToAtomic(-168307199900, { array: true }).length)
        .toBe(1)
      expect(converter.unixToAtomic(-157766399900, { array: true }).length)
        .toBe(1)
      expect(converter.unixToAtomic(-152668799900, { array: true }).length)
        .toBe(1)
      expect(converter.unixToAtomic(-142127999900, { array: true }).length)
        .toBe(1)
      expect(converter.unixToAtomic(-136771199900, { array: true }).length)
        .toBe(1)
      expect(converter.unixToAtomic(-126230400000, { array: true }).length)
        .toBe(1)

      // Removed time
      expect(converter.unixToAtomic(-60480000101, { array: true }).length)
        .toBe(1)
      expect(converter.unixToAtomic(-60480000100, { array: true }).length)
        .toBe(1)
      expect(converter.unixToAtomic(-60480000099, { array: true }).length)
        .toBe(0)
      expect(converter.unixToAtomic(-60480000098, { array: true }).length)
        .toBe(0)

      expect(converter.unixToAtomic(63072000106, { array: true }).length)
        .toBe(2)
      expect(converter.unixToAtomic(63072000107, { array: true }).length)
        .toBe(2)
      expect(converter.unixToAtomic(63072000108, { array: true }).length)
        .toBe(1)
      expect(converter.unixToAtomic(63072000109, { array: true }).length)
        .toBe(1)
    })

    describe('TAI raw data conversion unit tests based on magic numbers', () => {
      it('converter.unixToAtomic (range mode)', () => {
        expect(converter.unixToAtomic(63072010000, { array: true })).toEqual([63072020000])
        expect(converter.unixToAtomic(78796811000, { array: true })).toEqual([78796822000])
        expect(converter.unixToAtomic(94694412000, { array: true })).toEqual([94694424000])
        expect(converter.unixToAtomic(126230413000, { array: true })).toEqual([126230426000])
        expect(converter.unixToAtomic(157766414000, { array: true })).toEqual([157766428000])
        expect(converter.unixToAtomic(189302415000, { array: true })).toEqual([189302430000])
        expect(converter.unixToAtomic(220924816000, { array: true })).toEqual([220924832000])
        expect(converter.unixToAtomic(252460817000, { array: true })).toEqual([252460834000])
        expect(converter.unixToAtomic(283996818000, { array: true })).toEqual([283996836000])
        expect(converter.unixToAtomic(315532819000, { array: true })).toEqual([315532838000])
        expect(converter.unixToAtomic(362793620000, { array: true })).toEqual([362793640000])
        expect(converter.unixToAtomic(394329621000, { array: true })).toEqual([394329642000])
        expect(converter.unixToAtomic(425865622000, { array: true })).toEqual([425865644000])
        expect(converter.unixToAtomic(489024023000, { array: true })).toEqual([489024046000])
        expect(converter.unixToAtomic(567993624000, { array: true })).toEqual([567993648000])
        expect(converter.unixToAtomic(631152025000, { array: true })).toEqual([631152050000])
        expect(converter.unixToAtomic(662688026000, { array: true })).toEqual([662688052000])
        expect(converter.unixToAtomic(709948827000, { array: true })).toEqual([709948854000])
        expect(converter.unixToAtomic(741484828000, { array: true })).toEqual([741484856000])
        expect(converter.unixToAtomic(773020829000, { array: true })).toEqual([773020858000])
        expect(converter.unixToAtomic(820454430000, { array: true })).toEqual([820454460000])
        expect(converter.unixToAtomic(867715231000, { array: true })).toEqual([867715262000])
        expect(converter.unixToAtomic(915148832000, { array: true })).toEqual([915148864000])
        expect(converter.unixToAtomic(1136073633000, { array: true })).toEqual([1136073666000])
        expect(converter.unixToAtomic(1230768034000, { array: true })).toEqual([1230768068000])
        expect(converter.unixToAtomic(1341100835000, { array: true })).toEqual([1341100870000])
        expect(converter.unixToAtomic(1435708836000, { array: true })).toEqual([1435708872000])
        expect(converter.unixToAtomic(1483228837000, { array: true })).toEqual([1483228874000])
      })

      it('converter.unixToAtomic', () => {
        expect(converter.unixToAtomic(63072010000)).toEqual(63072020000)
        expect(converter.unixToAtomic(78796811000)).toEqual(78796822000)
        expect(converter.unixToAtomic(94694412000)).toEqual(94694424000)
        expect(converter.unixToAtomic(126230413000)).toEqual(126230426000)
        expect(converter.unixToAtomic(157766414000)).toEqual(157766428000)
        expect(converter.unixToAtomic(189302415000)).toEqual(189302430000)
        expect(converter.unixToAtomic(220924816000)).toEqual(220924832000)
        expect(converter.unixToAtomic(252460817000)).toEqual(252460834000)
        expect(converter.unixToAtomic(283996818000)).toEqual(283996836000)
        expect(converter.unixToAtomic(315532819000)).toEqual(315532838000)
        expect(converter.unixToAtomic(362793620000)).toEqual(362793640000)
        expect(converter.unixToAtomic(394329621000)).toEqual(394329642000)
        expect(converter.unixToAtomic(425865622000)).toEqual(425865644000)
        expect(converter.unixToAtomic(489024023000)).toEqual(489024046000)
        expect(converter.unixToAtomic(567993624000)).toEqual(567993648000)
        expect(converter.unixToAtomic(631152025000)).toEqual(631152050000)
        expect(converter.unixToAtomic(662688026000)).toEqual(662688052000)
        expect(converter.unixToAtomic(709948827000)).toEqual(709948854000)
        expect(converter.unixToAtomic(741484828000)).toEqual(741484856000)
        expect(converter.unixToAtomic(773020829000)).toEqual(773020858000)
        expect(converter.unixToAtomic(820454430000)).toEqual(820454460000)
        expect(converter.unixToAtomic(867715231000)).toEqual(867715262000)
        expect(converter.unixToAtomic(915148832000)).toEqual(915148864000)
        expect(converter.unixToAtomic(1136073633000)).toEqual(1136073666000)
        expect(converter.unixToAtomic(1230768034000)).toEqual(1230768068000)
        expect(converter.unixToAtomic(1341100835000)).toEqual(1341100870000)
        expect(converter.unixToAtomic(1435708836000)).toEqual(1435708872000)
        expect(converter.unixToAtomic(1483228837000)).toEqual(1483228874000)
      })

      it('converter.atomicToUnix', () => {
        expect(converter.atomicToUnix(-283996800000)).toBe(NaN)
        expect(converter.atomicToUnix(63072010000)).toBe(63072000000)
        expect(converter.atomicToUnix(78796811000)).toBe(78796800000)
        expect(converter.atomicToUnix(94694412000)).toBe(94694400000)
        expect(converter.atomicToUnix(126230413000)).toBe(126230400000)
        expect(converter.atomicToUnix(157766414000)).toBe(157766400000)
        expect(converter.atomicToUnix(189302415000)).toBe(189302400000)
        expect(converter.atomicToUnix(220924816000)).toBe(220924800000)
        expect(converter.atomicToUnix(252460817000)).toBe(252460800000)
        expect(converter.atomicToUnix(283996818000)).toBe(283996800000)
        expect(converter.atomicToUnix(315532819000)).toBe(315532800000)
        expect(converter.atomicToUnix(362793620000)).toBe(362793600000)
        expect(converter.atomicToUnix(394329621000)).toBe(394329600000)
        expect(converter.atomicToUnix(425865622000)).toBe(425865600000)
        expect(converter.atomicToUnix(489024023000)).toBe(489024000000)
        expect(converter.atomicToUnix(567993624000)).toBe(567993600000)
        expect(converter.atomicToUnix(631152025000)).toBe(631152000000)
        expect(converter.atomicToUnix(662688026000)).toBe(662688000000)
        expect(converter.atomicToUnix(709948827000)).toBe(709948800000)
        expect(converter.atomicToUnix(741484828000)).toBe(741484800000)
        expect(converter.atomicToUnix(773020829000)).toBe(773020800000)
        expect(converter.atomicToUnix(820454430000)).toBe(820454400000)
        expect(converter.atomicToUnix(867715231000)).toBe(867715200000)
        expect(converter.atomicToUnix(915148832000)).toBe(915148800000)
        expect(converter.atomicToUnix(1136073633000)).toBe(1136073600000)
        expect(converter.atomicToUnix(1230768034000)).toBe(1230768000000)
        expect(converter.atomicToUnix(1341100835000)).toBe(1341100800000)
        expect(converter.atomicToUnix(1435708836000)).toBe(1435708800000)
        expect(converter.atomicToUnix(1483228837000)).toBe(1483228800000)
      })
    })
  })

  describe('STALL', () => {
    const converter = TaiConverter(MODELS.STALL)

    describe('atomicToUnix', () => {
      const atomicToUnix = converter.atomicToUnix

      it('The NEW earliest instant in TAI', () => {
        expect(atomicToUnix(Date.UTC(1961, JAN, 1, 0, 0, 1, 422))).toBe(NaN)
        expect(atomicToUnix(-283996798578)).toBe(NaN) // same

        // Actual start of TAI: 1961-01-01 00:00:01.422818
        expect(atomicToUnix(Date.UTC(1961, JAN, 1, 0, 0, 1, 423)))
          .toBe(Date.UTC(1961, JAN, 1, 0, 0, 0, 0))
        expect(atomicToUnix(-283996798577))
          .toBe(-283996800000) // same
      })

      it('handles the start of 1972', () => {
        expect(atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 10, 0)))
          .toBe(Date.UTC(1972, JAN, 1, 0, 0, 0, 0))
      })

      it('0.107758 seconds added, start of 1972', () => {
        expect(atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 9, 890)))
          .toBe(Date.UTC(1971, DEC, 31, 23, 59, 59, 997))
        expect(atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 9, 891)))
          .toBe(Date.UTC(1971, DEC, 31, 23, 59, 59, 998))
        expect(atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 9, 892)))
          .toBe(Date.UTC(1971, DEC, 31, 23, 59, 59, 999))
        // instants from 1972-01-01 00:00:09.892242 TAI onwards have multiple preimages
        expect(atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 9, 893)))
          .toBe(Date.UTC(1972, JAN, 1, 0, 0, 0, 0)) // stalled
        expect(atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 9, 999)))
          .toBe(Date.UTC(1972, JAN, 1, 0, 0, 0, 0)) // stalled
        // Leap time over
        expect(atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 10, 0)))
          .toBe(Date.UTC(1972, JAN, 1, 0, 0, 0, 0))

        // After this point in time, conversions become far simpler and always integer numbers of milliseconds
        expect(atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 10, 1)))
          .toBe(Date.UTC(1972, JAN, 1, 0, 0, 0, 1))
        expect(atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 10, 2)))
          .toBe(Date.UTC(1972, JAN, 1, 0, 0, 0, 2))
        // etc.
      })

      it('typical', () => {
        // A typical leap second from the past, note non-canonical times
        expect(atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 29, 750)))
          .toBe(Date.UTC(1998, DEC, 31, 23, 59, 58, 750))
        expect(atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30, 0)))
          .toBe(Date.UTC(1998, DEC, 31, 23, 59, 59, 0))
        expect(atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30, 250)))
          .toBe(Date.UTC(1998, DEC, 31, 23, 59, 59, 250))
        expect(atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30, 500)))
          .toBe(Date.UTC(1998, DEC, 31, 23, 59, 59, 500))
        expect(atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30, 750)))
          .toBe(Date.UTC(1998, DEC, 31, 23, 59, 59, 750))
        expect(atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 0)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 0, 0)) // stalled
        expect(atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 250)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 0, 0)) // stalled
        expect(atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 500)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 0, 0)) // stalled
        expect(atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 750)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 0, 0)) // stalled
        expect(atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 32, 0)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 0, 0)) // stalled
        expect(atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 32, 250)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 0, 250))
        expect(atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 32, 500)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 0, 500))
        expect(atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 32, 750)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 0, 750))
        expect(atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 33, 0)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 1, 0))
        expect(atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 33, 250)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 1, 250))
      })
    })

    describe('Unix->TAI conversions', () => {
      it('typical', () => {
        // A typical leap second from the past, note repetition
        expect(converter.unixToAtomic(Date.UTC(1998, DEC, 31, 23, 59, 58, 750)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 29, 750))
        expect(converter.unixToAtomic(Date.UTC(1998, DEC, 31, 23, 59, 59, 0)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 30, 0))
        expect(converter.unixToAtomic(Date.UTC(1998, DEC, 31, 23, 59, 59, 250)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 30, 250))
        expect(converter.unixToAtomic(Date.UTC(1998, DEC, 31, 23, 59, 59, 500)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 30, 500))
        expect(converter.unixToAtomic(Date.UTC(1998, DEC, 31, 23, 59, 59, 750)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 30, 750))
        expect(converter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 0)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 32, 0))
        expect(converter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 250)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 32, 250))
        expect(converter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 500)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 32, 500))
        expect(converter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 750)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 32, 750))
        expect(converter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 1, 0)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 33, 0))
        expect(converter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 1, 250)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 33, 250))
      })

      it('Now-ish', () => {
        expect(converter.unixToAtomic(Date.UTC(2016, OCT, 27, 20, 5, 14, 678)))
          .toBe(Date.UTC(2016, OCT, 27, 20, 5, 50, 678))
      })
    })

    it('Demo', () => {
      expect(converter.unixToAtomic(915148799000))
        .toBe(915148830000)
      expect(converter.unixToAtomic(Date.UTC(1998, DEC, 31, 23, 59, 59)))
        .toBe(Date.UTC(1999, JAN, 1, 0, 0, 30))
      expect(converter.atomicToUnix(915148830000))
        .toBe(915148799000)
      expect(converter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30)))
        .toBe(Date.UTC(1998, DEC, 31, 23, 59, 59))

      expect(converter.atomicToUnix(915_148_831_000)).toBe(915_148_800_000)
      expect(converter.atomicToUnix(915_148_831_001)).toBe(915_148_800_000)
      expect(converter.atomicToUnix(915_148_832_000)).toBe(915_148_800_000)
      expect(converter.atomicToUnix(915_148_832_001)).toBe(915_148_800_001)
    })

    it('Crazy pre-1972 nonsense', () => {
      // TAI picosecond count rounds to -252_460_798_155 which is not on the ray
      expect(converter.unixToAtomic(Date.UTC(1962, JAN, 1, 0, 0, 0, 0)))
        .toBe(-252_460_798_155)

      expect(converter.unixToAtomic(Date.UTC(1962, JAN, 1, 0, 0, 0, 1)))
        .toBe(-252_460_798_154)
      expect(converter.unixToAtomic(Date.UTC(1962, JAN, 1, 0, 0, 0, 1)))
        .toBe(Date.UTC(1962, JAN, 1, 0, 0, 1, 846)) // Same
    })

    describe('TAI raw data conversion unit tests based on magic numbers', () => {
      it('converter.unixToAtomic', () => {
        expect(converter.unixToAtomic(63072010000)).toBe(63072020000)
        expect(converter.unixToAtomic(78796811000)).toBe(78796822000)
        expect(converter.unixToAtomic(94694412000)).toBe(94694424000)
        expect(converter.unixToAtomic(126230413000)).toBe(126230426000)
        expect(converter.unixToAtomic(157766414000)).toBe(157766428000)
        expect(converter.unixToAtomic(189302415000)).toBe(189302430000)
        expect(converter.unixToAtomic(220924816000)).toBe(220924832000)
        expect(converter.unixToAtomic(252460817000)).toBe(252460834000)
        expect(converter.unixToAtomic(283996818000)).toBe(283996836000)
        expect(converter.unixToAtomic(315532819000)).toBe(315532838000)
        expect(converter.unixToAtomic(362793620000)).toBe(362793640000)
        expect(converter.unixToAtomic(394329621000)).toBe(394329642000)
        expect(converter.unixToAtomic(425865622000)).toBe(425865644000)
        expect(converter.unixToAtomic(489024023000)).toBe(489024046000)
        expect(converter.unixToAtomic(567993624000)).toBe(567993648000)
        expect(converter.unixToAtomic(631152025000)).toBe(631152050000)
        expect(converter.unixToAtomic(662688026000)).toBe(662688052000)
        expect(converter.unixToAtomic(709948827000)).toBe(709948854000)
        expect(converter.unixToAtomic(741484828000)).toBe(741484856000)
        expect(converter.unixToAtomic(773020829000)).toBe(773020858000)
        expect(converter.unixToAtomic(820454430000)).toBe(820454460000)
        expect(converter.unixToAtomic(867715231000)).toBe(867715262000)
        expect(converter.unixToAtomic(915148832000)).toBe(915148864000)
        expect(converter.unixToAtomic(1136073633000)).toBe(1136073666000)
        expect(converter.unixToAtomic(1230768034000)).toBe(1230768068000)
        expect(converter.unixToAtomic(1341100835000)).toBe(1341100870000)
        expect(converter.unixToAtomic(1435708836000)).toBe(1435708872000)
        expect(converter.unixToAtomic(1483228837000)).toBe(1483228874000)
      })

      it('converter.atomicToUnix', () => {
        expect(converter.atomicToUnix(-283996800000)).toBe(NaN)
        expect(converter.atomicToUnix(63072010000)).toBe(63072000000)
        expect(converter.atomicToUnix(78796811000)).toBe(78796800000)
        expect(converter.atomicToUnix(94694412000)).toBe(94694400000)
        expect(converter.atomicToUnix(126230413000)).toBe(126230400000)
        expect(converter.atomicToUnix(157766414000)).toBe(157766400000)
        expect(converter.atomicToUnix(189302415000)).toBe(189302400000)
        expect(converter.atomicToUnix(220924816000)).toBe(220924800000)
        expect(converter.atomicToUnix(252460817000)).toBe(252460800000)
        expect(converter.atomicToUnix(283996818000)).toBe(283996800000)
        expect(converter.atomicToUnix(315532819000)).toBe(315532800000)
        expect(converter.atomicToUnix(362793620000)).toBe(362793600000)
        expect(converter.atomicToUnix(394329621000)).toBe(394329600000)
        expect(converter.atomicToUnix(425865622000)).toBe(425865600000)
        expect(converter.atomicToUnix(489024023000)).toBe(489024000000)
        expect(converter.atomicToUnix(567993624000)).toBe(567993600000)
        expect(converter.atomicToUnix(631152025000)).toBe(631152000000)
        expect(converter.atomicToUnix(662688026000)).toBe(662688000000)
        expect(converter.atomicToUnix(709948827000)).toBe(709948800000)
        expect(converter.atomicToUnix(741484828000)).toBe(741484800000)
        expect(converter.atomicToUnix(773020829000)).toBe(773020800000)
        expect(converter.atomicToUnix(820454430000)).toBe(820454400000)
        expect(converter.atomicToUnix(867715231000)).toBe(867715200000)
        expect(converter.atomicToUnix(915148832000)).toBe(915148800000)
        expect(converter.atomicToUnix(1136073633000)).toBe(1136073600000)
        expect(converter.atomicToUnix(1230768034000)).toBe(1230768000000)
        expect(converter.atomicToUnix(1341100835000)).toBe(1341100800000)
        expect(converter.atomicToUnix(1435708836000)).toBe(1435708800000)
        expect(converter.atomicToUnix(1483228837000)).toBe(1483228800000)
      })
    })

    describe('round trips', () => {
      describe('unixToAtomic and back', () => {
        const numbers = [
          // Pre 9172, round trips DO NOT work due to rounding behaviour
          63072010000,
          78796811000,
          94694412000,
          126230413000,
          157766414000,
          189302415000,
          220924816000,
          252460817000,
          283996818000,
          315532819000,
          362793620000,
          394329621000,
          425865622000,
          489024023000,
          567993624000,
          631152025000,
          662688026000,
          709948827000,
          741484828000,
          773020829000,
          820454430000,
          867715231000,
          915148832000,
          1136073633000,
          1230768034000,
          1341100835000,
          1435708836000,
          1483228837000
        ]
        numbers.forEach(number => {
          it(String(number), () => {
            expect(converter.atomicToUnix(converter.unixToAtomic(number))).toBe(number)
          })
        })
      })

      describe('atomicToUnix and back', () => {
        const numbers = [
          // Pre 9172, round trips DO NOT work due to rounding behaviour
          63072010000,
          78796811000,
          94694412000,
          126230413000,
          157766414000,
          189302415000,
          220924816000,
          252460817000,
          283996818000,
          315532819000,
          362793620000,
          394329621000,
          425865622000,
          489024023000,
          567993624000,
          631152025000,
          662688026000,
          709948827000,
          741484828000,
          773020829000,
          820454430000,
          867715231000,
          915148832000,
          1136073633000,
          1230768034000,
          1341100835000,
          1435708836000,
          1483228837000
        ]
        numbers.forEach(number => {
          it(String(number), () => {
            expect(converter.unixToAtomic(converter.atomicToUnix(number))).toBe(number)
          })
        })
      })
    })
  })

  describe('smearing', () => {
    const converter = TaiConverter(MODELS.SMEAR)
    it('smears', () => {
      expect(converter.unixToAtomic(Date.UTC(2016, DEC, 31, 0, 0, 0, 0)))
        .toBe(Date.UTC(2016, DEC, 31, 0, 0, 36, 0))
      expect(converter.unixToAtomic(Date.UTC(2016, DEC, 31, 12, 0, 0, 0)))
        .toBe(Date.UTC(2016, DEC, 31, 12, 0, 36, 0))
      expect(converter.unixToAtomic(Date.UTC(2016, DEC, 31, 12, 0, 0, 1)))
        .toBe(Date.UTC(2016, DEC, 31, 12, 0, 36, 1))

      // After 86400 Unix milliseconds, 86401 TAI milliseconds have passed
      expect(converter.unixToAtomic(Date.UTC(2016, DEC, 31, 12, 1, 26, 399)))
        .toBe(Date.UTC(2016, DEC, 31, 12, 2, 2, 399))
      expect(converter.unixToAtomic(Date.UTC(2016, DEC, 31, 12, 1, 26, 400)))
        .toBe(Date.UTC(2016, DEC, 31, 12, 2, 2, 401))

      // After 12 Unix hours, 12 TAI hours and 500 milliseconds
      expect(converter.unixToAtomic(Date.UTC(2017, JAN, 1, 0, 0, 0, 0)))
        .toBe(Date.UTC(2017, JAN, 1, 0, 0, 36, 500))

      // After 24 Unix hours, 24 TAI hours and 1 second
      expect(converter.unixToAtomic(Date.UTC(2017, JAN, 1, 12, 0, 0, 0)))
        .toBe(Date.UTC(2017, JAN, 1, 12, 0, 37))
    })
  })
})

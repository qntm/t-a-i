/* eslint-env jest */

const { TaiConverter, MODELS, UNIX_START, UNIX_END } = require('..')

const JAN = 0
const FEB = 1
const MAR = 2
const APR = 3
const JUN = 5
const JUL = 6
const AUG = 7
const SEP = 8
const OCT = 9
const DEC = 11

describe('UNIX_START', () => {
  it('is correct', () => {
    expect(UNIX_START).toBe(Date.UTC(1961, JAN, 1))
  })
})

describe('UNIX_END', () => {
  it('is correct', () => {
    expect(UNIX_END).toBe(Date.UTC(2023, JUN, 30, 12, 0, 0, 0))
  })
})

describe('TaiConverter', () => {
  describe('OVERRUN', () => {
    const taiConverter = TaiConverter(MODELS.OVERRUN)

    describe('unixToAtomic (array mode)', () => {
      const unixToAtomic = unixMillis => taiConverter.unixToAtomic(unixMillis, { array: true })

      it('starts TAI at 1961-01-01 00:00:01.422_818', () => {
        // 00:00:01.422_818 is in range, but rounds down to 00:00:01.422 which technically is not
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
        expect(unixToAtomic(-283_984_666_668))
          .toEqual([-283_984_665_246]) // -283_984_665_245.000_000_020 rounded towards negative infinity
        expect(unixToAtomic(-283_984_666_667))
          .toEqual([-283_984_665_245]) // -283_984_665_244.000_000_005 rounded towards negative infinity

        // it's not possible to get a result of [-283_984_665_244.xxx_xxx_xxx]

        expect(unixToAtomic(-283_984_666_666))
          .toEqual([-283_984_665_243]) // -283_984_665_242.999_999_990 rounded towards negative infinity
        expect(unixToAtomic(-283_984_666_665))
          .toEqual([-283_984_665_242]) // -283_984_665_241.999_999_975 rounded towards negative infinity
      })
    })

    describe('unixToAtomic', () => {
      it('starts TAI at 1961-01-01 00:00:01.422_818', () => {
        // 00:00:01.422_818 is in range, but rounds down to 00:00:01.422 which is not
        expect(taiConverter.unixToAtomic(Date.UTC(1961, JAN, 1, 0, 0, 0, 0)))
          .toBe(-283_996_798_578)
      })

      it('advances 15 TAI picoseconds per Unix millisecond', () => {
        expect(taiConverter.unixToAtomic(Date.UTC(1961, JAN, 1, 0, 0, 0, 1)))
          .toBe(Date.UTC(1961, JAN, 1, 0, 0, 1, 423))
        expect(taiConverter.unixToAtomic(Date.UTC(1961, JAN, 1, 0, 0, 0, 2)))
          .toBe(Date.UTC(1961, JAN, 1, 0, 0, 1, 424))
        expect(taiConverter.unixToAtomic(Date.UTC(1961, JAN, 1, 0, 0, 0, 3)))
          .toBe(Date.UTC(1961, JAN, 1, 0, 0, 1, 425))
      })

      it('advances 0.001_296 TAI seconds per Unix day', () => {
        expect(taiConverter.unixToAtomic(Date.UTC(1961, JAN, 2, 0, 0, 0, 0)))
          .toBe(Date.UTC(1961, JAN, 2, 0, 0, 1, 424))
        // It's 1.424_114 but gets rounded down to 1.424_000
      })

      it('makes certain TAI millisecond counts inaccessible', () => {
        expect(taiConverter.unixToAtomic(-283_984_666_668))
          .toBe(-283_984_665_246) // -283_984_665_245.000_000_020 rounded towards negative infinity
        expect(taiConverter.unixToAtomic(-283_984_666_667))
          .toBe(-283_984_665_245) // -283_984_665_244.000_000_005 rounded towards negative infinity

        // it's not possible to get a result of -283_984_665_244.xxx_xxx_xxx

        expect(taiConverter.unixToAtomic(-283_984_666_666))
          .toBe(-283_984_665_243) // -283_984_665_242.999_999_990 rounded towards negative infinity
        expect(taiConverter.unixToAtomic(-283_984_666_665))
          .toBe(-283_984_665_242) // -283_984_665_241.999_999_975 rounded towards negative infinity
      })
    })

    describe('atomicToUnix', () => {
      it('The NEW earliest instant in TAI', () => {
        expect(taiConverter.atomicToUnix(Date.UTC(1961, JAN, 1, 0, 0, 1, 422)))
          .toBe(NaN)

        // Actual start of TAI: 1961-01-01 00:00:01.422_818
        expect(taiConverter.atomicToUnix(Date.UTC(1961, JAN, 1, 0, 0, 1, 423)))
          .toBe(Date.UTC(1961, JAN, 1, 0, 0, 0, 0))
        expect(taiConverter.atomicToUnix(-283_996_798_577))
          .toBe(-283_996_800_000) // same
      })

      it('start of 1972', () => {
        expect(taiConverter.atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 9, 998)))
          .toBe(Date.UTC(1972, JAN, 1, 0, 0, 0, 105))
        expect(taiConverter.atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 9, 998)))
          .toBe(63_072_000_105) // same

        expect(taiConverter.atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 9, 999)))
          .toBe(Date.UTC(1972, JAN, 1, 0, 0, 0, 106))
        expect(taiConverter.atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 9, 999)))
          .toBe(63_072_000_106) // same

        // After this point in time, conversions become far simpler and always integer numbers of milliseconds
        expect(taiConverter.atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 10, 0)))
          .toBe(Date.UTC(1972, JAN, 1, 0, 0, 0, 0))
        expect(taiConverter.atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 10, 1)))
          .toBe(Date.UTC(1972, JAN, 1, 0, 0, 0, 1))
        expect(taiConverter.atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 10, 2)))
          .toBe(Date.UTC(1972, JAN, 1, 0, 0, 0, 2))
        // etc.
      })

      it('typical', () => {
        // A typical leap second from the past, note repetition
        expect(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 29, 750)))
          .toBe(Date.UTC(1998, DEC, 31, 23, 59, 58, 750))
        expect(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30, 0)))
          .toBe(Date.UTC(1998, DEC, 31, 23, 59, 59, 0))
        expect(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30, 250)))
          .toBe(Date.UTC(1998, DEC, 31, 23, 59, 59, 250))
        expect(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30, 500)))
          .toBe(Date.UTC(1998, DEC, 31, 23, 59, 59, 500))
        expect(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30, 750)))
          .toBe(Date.UTC(1998, DEC, 31, 23, 59, 59, 750))
        expect(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 0)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 0, 0))
        expect(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 250)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 0, 250))
        expect(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 500)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 0, 500))
        expect(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 750)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 0, 750))
        expect(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 32, 0)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 0, 0)) // repetition
        expect(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 32, 250)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 0, 250)) // repetition
        expect(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 32, 500)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 0, 500)) // repetition
        expect(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 32, 750)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 0, 750)) // repetition
        expect(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 33, 0)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 1, 0))
        expect(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 33, 250)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 1, 250))
      })
    })

    describe('TAI->Unix conversions', () => {
      it('now-ish', () => {
        expect(taiConverter.atomicToUnix(Date.UTC(2016, OCT, 27, 20, 5, 50, 678)))
          .toBe(Date.UTC(2016, OCT, 27, 20, 5, 14, 678))
      })
    })

    describe('Unix->TAI conversions', () => {
      it('The NEW earliest instant in TAI', () => {
        expect(taiConverter.unixToAtomic(Date.UTC(1960, DEC, 31, 23, 59, 59, 999), { array: true }))
          .toEqual([])
        expect(taiConverter.unixToAtomic(Date.UTC(1960, DEC, 31, 23, 59, 59, 999)))
          .toBe(NaN)
      })

      it('icky', () => {
        // Again with the icky floating point comparisons. Fun fact! There is about 105 leap milliseconds here!
        expect(taiConverter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 0), { array: true }))
          .toEqual([
            Date.UTC(1972, JAN, 1, 0, 0, 9, 892), // should be + 0.242_004 but rounded towards 1970
            Date.UTC(1972, JAN, 1, 0, 0, 10, 0)
          ])
        expect(taiConverter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 0)))
          .toBe(Date.UTC(1972, JAN, 1, 0, 0, 10, 0))
        expect(taiConverter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 1), { array: true }).length)
          .toBe(2)
        expect(taiConverter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 1), { array: true })[1])
          .toBe(Date.UTC(1972, JAN, 1, 0, 0, 10, 1))
        expect(taiConverter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 1)))
          .toBe(Date.UTC(1972, JAN, 1, 0, 0, 10, 1))
        expect(taiConverter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 2)))
          .toBe(Date.UTC(1972, JAN, 1, 0, 0, 10, 2))
        // etc.
      })

      it('typical (array mode)', () => {
        // A typical leap second from the past, note repetition
        expect(taiConverter.unixToAtomic(Date.UTC(1998, DEC, 31, 23, 59, 59, 750), { array: true }))
          .toEqual([
            Date.UTC(1999, JAN, 1, 0, 0, 30, 750)
          ])
        expect(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 0), { array: true }))
          .toEqual([
            Date.UTC(1999, JAN, 1, 0, 0, 31, 0),
            Date.UTC(1999, JAN, 1, 0, 0, 32, 0)
          ])
        expect(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 250), { array: true }))
          .toEqual([
            Date.UTC(1999, JAN, 1, 0, 0, 31, 250),
            Date.UTC(1999, JAN, 1, 0, 0, 32, 250)
          ])
        expect(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 500), { array: true }))
          .toEqual([
            Date.UTC(1999, JAN, 1, 0, 0, 31, 500),
            Date.UTC(1999, JAN, 1, 0, 0, 32, 500)
          ])
        expect(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 750), { array: true }))
          .toEqual([
            Date.UTC(1999, JAN, 1, 0, 0, 31, 750),
            Date.UTC(1999, JAN, 1, 0, 0, 32, 750)
          ])
        expect(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 1, 0), { array: true }))
          .toEqual([
            Date.UTC(1999, JAN, 1, 0, 0, 33, 0)
          ])
      })

      it('typical', () => {
        // A typical leap second from the past, note repetition
        expect(taiConverter.unixToAtomic(Date.UTC(1998, DEC, 31, 23, 59, 59, 750)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 30, 750))
        expect(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 0)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 32, 0))
        expect(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 250)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 32, 250))
        expect(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 500)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 32, 500))
        expect(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 750)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 32, 750))
        expect(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 1, 0)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 33, 0))
      })
    })

    it('Demo', () => {
      expect(taiConverter.unixToAtomic(915_148_800_000, { array: true }))
        .toEqual([915_148_831_000, 915_148_832_000])
      expect(taiConverter.unixToAtomic(915_148_800_000))
        .toBe(915_148_832_000)
      expect(taiConverter.atomicToUnix(915_148_831_000))
        .toBe(915_148_800_000)
      expect(taiConverter.atomicToUnix(915_148_832_000))
        .toBe(915_148_800_000)
    })

    it('Crazy pre-1972 nonsense', () => {
      // At the beginning of 1962, the drift rate changed, with no discontinuity in UTC.

      // Prior ray
      // TAI picosecond count rounds to -252_460_798_155 which is not in range
      expect(taiConverter.unixToAtomic(Date.UTC(1961, DEC, 31, 23, 59, 59, 999), { array: true }))
        .toEqual([Date.UTC(1962, JAN, 1, 0, 0, 1, 844)])
      expect(taiConverter.unixToAtomic(Date.UTC(1962, JAN, 1, 0, 0, 0, 0), { array: true }))
        .toEqual([-252_460_798_155])
      expect(taiConverter.unixToAtomic(Date.UTC(1962, JAN, 1, 0, 0, 0, 0)))
        .toBe(-252_460_798_155)

      // Next ray
      expect(taiConverter.unixToAtomic(Date.UTC(1962, JAN, 1, 0, 0, 0, 1), { array: true }))
        .toEqual([Date.UTC(1962, JAN, 1, 0, 0, 1, 846)])
      expect(taiConverter.unixToAtomic(Date.UTC(1962, JAN, 1, 0, 0, 0, 1)))
        .toBe(-252_460_798_154)
    })

    it('inserted tenth', () => {
      // Oh look, an inserted leap tenth of a second!
      // The period between 1965-09-01 00:00:00 and 00:00:00.100 UTC happened twice!
      expect(taiConverter.unixToAtomic(Date.UTC(1965, SEP, 1, 0, 0, 0, 50), { array: true }))
        .toEqual([
          Date.UTC(1965, SEP, 1, 0, 0, 4, 105),
          Date.UTC(1965, SEP, 1, 0, 0, 4, 205)
        ])
      expect(taiConverter.unixToAtomic(Date.UTC(1965, SEP, 1, 0, 0, 0, 50)))
        .toBe(Date.UTC(1965, SEP, 1, 0, 0, 4, 205))
    })

    it('removed twentieth', () => {
      // Hey, what! A removed leap twentieth of a second???
      // Well, technically, that's 1/20th of a TAI second, which is SLIGHTLY LESS than 1/20th of a UTC second
      // Which means that 23:59:59.950 UTC *does* actually exist...
      expect(taiConverter.unixToAtomic(Date.UTC(1961, JUL, 31, 23, 59, 59, 949), { array: true }).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Date.UTC(1961, JUL, 31, 23, 59, 59, 949)))
        .toBe(-265_679_998_354)

      expect(taiConverter.unixToAtomic(Date.UTC(1961, JUL, 31, 23, 59, 59, 950), { array: true }))
        .toEqual([-265_679_998_353])
      expect(taiConverter.unixToAtomic(Date.UTC(1961, JUL, 31, 23, 59, 59, 950)))
        .toBe(-265_679_998_353)

      expect(taiConverter.unixToAtomic(Date.UTC(1961, JUL, 31, 23, 59, 59, 951), { array: true }).length)
        .toBe(0)
      expect(taiConverter.unixToAtomic(Date.UTC(1961, JUL, 31, 23, 59, 59, 951)))
        .toBe(NaN)

      expect(taiConverter.unixToAtomic(Date.UTC(1961, JUL, 31, 23, 59, 59, 999), { array: true }).length)
        .toBe(0)
      expect(taiConverter.unixToAtomic(Date.UTC(1961, JUL, 31, 23, 59, 59, 999)))
        .toBe(NaN)

      expect(taiConverter.unixToAtomic(Date.UTC(1961, AUG, 1, 0, 0, 0, 0), { array: true }).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Date.UTC(1961, AUG, 1, 0, 0, 0, 0)))
        .toBe(-265_679_998_353)

      expect(taiConverter.unixToAtomic(Date.UTC(1961, AUG, 1, 0, 0, 0, 1), { array: true }).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Date.UTC(1961, AUG, 1, 0, 0, 0, 1)))
        .toBe(-265_679_998_352)

      expect(taiConverter.unixToAtomic(Date.UTC(1961, AUG, 1, 0, 0, 0, 2), { array: true }).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Date.UTC(1961, AUG, 1, 0, 0, 0, 2)))
        .toBe(-265_679_998_351)

      expect(taiConverter.atomicToUnix(Date.UTC(1961, AUG, 1, 0, 0, 1, 647)))
        .toBe(Date.UTC(1961, JUL, 31, 23, 59, 59, 949))
    })

    it('boundaries', () => {
      // Let's check out some boundaries where the relationship between TAI and UTC changed
      // 1 January 1962: Perfect continuity (although the drift rate changed)
      expect(taiConverter.unixToAtomic(Date.UTC(1961, DEC, 31, 23, 59, 59, 999), { array: true }).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Date.UTC(1962, JAN, 1, 0, 0, 0, 0), { array: true }).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Date.UTC(1962, JAN, 1, 0, 0, 0, 1), { array: true }).length)
        .toBe(1)

      // 1 January 1964: Perfect continuity (drift rate changes)
      expect(taiConverter.unixToAtomic(Date.UTC(1963, DEC, 31, 23, 59, 59, 999), { array: true }).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Date.UTC(1964, JAN, 1, 0, 0, 0, 0), { array: true }).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Date.UTC(1964, JAN, 1, 0, 0, 0, 1), { array: true }).length)
        .toBe(1)

      // 1 April 1964: 0.1 TAI seconds inserted
      expect(taiConverter.unixToAtomic(Date.UTC(1964, MAR, 31, 23, 59, 59, 999), { array: true }).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Date.UTC(1964, APR, 1, 0, 0, 0, 0), { array: true }).length)
        .toBe(2)
      expect(taiConverter.unixToAtomic(Date.UTC(1964, APR, 1, 0, 0, 0, 99), { array: true }).length)
        .toBe(2)
      expect(taiConverter.unixToAtomic(Date.UTC(1964, APR, 1, 0, 0, 0, 100), { array: true }).length)
        .toBe(1)

      // etc. (various occasions when 0.1 TAI seconds were inserted)
      expect(taiConverter.unixToAtomic(Date.UTC(1964, SEP, 1, 0, 0, 0, 99), { array: true }).length)
        .toBe(2)
      expect(taiConverter.unixToAtomic(Date.UTC(1965, JAN, 1, 0, 0, 0, 99), { array: true }).length)
        .toBe(2)
      expect(taiConverter.unixToAtomic(Date.UTC(1965, MAR, 1, 0, 0, 0, 99), { array: true }).length)
        .toBe(2)
      expect(taiConverter.unixToAtomic(Date.UTC(1965, JUL, 1, 0, 0, 0, 99), { array: true }).length)
        .toBe(2)
      expect(taiConverter.unixToAtomic(Date.UTC(1965, SEP, 1, 0, 0, 0, 99), { array: true }).length)
        .toBe(2)

      // 1 January 1966: Perfect continuity (drift rate changes)
      expect(taiConverter.unixToAtomic(Date.UTC(1965, DEC, 31, 23, 59, 59, 999), { array: true }).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Date.UTC(1966, JAN, 1, 0, 0, 0, 0), { array: true }).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Date.UTC(1966, JAN, 1, 0, 0, 0, 1), { array: true }).length)
        .toBe(1)

      // 1 February 1968: 0.1 TAI seconds removed
      expect(taiConverter.unixToAtomic(Date.UTC(1968, JAN, 31, 23, 59, 59, 899), { array: true }).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Date.UTC(1968, JAN, 31, 23, 59, 59, 900), { array: true }))
        .toEqual([-60_479_993_815])

      expect(taiConverter.unixToAtomic(Date.UTC(1968, JAN, 31, 23, 59, 59, 901), { array: true }).length)
        .toBe(0)
      expect(taiConverter.unixToAtomic(Date.UTC(1968, JAN, 31, 23, 59, 59, 999), { array: true }).length)
        .toBe(0)
      expect(taiConverter.unixToAtomic(Date.UTC(1968, FEB, 1, 0, 0, 0, 0), { array: true }).length)
        .toBe(1)

      // 1 January 1972: 0.107_758 TAI seconds inserted
      expect(taiConverter.unixToAtomic(Date.UTC(1971, DEC, 31, 23, 59, 59, 999), { array: true }).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 0), { array: true }).length)
        .toBe(2)
      expect(taiConverter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 107), { array: true }).length)
        .toBe(2)
      expect(taiConverter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 108), { array: true }).length)
        .toBe(1)

      // Removed time
      expect(taiConverter.unixToAtomic(-265_680_000_051, { array: true }).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(-265_680_000_050, { array: true }).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(-265_680_000_049, { array: true }).length)
        .toBe(0)
      expect(taiConverter.unixToAtomic(-265_680_000_048, { array: true }).length)
        .toBe(0)

      expect(taiConverter.unixToAtomic(-252_460_800_000, { array: true }).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(-194_659_199_900, { array: true }).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(-189_388_800_000, { array: true }).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(-181_526_399_900, { array: true }).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(-168_307_199_900, { array: true }).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(-157_766_399_900, { array: true }).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(-152_668_799_900, { array: true }).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(-142_127_999_900, { array: true }).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(-136_771_199_900, { array: true }).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(-126_230_400_000, { array: true }).length)
        .toBe(1)

      // Removed time
      expect(taiConverter.unixToAtomic(-60_480_000_101, { array: true }).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(-60_480_000_100, { array: true }).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(-60_480_000_099, { array: true }).length)
        .toBe(0)
      expect(taiConverter.unixToAtomic(-60_480_000_098, { array: true }).length)
        .toBe(0)

      expect(taiConverter.unixToAtomic(63_072_000_106, { array: true }).length)
        .toBe(2)
      expect(taiConverter.unixToAtomic(63_072_000_107, { array: true }).length)
        .toBe(2)
      expect(taiConverter.unixToAtomic(63_072_000_108, { array: true }).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(63_072_000_109, { array: true }).length)
        .toBe(1)
    })

    describe('TAI raw data conversion unit tests based on magic numbers', () => {
      it('taiConverter.unixToAtomic (range mode)', () => {
        expect(taiConverter.unixToAtomic(63_072_010_000, { array: true })).toEqual([63_072_020_000])
        expect(taiConverter.unixToAtomic(78_796_811_000, { array: true })).toEqual([78_796_822_000])
        expect(taiConverter.unixToAtomic(94_694_412_000, { array: true })).toEqual([94_694_424_000])
        expect(taiConverter.unixToAtomic(126_230_413_000, { array: true })).toEqual([126_230_426_000])
        expect(taiConverter.unixToAtomic(157_766_414_000, { array: true })).toEqual([157_766_428_000])
        expect(taiConverter.unixToAtomic(189_302_415_000, { array: true })).toEqual([189_302_430_000])
        expect(taiConverter.unixToAtomic(220_924_816_000, { array: true })).toEqual([220_924_832_000])
        expect(taiConverter.unixToAtomic(252_460_817_000, { array: true })).toEqual([252_460_834_000])
        expect(taiConverter.unixToAtomic(283_996_818_000, { array: true })).toEqual([283_996_836_000])
        expect(taiConverter.unixToAtomic(315_532_819_000, { array: true })).toEqual([315_532_838_000])
        expect(taiConverter.unixToAtomic(362_793_620_000, { array: true })).toEqual([362_793_640_000])
        expect(taiConverter.unixToAtomic(394_329_621_000, { array: true })).toEqual([394_329_642_000])
        expect(taiConverter.unixToAtomic(425_865_622_000, { array: true })).toEqual([425_865_644_000])
        expect(taiConverter.unixToAtomic(489_024_023_000, { array: true })).toEqual([489_024_046_000])
        expect(taiConverter.unixToAtomic(567_993_624_000, { array: true })).toEqual([567_993_648_000])
        expect(taiConverter.unixToAtomic(631_152_025_000, { array: true })).toEqual([631_152_050_000])
        expect(taiConverter.unixToAtomic(662_688_026_000, { array: true })).toEqual([662_688_052_000])
        expect(taiConverter.unixToAtomic(709_948_827_000, { array: true })).toEqual([709_948_854_000])
        expect(taiConverter.unixToAtomic(741_484_828_000, { array: true })).toEqual([741_484_856_000])
        expect(taiConverter.unixToAtomic(773_020_829_000, { array: true })).toEqual([773_020_858_000])
        expect(taiConverter.unixToAtomic(820_454_430_000, { array: true })).toEqual([820_454_460_000])
        expect(taiConverter.unixToAtomic(867_715_231_000, { array: true })).toEqual([867_715_262_000])
        expect(taiConverter.unixToAtomic(915_148_832_000, { array: true })).toEqual([915_148_864_000])
        expect(taiConverter.unixToAtomic(1_136_073_633_000, { array: true })).toEqual([1_136_073_666_000])
        expect(taiConverter.unixToAtomic(1_230_768_034_000, { array: true })).toEqual([1_230_768_068_000])
        expect(taiConverter.unixToAtomic(1_341_100_835_000, { array: true })).toEqual([1_341_100_870_000])
        expect(taiConverter.unixToAtomic(1_435_708_836_000, { array: true })).toEqual([1_435_708_872_000])
        expect(taiConverter.unixToAtomic(1_483_228_837_000, { array: true })).toEqual([1_483_228_874_000])
      })

      it('taiConverter.unixToAtomic', () => {
        expect(taiConverter.unixToAtomic(63_072_010_000)).toEqual(63_072_020_000)
        expect(taiConverter.unixToAtomic(78_796_811_000)).toEqual(78_796_822_000)
        expect(taiConverter.unixToAtomic(94_694_412_000)).toEqual(94_694_424_000)
        expect(taiConverter.unixToAtomic(126_230_413_000)).toEqual(126_230_426_000)
        expect(taiConverter.unixToAtomic(157_766_414_000)).toEqual(157_766_428_000)
        expect(taiConverter.unixToAtomic(189_302_415_000)).toEqual(189_302_430_000)
        expect(taiConverter.unixToAtomic(220_924_816_000)).toEqual(220_924_832_000)
        expect(taiConverter.unixToAtomic(252_460_817_000)).toEqual(252_460_834_000)
        expect(taiConverter.unixToAtomic(283_996_818_000)).toEqual(283_996_836_000)
        expect(taiConverter.unixToAtomic(315_532_819_000)).toEqual(315_532_838_000)
        expect(taiConverter.unixToAtomic(362_793_620_000)).toEqual(362_793_640_000)
        expect(taiConverter.unixToAtomic(394_329_621_000)).toEqual(394_329_642_000)
        expect(taiConverter.unixToAtomic(425_865_622_000)).toEqual(425_865_644_000)
        expect(taiConverter.unixToAtomic(489_024_023_000)).toEqual(489_024_046_000)
        expect(taiConverter.unixToAtomic(567_993_624_000)).toEqual(567_993_648_000)
        expect(taiConverter.unixToAtomic(631_152_025_000)).toEqual(631_152_050_000)
        expect(taiConverter.unixToAtomic(662_688_026_000)).toEqual(662_688_052_000)
        expect(taiConverter.unixToAtomic(709_948_827_000)).toEqual(709_948_854_000)
        expect(taiConverter.unixToAtomic(741_484_828_000)).toEqual(741_484_856_000)
        expect(taiConverter.unixToAtomic(773_020_829_000)).toEqual(773_020_858_000)
        expect(taiConverter.unixToAtomic(820_454_430_000)).toEqual(820_454_460_000)
        expect(taiConverter.unixToAtomic(867_715_231_000)).toEqual(867_715_262_000)
        expect(taiConverter.unixToAtomic(915_148_832_000)).toEqual(915_148_864_000)
        expect(taiConverter.unixToAtomic(1_136_073_633_000)).toEqual(1_136_073_666_000)
        expect(taiConverter.unixToAtomic(1_230_768_034_000)).toEqual(1_230_768_068_000)
        expect(taiConverter.unixToAtomic(1_341_100_835_000)).toEqual(1_341_100_870_000)
        expect(taiConverter.unixToAtomic(1_435_708_836_000)).toEqual(1_435_708_872_000)
        expect(taiConverter.unixToAtomic(1_483_228_837_000)).toEqual(1_483_228_874_000)
      })

      it('taiConverter.atomicToUnix', () => {
        expect(taiConverter.atomicToUnix(-283_996_800_000)).toBe(NaN)
        expect(taiConverter.atomicToUnix(63_072_010_000)).toBe(63_072_000_000)
        expect(taiConverter.atomicToUnix(78_796_811_000)).toBe(78_796_800_000)
        expect(taiConverter.atomicToUnix(94_694_412_000)).toBe(94_694_400_000)
        expect(taiConverter.atomicToUnix(126_230_413_000)).toBe(126_230_400_000)
        expect(taiConverter.atomicToUnix(157_766_414_000)).toBe(157_766_400_000)
        expect(taiConverter.atomicToUnix(189_302_415_000)).toBe(189_302_400_000)
        expect(taiConverter.atomicToUnix(220_924_816_000)).toBe(220_924_800_000)
        expect(taiConverter.atomicToUnix(252_460_817_000)).toBe(252_460_800_000)
        expect(taiConverter.atomicToUnix(283_996_818_000)).toBe(283_996_800_000)
        expect(taiConverter.atomicToUnix(315_532_819_000)).toBe(315_532_800_000)
        expect(taiConverter.atomicToUnix(362_793_620_000)).toBe(362_793_600_000)
        expect(taiConverter.atomicToUnix(394_329_621_000)).toBe(394_329_600_000)
        expect(taiConverter.atomicToUnix(425_865_622_000)).toBe(425_865_600_000)
        expect(taiConverter.atomicToUnix(489_024_023_000)).toBe(489_024_000_000)
        expect(taiConverter.atomicToUnix(567_993_624_000)).toBe(567_993_600_000)
        expect(taiConverter.atomicToUnix(631_152_025_000)).toBe(631_152_000_000)
        expect(taiConverter.atomicToUnix(662_688_026_000)).toBe(662_688_000_000)
        expect(taiConverter.atomicToUnix(709_948_827_000)).toBe(709_948_800_000)
        expect(taiConverter.atomicToUnix(741_484_828_000)).toBe(741_484_800_000)
        expect(taiConverter.atomicToUnix(773_020_829_000)).toBe(773_020_800_000)
        expect(taiConverter.atomicToUnix(820_454_430_000)).toBe(820_454_400_000)
        expect(taiConverter.atomicToUnix(867_715_231_000)).toBe(867_715_200_000)
        expect(taiConverter.atomicToUnix(915_148_832_000)).toBe(915_148_800_000)
        expect(taiConverter.atomicToUnix(1_136_073_633_000)).toBe(1_136_073_600_000)
        expect(taiConverter.atomicToUnix(1_230_768_034_000)).toBe(1_230_768_000_000)
        expect(taiConverter.atomicToUnix(1_341_100_835_000)).toBe(1_341_100_800_000)
        expect(taiConverter.atomicToUnix(1_435_708_836_000)).toBe(1_435_708_800_000)
        expect(taiConverter.atomicToUnix(1_483_228_837_000)).toBe(1_483_228_800_000)
      })
    })
  })

  describe('STALL', () => {
    const taiConverter = TaiConverter(MODELS.STALL)

    describe('atomicToUnix', () => {
      it('The NEW earliest instant in TAI', () => {
        expect(taiConverter.atomicToUnix(Date.UTC(1961, JAN, 1, 0, 0, 1, 422))).toBe(NaN)
        expect(taiConverter.atomicToUnix(-283_996_798_578)).toBe(NaN) // same

        // Actual start of TAI: 1961-01-01 00:00:01.422_818
        expect(taiConverter.atomicToUnix(Date.UTC(1961, JAN, 1, 0, 0, 1, 423)))
          .toBe(Date.UTC(1961, JAN, 1, 0, 0, 0, 0))
        expect(taiConverter.atomicToUnix(-283_996_798_577))
          .toBe(-283_996_800_000) // same
      })

      it('handles the start of 1972', () => {
        expect(taiConverter.atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 10, 0)))
          .toBe(Date.UTC(1972, JAN, 1, 0, 0, 0, 0))
      })

      it('0.107_758 seconds added, start of 1972', () => {
        expect(taiConverter.atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 9, 890)))
          .toBe(Date.UTC(1971, DEC, 31, 23, 59, 59, 997))
        expect(taiConverter.atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 9, 891)))
          .toBe(Date.UTC(1971, DEC, 31, 23, 59, 59, 998))
        expect(taiConverter.atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 9, 892)))
          .toBe(Date.UTC(1971, DEC, 31, 23, 59, 59, 999))
        // instants from 1972-01-01 00:00:09.892_242 TAI onwards have multiple preimages
        expect(taiConverter.atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 9, 893)))
          .toBe(Date.UTC(1972, JAN, 1, 0, 0, 0, 0)) // stalled
        expect(taiConverter.atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 9, 999)))
          .toBe(Date.UTC(1972, JAN, 1, 0, 0, 0, 0)) // stalled
        // Leap time over
        expect(taiConverter.atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 10, 0)))
          .toBe(Date.UTC(1972, JAN, 1, 0, 0, 0, 0))

        // After this point in time, conversions become far simpler and always integer numbers of milliseconds
        expect(taiConverter.atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 10, 1)))
          .toBe(Date.UTC(1972, JAN, 1, 0, 0, 0, 1))
        expect(taiConverter.atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 10, 2)))
          .toBe(Date.UTC(1972, JAN, 1, 0, 0, 0, 2))
        // etc.
      })

      it('typical', () => {
        // A typical leap second from the past, note non-canonical times
        expect(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 29, 750)))
          .toBe(Date.UTC(1998, DEC, 31, 23, 59, 58, 750))
        expect(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30, 0)))
          .toBe(Date.UTC(1998, DEC, 31, 23, 59, 59, 0))
        expect(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30, 250)))
          .toBe(Date.UTC(1998, DEC, 31, 23, 59, 59, 250))
        expect(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30, 500)))
          .toBe(Date.UTC(1998, DEC, 31, 23, 59, 59, 500))
        expect(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30, 750)))
          .toBe(Date.UTC(1998, DEC, 31, 23, 59, 59, 750))
        expect(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 0)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 0, 0)) // stalled
        expect(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 250)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 0, 0)) // stalled
        expect(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 500)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 0, 0)) // stalled
        expect(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 750)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 0, 0)) // stalled
        expect(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 32, 0)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 0, 0)) // stalled
        expect(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 32, 250)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 0, 250))
        expect(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 32, 500)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 0, 500))
        expect(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 32, 750)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 0, 750))
        expect(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 33, 0)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 1, 0))
        expect(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 33, 250)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 1, 250))
      })
    })

    describe('Unix->TAI conversions', () => {
      it('typical', () => {
        // A typical leap second from the past, note repetition
        expect(taiConverter.unixToAtomic(Date.UTC(1998, DEC, 31, 23, 59, 58, 750)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 29, 750))
        expect(taiConverter.unixToAtomic(Date.UTC(1998, DEC, 31, 23, 59, 59, 0)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 30, 0))
        expect(taiConverter.unixToAtomic(Date.UTC(1998, DEC, 31, 23, 59, 59, 250)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 30, 250))
        expect(taiConverter.unixToAtomic(Date.UTC(1998, DEC, 31, 23, 59, 59, 500)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 30, 500))
        expect(taiConverter.unixToAtomic(Date.UTC(1998, DEC, 31, 23, 59, 59, 750)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 30, 750))
        expect(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 0)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 32, 0))
        expect(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 250)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 32, 250))
        expect(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 500)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 32, 500))
        expect(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 750)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 32, 750))
        expect(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 1, 0)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 33, 0))
        expect(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 1, 250)))
          .toBe(Date.UTC(1999, JAN, 1, 0, 0, 33, 250))
      })

      it('Now-ish', () => {
        expect(taiConverter.unixToAtomic(Date.UTC(2016, OCT, 27, 20, 5, 14, 678)))
          .toBe(Date.UTC(2016, OCT, 27, 20, 5, 50, 678))
      })
    })

    it('Demo', () => {
      expect(taiConverter.unixToAtomic(915_148_799_000))
        .toBe(915_148_830_000)
      expect(taiConverter.unixToAtomic(Date.UTC(1998, DEC, 31, 23, 59, 59)))
        .toBe(Date.UTC(1999, JAN, 1, 0, 0, 30))
      expect(taiConverter.atomicToUnix(915_148_830_000))
        .toBe(915_148_799_000)
      expect(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30)))
        .toBe(Date.UTC(1998, DEC, 31, 23, 59, 59))

      expect(taiConverter.atomicToUnix(915_148_831_000)).toBe(915_148_800_000)
      expect(taiConverter.atomicToUnix(915_148_831_001)).toBe(915_148_800_000)
      expect(taiConverter.atomicToUnix(915_148_832_000)).toBe(915_148_800_000)
      expect(taiConverter.atomicToUnix(915_148_832_001)).toBe(915_148_800_001)
    })

    it('Crazy pre-1972 nonsense', () => {
      // TAI picosecond count rounds to -252_460_798_155 which is not on the ray
      expect(taiConverter.unixToAtomic(Date.UTC(1962, JAN, 1, 0, 0, 0, 0)))
        .toBe(-252_460_798_155)

      expect(taiConverter.unixToAtomic(Date.UTC(1962, JAN, 1, 0, 0, 0, 1)))
        .toBe(-252_460_798_154)
      expect(taiConverter.unixToAtomic(Date.UTC(1962, JAN, 1, 0, 0, 0, 1)))
        .toBe(Date.UTC(1962, JAN, 1, 0, 0, 1, 846)) // Same
    })

    describe('TAI raw data conversion unit tests based on magic numbers', () => {
      it('taiConverter.unixToAtomic', () => {
        expect(taiConverter.unixToAtomic(63_072_010_000)).toBe(63_072_020_000)
        expect(taiConverter.unixToAtomic(78_796_811_000)).toBe(78_796_822_000)
        expect(taiConverter.unixToAtomic(94_694_412_000)).toBe(94_694_424_000)
        expect(taiConverter.unixToAtomic(126_230_413_000)).toBe(126_230_426_000)
        expect(taiConverter.unixToAtomic(157_766_414_000)).toBe(157_766_428_000)
        expect(taiConverter.unixToAtomic(189_302_415_000)).toBe(189_302_430_000)
        expect(taiConverter.unixToAtomic(220_924_816_000)).toBe(220_924_832_000)
        expect(taiConverter.unixToAtomic(252_460_817_000)).toBe(252_460_834_000)
        expect(taiConverter.unixToAtomic(283_996_818_000)).toBe(283_996_836_000)
        expect(taiConverter.unixToAtomic(315_532_819_000)).toBe(315_532_838_000)
        expect(taiConverter.unixToAtomic(362_793_620_000)).toBe(362_793_640_000)
        expect(taiConverter.unixToAtomic(394_329_621_000)).toBe(394_329_642_000)
        expect(taiConverter.unixToAtomic(425_865_622_000)).toBe(425_865_644_000)
        expect(taiConverter.unixToAtomic(489_024_023_000)).toBe(489_024_046_000)
        expect(taiConverter.unixToAtomic(567_993_624_000)).toBe(567_993_648_000)
        expect(taiConverter.unixToAtomic(631_152_025_000)).toBe(631_152_050_000)
        expect(taiConverter.unixToAtomic(662_688_026_000)).toBe(662_688_052_000)
        expect(taiConverter.unixToAtomic(709_948_827_000)).toBe(709_948_854_000)
        expect(taiConverter.unixToAtomic(741_484_828_000)).toBe(741_484_856_000)
        expect(taiConverter.unixToAtomic(773_020_829_000)).toBe(773_020_858_000)
        expect(taiConverter.unixToAtomic(820_454_430_000)).toBe(820_454_460_000)
        expect(taiConverter.unixToAtomic(867_715_231_000)).toBe(867_715_262_000)
        expect(taiConverter.unixToAtomic(915_148_832_000)).toBe(915_148_864_000)
        expect(taiConverter.unixToAtomic(1_136_073_633_000)).toBe(1_136_073_666_000)
        expect(taiConverter.unixToAtomic(1_230_768_034_000)).toBe(1_230_768_068_000)
        expect(taiConverter.unixToAtomic(1_341_100_835_000)).toBe(1_341_100_870_000)
        expect(taiConverter.unixToAtomic(1_435_708_836_000)).toBe(1_435_708_872_000)
        expect(taiConverter.unixToAtomic(1_483_228_837_000)).toBe(1_483_228_874_000)
      })

      it('taiConverter.atomicToUnix', () => {
        expect(taiConverter.atomicToUnix(-283_996_800_000)).toBe(NaN)
        expect(taiConverter.atomicToUnix(63_072_010_000)).toBe(63_072_000_000)
        expect(taiConverter.atomicToUnix(78_796_811_000)).toBe(78_796_800_000)
        expect(taiConverter.atomicToUnix(94_694_412_000)).toBe(94_694_400_000)
        expect(taiConverter.atomicToUnix(126_230_413_000)).toBe(126_230_400_000)
        expect(taiConverter.atomicToUnix(157_766_414_000)).toBe(157_766_400_000)
        expect(taiConverter.atomicToUnix(189_302_415_000)).toBe(189_302_400_000)
        expect(taiConverter.atomicToUnix(220_924_816_000)).toBe(220_924_800_000)
        expect(taiConverter.atomicToUnix(252_460_817_000)).toBe(252_460_800_000)
        expect(taiConverter.atomicToUnix(283_996_818_000)).toBe(283_996_800_000)
        expect(taiConverter.atomicToUnix(315_532_819_000)).toBe(315_532_800_000)
        expect(taiConverter.atomicToUnix(362_793_620_000)).toBe(362_793_600_000)
        expect(taiConverter.atomicToUnix(394_329_621_000)).toBe(394_329_600_000)
        expect(taiConverter.atomicToUnix(425_865_622_000)).toBe(425_865_600_000)
        expect(taiConverter.atomicToUnix(489_024_023_000)).toBe(489_024_000_000)
        expect(taiConverter.atomicToUnix(567_993_624_000)).toBe(567_993_600_000)
        expect(taiConverter.atomicToUnix(631_152_025_000)).toBe(631_152_000_000)
        expect(taiConverter.atomicToUnix(662_688_026_000)).toBe(662_688_000_000)
        expect(taiConverter.atomicToUnix(709_948_827_000)).toBe(709_948_800_000)
        expect(taiConverter.atomicToUnix(741_484_828_000)).toBe(741_484_800_000)
        expect(taiConverter.atomicToUnix(773_020_829_000)).toBe(773_020_800_000)
        expect(taiConverter.atomicToUnix(820_454_430_000)).toBe(820_454_400_000)
        expect(taiConverter.atomicToUnix(867_715_231_000)).toBe(867_715_200_000)
        expect(taiConverter.atomicToUnix(915_148_832_000)).toBe(915_148_800_000)
        expect(taiConverter.atomicToUnix(1_136_073_633_000)).toBe(1_136_073_600_000)
        expect(taiConverter.atomicToUnix(1_230_768_034_000)).toBe(1_230_768_000_000)
        expect(taiConverter.atomicToUnix(1_341_100_835_000)).toBe(1_341_100_800_000)
        expect(taiConverter.atomicToUnix(1_435_708_836_000)).toBe(1_435_708_800_000)
        expect(taiConverter.atomicToUnix(1_483_228_837_000)).toBe(1_483_228_800_000)
      })
    })

    describe('round trips', () => {
      describe('unixToAtomic and back', () => {
        const numbers = [
          // Pre 9172, round trips DO NOT work due to rounding behaviour
          63_072_010_000,
          78_796_811_000,
          94_694_412_000,
          126_230_413_000,
          157_766_414_000,
          189_302_415_000,
          220_924_816_000,
          252_460_817_000,
          283_996_818_000,
          315_532_819_000,
          362_793_620_000,
          394_329_621_000,
          425_865_622_000,
          489_024_023_000,
          567_993_624_000,
          631_152_025_000,
          662_688_026_000,
          709_948_827_000,
          741_484_828_000,
          773_020_829_000,
          820_454_430_000,
          867_715_231_000,
          915_148_832_000,
          1_136_073_633_000,
          1_230_768_034_000,
          1_341_100_835_000,
          1_435_708_836_000,
          1_483_228_837_000
        ]
        numbers.forEach(number => {
          it(String(number), () => {
            expect(taiConverter.atomicToUnix(taiConverter.unixToAtomic(number))).toBe(number)
          })
        })
      })

      describe('atomicToUnix and back', () => {
        const numbers = [
          // Pre 9172, round trips DO NOT work due to rounding behaviour
          63_072_010_000,
          78_796_811_000,
          94_694_412_000,
          126_230_413_000,
          157_766_414_000,
          189_302_415_000,
          220_924_816_000,
          252_460_817_000,
          283_996_818_000,
          315_532_819_000,
          362_793_620_000,
          394_329_621_000,
          425_865_622_000,
          489_024_023_000,
          567_993_624_000,
          631_152_025_000,
          662_688_026_000,
          709_948_827_000,
          741_484_828_000,
          773_020_829_000,
          820_454_430_000,
          867_715_231_000,
          915_148_832_000,
          1_136_073_633_000,
          1_230_768_034_000,
          1_341_100_835_000,
          1_435_708_836_000,
          1_483_228_837_000
        ]
        numbers.forEach(number => {
          it(String(number), () => {
            expect(taiConverter.unixToAtomic(taiConverter.atomicToUnix(number))).toBe(number)
          })
        })
      })
    })
  })

  describe('smearing', () => {
    const taiConverter = TaiConverter(MODELS.SMEAR)

    it('smears', () => {
      expect(taiConverter.unixToAtomic(Date.UTC(2016, DEC, 31, 0, 0, 0, 0)))
        .toBe(Date.UTC(2016, DEC, 31, 0, 0, 36, 0))
      expect(taiConverter.unixToAtomic(Date.UTC(2016, DEC, 31, 12, 0, 0, 0)))
        .toBe(Date.UTC(2016, DEC, 31, 12, 0, 36, 0))
      expect(taiConverter.unixToAtomic(Date.UTC(2016, DEC, 31, 12, 0, 0, 1)))
        .toBe(Date.UTC(2016, DEC, 31, 12, 0, 36, 1))

      // After 86_400 Unix milliseconds, 86_401 TAI milliseconds have passed
      expect(taiConverter.unixToAtomic(Date.UTC(2016, DEC, 31, 12, 1, 26, 399)))
        .toBe(Date.UTC(2016, DEC, 31, 12, 2, 2, 399))
      expect(taiConverter.unixToAtomic(Date.UTC(2016, DEC, 31, 12, 1, 26, 400)))
        .toBe(Date.UTC(2016, DEC, 31, 12, 2, 2, 401))

      // After 12 Unix hours, 12 TAI hours and 500 milliseconds
      expect(taiConverter.unixToAtomic(Date.UTC(2017, JAN, 1, 0, 0, 0, 0)))
        .toBe(Date.UTC(2017, JAN, 1, 0, 0, 36, 500))

      // After 24 Unix hours, 24 TAI hours and 1 second
      expect(taiConverter.unixToAtomic(Date.UTC(2017, JAN, 1, 12, 0, 0, 0)))
        .toBe(Date.UTC(2017, JAN, 1, 12, 0, 37))
    })
  })
})

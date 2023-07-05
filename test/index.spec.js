import assert from 'node:assert'
import { describe, it } from 'mocha'
import { TaiConverter, MODELS, UNIX_START, UNIX_END } from '../src/index.js'

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
    assert.strictEqual(UNIX_START, Date.UTC(1961, JAN, 1))
  })
})

describe('UNIX_END', () => {
  it('is correct', () => {
    const endDate = new Date(UNIX_END)

    if (endDate.getUTCMonth() === JUN) {
      assert.strictEqual(endDate.getUTCDate(), 30)
    } else if (endDate.getUTCMonth() === DEC) {
      assert.strictEqual(endDate.getUTCDate(), 31)
    } else {
      throw Error('bad month')
    }

    assert.strictEqual(endDate.getUTCHours(), 12)
    assert.strictEqual(endDate.getUTCMinutes(), 0)
    assert.strictEqual(endDate.getUTCSeconds(), 0)
    assert.strictEqual(endDate.getUTCMilliseconds(), 0)
  })
})

describe('TaiConverter', () => {
  describe('OVERRUN', () => {
    const taiConverter = TaiConverter(MODELS.OVERRUN)

    describe('unixToAtomic (array mode)', () => {
      const unixToAtomic = unixMillis => taiConverter.unixToAtomic(unixMillis, { array: true })

      it('starts TAI at 1961-01-01 00:00:01.422_818', () => {
        // 00:00:01.422_818 is in range, but rounds down to 00:00:01.422 which technically is not
        assert.deepStrictEqual(unixToAtomic(Date.UTC(1961, JAN, 1, 0, 0, 0, 0)),
          [-283_996_798_578])
      })

      it('advances 15 TAI picoseconds per Unix millisecond', () => {
        assert.deepStrictEqual(unixToAtomic(Date.UTC(1961, JAN, 1, 0, 0, 0, 1)),
          [Date.UTC(1961, JAN, 1, 0, 0, 1, 423)])
        assert.deepStrictEqual(unixToAtomic(Date.UTC(1961, JAN, 1, 0, 0, 0, 2)),
          [Date.UTC(1961, JAN, 1, 0, 0, 1, 424)])
        assert.deepStrictEqual(unixToAtomic(Date.UTC(1961, JAN, 1, 0, 0, 0, 3)),
          [Date.UTC(1961, JAN, 1, 0, 0, 1, 425)])
      })

      it('advances 0.001_296 TAI seconds per Unix day', () => {
        assert.deepStrictEqual(unixToAtomic(Date.UTC(1961, JAN, 2, 0, 0, 0, 0)),
          [Date.UTC(1961, JAN, 2, 0, 0, 1, 424)])
        // It's 1.424_114 but gets rounded down to 1.424_000
      })

      it('makes certain TAI millisecond counts inaccessible', () => {
        assert.deepStrictEqual(unixToAtomic(-283_984_666_668),
          [-283_984_665_246]) // -283_984_665_245.000_000_020 rounded towards negative infinity
        assert.deepStrictEqual(unixToAtomic(-283_984_666_667),
          [-283_984_665_245]) // -283_984_665_244.000_000_005 rounded towards negative infinity

        // it's not possible to get a result of [-283_984_665_244.xxx_xxx_xxx]

        assert.deepStrictEqual(unixToAtomic(-283_984_666_666),
          [-283_984_665_243]) // -283_984_665_242.999_999_990 rounded towards negative infinity
        assert.deepStrictEqual(unixToAtomic(-283_984_666_665),
          [-283_984_665_242]) // -283_984_665_241.999_999_975 rounded towards negative infinity
      })
    })

    describe('unixToAtomic', () => {
      it('starts TAI at 1961-01-01 00:00:01.422_818', () => {
        // 00:00:01.422_818 is in range, but rounds down to 00:00:01.422 which is not
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1961, JAN, 1, 0, 0, 0, 0)),
          -283_996_798_578)
      })

      it('advances 15 TAI picoseconds per Unix millisecond', () => {
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1961, JAN, 1, 0, 0, 0, 1)),
          Date.UTC(1961, JAN, 1, 0, 0, 1, 423))
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1961, JAN, 1, 0, 0, 0, 2)),
          Date.UTC(1961, JAN, 1, 0, 0, 1, 424))
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1961, JAN, 1, 0, 0, 0, 3)),
          Date.UTC(1961, JAN, 1, 0, 0, 1, 425))
      })

      it('advances 0.001_296 TAI seconds per Unix day', () => {
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1961, JAN, 2, 0, 0, 0, 0)),
          Date.UTC(1961, JAN, 2, 0, 0, 1, 424))
        // It's 1.424_114 but gets rounded down to 1.424_000
      })

      it('makes certain TAI millisecond counts inaccessible', () => {
        assert.strictEqual(taiConverter.unixToAtomic(-283_984_666_668),
          -283_984_665_246) // -283_984_665_245.000_000_020 rounded towards negative infinity
        assert.strictEqual(taiConverter.unixToAtomic(-283_984_666_667),
          -283_984_665_245) // -283_984_665_244.000_000_005 rounded towards negative infinity

        // it's not possible to get a result of -283_984_665_244.xxx_xxx_xxx

        assert.strictEqual(taiConverter.unixToAtomic(-283_984_666_666),
          -283_984_665_243) // -283_984_665_242.999_999_990 rounded towards negative infinity
        assert.strictEqual(taiConverter.unixToAtomic(-283_984_666_665),
          -283_984_665_242) // -283_984_665_241.999_999_975 rounded towards negative infinity
      })
    })

    describe('atomicToUnix', () => {
      it('The NEW earliest instant in TAI', () => {
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1961, JAN, 1, 0, 0, 1, 422)),
          NaN)

        // Actual start of TAI: 1961-01-01 00:00:01.422_818
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1961, JAN, 1, 0, 0, 1, 423)),
          Date.UTC(1961, JAN, 1, 0, 0, 0, 0))
        assert.strictEqual(taiConverter.atomicToUnix(-283_996_798_577),
          -283_996_800_000) // same
      })

      it('start of 1972', () => {
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 9, 998)),
          Date.UTC(1972, JAN, 1, 0, 0, 0, 105))
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 9, 998)),
          63_072_000_105) // same

        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 9, 999)),
          Date.UTC(1972, JAN, 1, 0, 0, 0, 106))
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 9, 999)),
          63_072_000_106) // same

        // After this point in time, conversions become far simpler and always integer numbers of milliseconds
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 10, 0)),
          Date.UTC(1972, JAN, 1, 0, 0, 0, 0))
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 10, 1)),
          Date.UTC(1972, JAN, 1, 0, 0, 0, 1))
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 10, 2)),
          Date.UTC(1972, JAN, 1, 0, 0, 0, 2))
        // etc.
      })

      it('typical', () => {
        // A typical leap second from the past, note repetition
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 29, 750)),
          Date.UTC(1998, DEC, 31, 23, 59, 58, 750))
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30, 0)),
          Date.UTC(1998, DEC, 31, 23, 59, 59, 0))
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30, 250)),
          Date.UTC(1998, DEC, 31, 23, 59, 59, 250))
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30, 500)),
          Date.UTC(1998, DEC, 31, 23, 59, 59, 500))
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30, 750)),
          Date.UTC(1998, DEC, 31, 23, 59, 59, 750))
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 0)),
          Date.UTC(1999, JAN, 1, 0, 0, 0, 0))
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 250)),
          Date.UTC(1999, JAN, 1, 0, 0, 0, 250))
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 500)),
          Date.UTC(1999, JAN, 1, 0, 0, 0, 500))
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 750)),
          Date.UTC(1999, JAN, 1, 0, 0, 0, 750))
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 32, 0)),
          Date.UTC(1999, JAN, 1, 0, 0, 0, 0)) // repetition
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 32, 250)),
          Date.UTC(1999, JAN, 1, 0, 0, 0, 250)) // repetition
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 32, 500)),
          Date.UTC(1999, JAN, 1, 0, 0, 0, 500)) // repetition
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 32, 750)),
          Date.UTC(1999, JAN, 1, 0, 0, 0, 750)) // repetition
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 33, 0)),
          Date.UTC(1999, JAN, 1, 0, 0, 1, 0))
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 33, 250)),
          Date.UTC(1999, JAN, 1, 0, 0, 1, 250))
      })
    })

    describe('TAI->Unix conversions', () => {
      it('now-ish', () => {
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(2016, OCT, 27, 20, 5, 50, 678)),
          Date.UTC(2016, OCT, 27, 20, 5, 14, 678))
      })
    })

    describe('Unix->TAI conversions', () => {
      it('The NEW earliest instant in TAI', () => {
        assert.deepStrictEqual(taiConverter.unixToAtomic(Date.UTC(1960, DEC, 31, 23, 59, 59, 999), { array: true }),
          [])
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1960, DEC, 31, 23, 59, 59, 999)),
          NaN)
      })

      it('icky', () => {
        // Again with the icky floating point comparisons. Fun fact! There is about 105 leap milliseconds here!
        assert.deepStrictEqual(taiConverter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 0), { array: true }),
          [
            Date.UTC(1972, JAN, 1, 0, 0, 9, 892), // should be + 0.242_004 but rounded towards 1970
            Date.UTC(1972, JAN, 1, 0, 0, 10, 0)
          ])
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 0)),
          Date.UTC(1972, JAN, 1, 0, 0, 10, 0))
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 1), { array: true }).length,
          2)
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 1), { array: true })[1],
          Date.UTC(1972, JAN, 1, 0, 0, 10, 1))
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 1)),
          Date.UTC(1972, JAN, 1, 0, 0, 10, 1))
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 2)),
          Date.UTC(1972, JAN, 1, 0, 0, 10, 2))
        // etc.
      })

      it('typical (array mode)', () => {
        // A typical leap second from the past, note repetition
        assert.deepStrictEqual(taiConverter.unixToAtomic(Date.UTC(1998, DEC, 31, 23, 59, 59, 750), { array: true }),
          [
            Date.UTC(1999, JAN, 1, 0, 0, 30, 750)
          ])
        assert.deepStrictEqual(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 0), { array: true }),
          [
            Date.UTC(1999, JAN, 1, 0, 0, 31, 0),
            Date.UTC(1999, JAN, 1, 0, 0, 32, 0)
          ])
        assert.deepStrictEqual(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 250), { array: true }),
          [
            Date.UTC(1999, JAN, 1, 0, 0, 31, 250),
            Date.UTC(1999, JAN, 1, 0, 0, 32, 250)
          ])
        assert.deepStrictEqual(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 500), { array: true }),
          [
            Date.UTC(1999, JAN, 1, 0, 0, 31, 500),
            Date.UTC(1999, JAN, 1, 0, 0, 32, 500)
          ])
        assert.deepStrictEqual(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 750), { array: true }),
          [
            Date.UTC(1999, JAN, 1, 0, 0, 31, 750),
            Date.UTC(1999, JAN, 1, 0, 0, 32, 750)
          ])
        assert.deepStrictEqual(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 1, 0), { array: true }),
          [
            Date.UTC(1999, JAN, 1, 0, 0, 33, 0)
          ])
      })

      it('typical', () => {
        // A typical leap second from the past, note repetition
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1998, DEC, 31, 23, 59, 59, 750)),
          Date.UTC(1999, JAN, 1, 0, 0, 30, 750))
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 0)),
          Date.UTC(1999, JAN, 1, 0, 0, 32, 0))
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 250)),
          Date.UTC(1999, JAN, 1, 0, 0, 32, 250))
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 500)),
          Date.UTC(1999, JAN, 1, 0, 0, 32, 500))
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 750)),
          Date.UTC(1999, JAN, 1, 0, 0, 32, 750))
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 1, 0)),
          Date.UTC(1999, JAN, 1, 0, 0, 33, 0))
      })
    })

    it('Demo', () => {
      assert.deepStrictEqual(taiConverter.unixToAtomic(915_148_800_000, { array: true }),
        [915_148_831_000, 915_148_832_000])
      assert.strictEqual(taiConverter.unixToAtomic(915_148_800_000),
        915_148_832_000)
      assert.strictEqual(taiConverter.atomicToUnix(915_148_831_000),
        915_148_800_000)
      assert.strictEqual(taiConverter.atomicToUnix(915_148_832_000),
        915_148_800_000)
    })

    it('Crazy pre-1972 nonsense', () => {
      // At the beginning of 1962, the drift rate changed, with no discontinuity in UTC.

      // Prior ray
      // TAI picosecond count rounds to -252_460_798_155 which is not in range
      assert.deepStrictEqual(taiConverter.unixToAtomic(Date.UTC(1961, DEC, 31, 23, 59, 59, 999), { array: true }),
        [Date.UTC(1962, JAN, 1, 0, 0, 1, 844)])
      assert.deepStrictEqual(taiConverter.unixToAtomic(Date.UTC(1962, JAN, 1, 0, 0, 0, 0), { array: true }),
        [-252_460_798_155])
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1962, JAN, 1, 0, 0, 0, 0)),
        -252_460_798_155)

      // Next ray
      assert.deepStrictEqual(taiConverter.unixToAtomic(Date.UTC(1962, JAN, 1, 0, 0, 0, 1), { array: true }),
        [Date.UTC(1962, JAN, 1, 0, 0, 1, 846)])
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1962, JAN, 1, 0, 0, 0, 1)),
        -252_460_798_154)
    })

    it('inserted tenth', () => {
      // Oh look, an inserted leap tenth of a second!
      // The period between 1965-09-01 00:00:00 and 00:00:00.100 UTC happened twice!
      assert.deepStrictEqual(taiConverter.unixToAtomic(Date.UTC(1965, SEP, 1, 0, 0, 0, 50), { array: true }),
        [
          Date.UTC(1965, SEP, 1, 0, 0, 4, 105),
          Date.UTC(1965, SEP, 1, 0, 0, 4, 205)
        ])
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1965, SEP, 1, 0, 0, 0, 50)),
        Date.UTC(1965, SEP, 1, 0, 0, 4, 205))
    })

    it('removed twentieth', () => {
      // Hey, what! A removed leap twentieth of a second???
      // Well, technically, that's 1/20th of a TAI second, which is SLIGHTLY LESS than 1/20th of a UTC second
      // Which means that 23:59:59.950 UTC *does* actually exist...
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1961, JUL, 31, 23, 59, 59, 949), { array: true }).length,
        1)
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1961, JUL, 31, 23, 59, 59, 949)),
        -265_679_998_354)

      assert.deepStrictEqual(taiConverter.unixToAtomic(Date.UTC(1961, JUL, 31, 23, 59, 59, 950), { array: true }),
        [-265_679_998_353])
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1961, JUL, 31, 23, 59, 59, 950)),
        -265_679_998_353)

      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1961, JUL, 31, 23, 59, 59, 951), { array: true }).length,
        0)
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1961, JUL, 31, 23, 59, 59, 951)),
        NaN)

      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1961, JUL, 31, 23, 59, 59, 999), { array: true }).length,
        0)
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1961, JUL, 31, 23, 59, 59, 999)),
        NaN)

      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1961, AUG, 1, 0, 0, 0, 0), { array: true }).length,
        1)
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1961, AUG, 1, 0, 0, 0, 0)),
        -265_679_998_353)

      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1961, AUG, 1, 0, 0, 0, 1), { array: true }).length,
        1)
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1961, AUG, 1, 0, 0, 0, 1)),
        -265_679_998_352)

      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1961, AUG, 1, 0, 0, 0, 2), { array: true }).length,
        1)
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1961, AUG, 1, 0, 0, 0, 2)),
        -265_679_998_351)

      assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1961, AUG, 1, 0, 0, 1, 647)),
        Date.UTC(1961, JUL, 31, 23, 59, 59, 949))
    })

    it('boundaries', () => {
      // Let's check out some boundaries where the relationship between TAI and UTC changed
      // 1 January 1962: Perfect continuity (although the drift rate changed)
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1961, DEC, 31, 23, 59, 59, 999), { array: true }).length,
        1)
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1962, JAN, 1, 0, 0, 0, 0), { array: true }).length,
        1)
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1962, JAN, 1, 0, 0, 0, 1), { array: true }).length,
        1)

      // 1 January 1964: Perfect continuity (drift rate changes)
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1963, DEC, 31, 23, 59, 59, 999), { array: true }).length,
        1)
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1964, JAN, 1, 0, 0, 0, 0), { array: true }).length,
        1)
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1964, JAN, 1, 0, 0, 0, 1), { array: true }).length,
        1)

      // 1 April 1964: 0.1 TAI seconds inserted
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1964, MAR, 31, 23, 59, 59, 999), { array: true }).length,
        1)
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1964, APR, 1, 0, 0, 0, 0), { array: true }).length,
        2)
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1964, APR, 1, 0, 0, 0, 99), { array: true }).length,
        2)
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1964, APR, 1, 0, 0, 0, 100), { array: true }).length,
        1)

      // etc. (various occasions when 0.1 TAI seconds were inserted)
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1964, SEP, 1, 0, 0, 0, 99), { array: true }).length,
        2)
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1965, JAN, 1, 0, 0, 0, 99), { array: true }).length,
        2)
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1965, MAR, 1, 0, 0, 0, 99), { array: true }).length,
        2)
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1965, JUL, 1, 0, 0, 0, 99), { array: true }).length,
        2)
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1965, SEP, 1, 0, 0, 0, 99), { array: true }).length,
        2)

      // 1 January 1966: Perfect continuity (drift rate changes)
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1965, DEC, 31, 23, 59, 59, 999), { array: true }).length,
        1)
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1966, JAN, 1, 0, 0, 0, 0), { array: true }).length,
        1)
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1966, JAN, 1, 0, 0, 0, 1), { array: true }).length,
        1)

      // 1 February 1968: 0.1 TAI seconds removed
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1968, JAN, 31, 23, 59, 59, 899), { array: true }).length,
        1)
      assert.deepStrictEqual(taiConverter.unixToAtomic(Date.UTC(1968, JAN, 31, 23, 59, 59, 900), { array: true }),
        [-60_479_993_815])

      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1968, JAN, 31, 23, 59, 59, 901), { array: true }).length,
        0)
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1968, JAN, 31, 23, 59, 59, 999), { array: true }).length,
        0)
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1968, FEB, 1, 0, 0, 0, 0), { array: true }).length,
        1)

      // 1 January 1972: 0.107_758 TAI seconds inserted
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1971, DEC, 31, 23, 59, 59, 999), { array: true }).length,
        1)
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 0), { array: true }).length,
        2)
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 107), { array: true }).length,
        2)
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 108), { array: true }).length,
        1)

      // Removed time
      assert.strictEqual(taiConverter.unixToAtomic(-265_680_000_051, { array: true }).length,
        1)
      assert.strictEqual(taiConverter.unixToAtomic(-265_680_000_050, { array: true }).length,
        1)
      assert.strictEqual(taiConverter.unixToAtomic(-265_680_000_049, { array: true }).length,
        0)
      assert.strictEqual(taiConverter.unixToAtomic(-265_680_000_048, { array: true }).length,
        0)

      assert.strictEqual(taiConverter.unixToAtomic(-252_460_800_000, { array: true }).length,
        1)
      assert.strictEqual(taiConverter.unixToAtomic(-194_659_199_900, { array: true }).length,
        1)
      assert.strictEqual(taiConverter.unixToAtomic(-189_388_800_000, { array: true }).length,
        1)
      assert.strictEqual(taiConverter.unixToAtomic(-181_526_399_900, { array: true }).length,
        1)
      assert.strictEqual(taiConverter.unixToAtomic(-168_307_199_900, { array: true }).length,
        1)
      assert.strictEqual(taiConverter.unixToAtomic(-157_766_399_900, { array: true }).length,
        1)
      assert.strictEqual(taiConverter.unixToAtomic(-152_668_799_900, { array: true }).length,
        1)
      assert.strictEqual(taiConverter.unixToAtomic(-142_127_999_900, { array: true }).length,
        1)
      assert.strictEqual(taiConverter.unixToAtomic(-136_771_199_900, { array: true }).length,
        1)
      assert.strictEqual(taiConverter.unixToAtomic(-126_230_400_000, { array: true }).length,
        1)

      // Removed time
      assert.strictEqual(taiConverter.unixToAtomic(-60_480_000_101, { array: true }).length,
        1)
      assert.strictEqual(taiConverter.unixToAtomic(-60_480_000_100, { array: true }).length,
        1)
      assert.strictEqual(taiConverter.unixToAtomic(-60_480_000_099, { array: true }).length,
        0)
      assert.strictEqual(taiConverter.unixToAtomic(-60_480_000_098, { array: true }).length,
        0)

      assert.strictEqual(taiConverter.unixToAtomic(63_072_000_106, { array: true }).length,
        2)
      assert.strictEqual(taiConverter.unixToAtomic(63_072_000_107, { array: true }).length,
        2)
      assert.strictEqual(taiConverter.unixToAtomic(63_072_000_108, { array: true }).length,
        1)
      assert.strictEqual(taiConverter.unixToAtomic(63_072_000_109, { array: true }).length,
        1)
    })

    describe('TAI raw data conversion unit tests based on magic numbers', () => {
      it('taiConverter.unixToAtomic (range mode)', () => {
        assert.deepStrictEqual(taiConverter.unixToAtomic(63_072_010_000, { array: true }), [63_072_020_000])
        assert.deepStrictEqual(taiConverter.unixToAtomic(78_796_811_000, { array: true }), [78_796_822_000])
        assert.deepStrictEqual(taiConverter.unixToAtomic(94_694_412_000, { array: true }), [94_694_424_000])
        assert.deepStrictEqual(taiConverter.unixToAtomic(126_230_413_000, { array: true }), [126_230_426_000])
        assert.deepStrictEqual(taiConverter.unixToAtomic(157_766_414_000, { array: true }), [157_766_428_000])
        assert.deepStrictEqual(taiConverter.unixToAtomic(189_302_415_000, { array: true }), [189_302_430_000])
        assert.deepStrictEqual(taiConverter.unixToAtomic(220_924_816_000, { array: true }), [220_924_832_000])
        assert.deepStrictEqual(taiConverter.unixToAtomic(252_460_817_000, { array: true }), [252_460_834_000])
        assert.deepStrictEqual(taiConverter.unixToAtomic(283_996_818_000, { array: true }), [283_996_836_000])
        assert.deepStrictEqual(taiConverter.unixToAtomic(315_532_819_000, { array: true }), [315_532_838_000])
        assert.deepStrictEqual(taiConverter.unixToAtomic(362_793_620_000, { array: true }), [362_793_640_000])
        assert.deepStrictEqual(taiConverter.unixToAtomic(394_329_621_000, { array: true }), [394_329_642_000])
        assert.deepStrictEqual(taiConverter.unixToAtomic(425_865_622_000, { array: true }), [425_865_644_000])
        assert.deepStrictEqual(taiConverter.unixToAtomic(489_024_023_000, { array: true }), [489_024_046_000])
        assert.deepStrictEqual(taiConverter.unixToAtomic(567_993_624_000, { array: true }), [567_993_648_000])
        assert.deepStrictEqual(taiConverter.unixToAtomic(631_152_025_000, { array: true }), [631_152_050_000])
        assert.deepStrictEqual(taiConverter.unixToAtomic(662_688_026_000, { array: true }), [662_688_052_000])
        assert.deepStrictEqual(taiConverter.unixToAtomic(709_948_827_000, { array: true }), [709_948_854_000])
        assert.deepStrictEqual(taiConverter.unixToAtomic(741_484_828_000, { array: true }), [741_484_856_000])
        assert.deepStrictEqual(taiConverter.unixToAtomic(773_020_829_000, { array: true }), [773_020_858_000])
        assert.deepStrictEqual(taiConverter.unixToAtomic(820_454_430_000, { array: true }), [820_454_460_000])
        assert.deepStrictEqual(taiConverter.unixToAtomic(867_715_231_000, { array: true }), [867_715_262_000])
        assert.deepStrictEqual(taiConverter.unixToAtomic(915_148_832_000, { array: true }), [915_148_864_000])
        assert.deepStrictEqual(taiConverter.unixToAtomic(1_136_073_633_000, { array: true }), [1_136_073_666_000])
        assert.deepStrictEqual(taiConverter.unixToAtomic(1_230_768_034_000, { array: true }), [1_230_768_068_000])
        assert.deepStrictEqual(taiConverter.unixToAtomic(1_341_100_835_000, { array: true }), [1_341_100_870_000])
        assert.deepStrictEqual(taiConverter.unixToAtomic(1_435_708_836_000, { array: true }), [1_435_708_872_000])
        assert.deepStrictEqual(taiConverter.unixToAtomic(1_483_228_837_000, { array: true }), [1_483_228_874_000])
      })

      it('taiConverter.unixToAtomic', () => {
        assert.deepStrictEqual(taiConverter.unixToAtomic(63_072_010_000), 63_072_020_000)
        assert.deepStrictEqual(taiConverter.unixToAtomic(78_796_811_000), 78_796_822_000)
        assert.deepStrictEqual(taiConverter.unixToAtomic(94_694_412_000), 94_694_424_000)
        assert.deepStrictEqual(taiConverter.unixToAtomic(126_230_413_000), 126_230_426_000)
        assert.deepStrictEqual(taiConverter.unixToAtomic(157_766_414_000), 157_766_428_000)
        assert.deepStrictEqual(taiConverter.unixToAtomic(189_302_415_000), 189_302_430_000)
        assert.deepStrictEqual(taiConverter.unixToAtomic(220_924_816_000), 220_924_832_000)
        assert.deepStrictEqual(taiConverter.unixToAtomic(252_460_817_000), 252_460_834_000)
        assert.deepStrictEqual(taiConverter.unixToAtomic(283_996_818_000), 283_996_836_000)
        assert.deepStrictEqual(taiConverter.unixToAtomic(315_532_819_000), 315_532_838_000)
        assert.deepStrictEqual(taiConverter.unixToAtomic(362_793_620_000), 362_793_640_000)
        assert.deepStrictEqual(taiConverter.unixToAtomic(394_329_621_000), 394_329_642_000)
        assert.deepStrictEqual(taiConverter.unixToAtomic(425_865_622_000), 425_865_644_000)
        assert.deepStrictEqual(taiConverter.unixToAtomic(489_024_023_000), 489_024_046_000)
        assert.deepStrictEqual(taiConverter.unixToAtomic(567_993_624_000), 567_993_648_000)
        assert.deepStrictEqual(taiConverter.unixToAtomic(631_152_025_000), 631_152_050_000)
        assert.deepStrictEqual(taiConverter.unixToAtomic(662_688_026_000), 662_688_052_000)
        assert.deepStrictEqual(taiConverter.unixToAtomic(709_948_827_000), 709_948_854_000)
        assert.deepStrictEqual(taiConverter.unixToAtomic(741_484_828_000), 741_484_856_000)
        assert.deepStrictEqual(taiConverter.unixToAtomic(773_020_829_000), 773_020_858_000)
        assert.deepStrictEqual(taiConverter.unixToAtomic(820_454_430_000), 820_454_460_000)
        assert.deepStrictEqual(taiConverter.unixToAtomic(867_715_231_000), 867_715_262_000)
        assert.deepStrictEqual(taiConverter.unixToAtomic(915_148_832_000), 915_148_864_000)
        assert.deepStrictEqual(taiConverter.unixToAtomic(1_136_073_633_000), 1_136_073_666_000)
        assert.deepStrictEqual(taiConverter.unixToAtomic(1_230_768_034_000), 1_230_768_068_000)
        assert.deepStrictEqual(taiConverter.unixToAtomic(1_341_100_835_000), 1_341_100_870_000)
        assert.deepStrictEqual(taiConverter.unixToAtomic(1_435_708_836_000), 1_435_708_872_000)
        assert.deepStrictEqual(taiConverter.unixToAtomic(1_483_228_837_000), 1_483_228_874_000)
      })

      it('taiConverter.atomicToUnix', () => {
        assert.strictEqual(taiConverter.atomicToUnix(-283_996_800_000), NaN)
        assert.strictEqual(taiConverter.atomicToUnix(63_072_010_000), 63_072_000_000)
        assert.strictEqual(taiConverter.atomicToUnix(78_796_811_000), 78_796_800_000)
        assert.strictEqual(taiConverter.atomicToUnix(94_694_412_000), 94_694_400_000)
        assert.strictEqual(taiConverter.atomicToUnix(126_230_413_000), 126_230_400_000)
        assert.strictEqual(taiConverter.atomicToUnix(157_766_414_000), 157_766_400_000)
        assert.strictEqual(taiConverter.atomicToUnix(189_302_415_000), 189_302_400_000)
        assert.strictEqual(taiConverter.atomicToUnix(220_924_816_000), 220_924_800_000)
        assert.strictEqual(taiConverter.atomicToUnix(252_460_817_000), 252_460_800_000)
        assert.strictEqual(taiConverter.atomicToUnix(283_996_818_000), 283_996_800_000)
        assert.strictEqual(taiConverter.atomicToUnix(315_532_819_000), 315_532_800_000)
        assert.strictEqual(taiConverter.atomicToUnix(362_793_620_000), 362_793_600_000)
        assert.strictEqual(taiConverter.atomicToUnix(394_329_621_000), 394_329_600_000)
        assert.strictEqual(taiConverter.atomicToUnix(425_865_622_000), 425_865_600_000)
        assert.strictEqual(taiConverter.atomicToUnix(489_024_023_000), 489_024_000_000)
        assert.strictEqual(taiConverter.atomicToUnix(567_993_624_000), 567_993_600_000)
        assert.strictEqual(taiConverter.atomicToUnix(631_152_025_000), 631_152_000_000)
        assert.strictEqual(taiConverter.atomicToUnix(662_688_026_000), 662_688_000_000)
        assert.strictEqual(taiConverter.atomicToUnix(709_948_827_000), 709_948_800_000)
        assert.strictEqual(taiConverter.atomicToUnix(741_484_828_000), 741_484_800_000)
        assert.strictEqual(taiConverter.atomicToUnix(773_020_829_000), 773_020_800_000)
        assert.strictEqual(taiConverter.atomicToUnix(820_454_430_000), 820_454_400_000)
        assert.strictEqual(taiConverter.atomicToUnix(867_715_231_000), 867_715_200_000)
        assert.strictEqual(taiConverter.atomicToUnix(915_148_832_000), 915_148_800_000)
        assert.strictEqual(taiConverter.atomicToUnix(1_136_073_633_000), 1_136_073_600_000)
        assert.strictEqual(taiConverter.atomicToUnix(1_230_768_034_000), 1_230_768_000_000)
        assert.strictEqual(taiConverter.atomicToUnix(1_341_100_835_000), 1_341_100_800_000)
        assert.strictEqual(taiConverter.atomicToUnix(1_435_708_836_000), 1_435_708_800_000)
        assert.strictEqual(taiConverter.atomicToUnix(1_483_228_837_000), 1_483_228_800_000)
      })
    })
  })

  describe('STALL', () => {
    const taiConverter = TaiConverter(MODELS.STALL)

    describe('atomicToUnix', () => {
      it('The NEW earliest instant in TAI', () => {
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1961, JAN, 1, 0, 0, 1, 422)), NaN)
        assert.strictEqual(taiConverter.atomicToUnix(-283_996_798_578), NaN) // same

        // Actual start of TAI: 1961-01-01 00:00:01.422_818
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1961, JAN, 1, 0, 0, 1, 423)),
          Date.UTC(1961, JAN, 1, 0, 0, 0, 0))
        assert.strictEqual(taiConverter.atomicToUnix(-283_996_798_577),
          -283_996_800_000) // same
      })

      it('handles the start of 1972', () => {
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 10, 0)),
          Date.UTC(1972, JAN, 1, 0, 0, 0, 0))
      })

      it('0.107_758 seconds added, start of 1972', () => {
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 9, 890)),
          Date.UTC(1971, DEC, 31, 23, 59, 59, 997))
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 9, 891)),
          Date.UTC(1971, DEC, 31, 23, 59, 59, 998))
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 9, 892)),
          Date.UTC(1971, DEC, 31, 23, 59, 59, 999))
        // instants from 1972-01-01 00:00:09.892_242 TAI onwards have multiple preimages
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 9, 893)),
          Date.UTC(1972, JAN, 1, 0, 0, 0, 0)) // stalled
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 9, 999)),
          Date.UTC(1972, JAN, 1, 0, 0, 0, 0)) // stalled
        // Leap time over
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 10, 0)),
          Date.UTC(1972, JAN, 1, 0, 0, 0, 0))

        // After this point in time, conversions become far simpler and always integer numbers of milliseconds
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 10, 1)),
          Date.UTC(1972, JAN, 1, 0, 0, 0, 1))
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 10, 2)),
          Date.UTC(1972, JAN, 1, 0, 0, 0, 2))
        // etc.
      })

      it('typical', () => {
        // A typical leap second from the past, note non-canonical times
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 29, 750)),
          Date.UTC(1998, DEC, 31, 23, 59, 58, 750))
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30, 0)),
          Date.UTC(1998, DEC, 31, 23, 59, 59, 0))
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30, 250)),
          Date.UTC(1998, DEC, 31, 23, 59, 59, 250))
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30, 500)),
          Date.UTC(1998, DEC, 31, 23, 59, 59, 500))
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30, 750)),
          Date.UTC(1998, DEC, 31, 23, 59, 59, 750))
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 0)),
          Date.UTC(1999, JAN, 1, 0, 0, 0, 0)) // stalled
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 250)),
          Date.UTC(1999, JAN, 1, 0, 0, 0, 0)) // stalled
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 500)),
          Date.UTC(1999, JAN, 1, 0, 0, 0, 0)) // stalled
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 750)),
          Date.UTC(1999, JAN, 1, 0, 0, 0, 0)) // stalled
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 32, 0)),
          Date.UTC(1999, JAN, 1, 0, 0, 0, 0)) // stalled
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 32, 250)),
          Date.UTC(1999, JAN, 1, 0, 0, 0, 250))
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 32, 500)),
          Date.UTC(1999, JAN, 1, 0, 0, 0, 500))
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 32, 750)),
          Date.UTC(1999, JAN, 1, 0, 0, 0, 750))
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 33, 0)),
          Date.UTC(1999, JAN, 1, 0, 0, 1, 0))
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 33, 250)),
          Date.UTC(1999, JAN, 1, 0, 0, 1, 250))
      })
    })

    describe('Unix->TAI conversions', () => {
      it('typical', () => {
        // A typical leap second from the past, note repetition
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1998, DEC, 31, 23, 59, 58, 750)),
          Date.UTC(1999, JAN, 1, 0, 0, 29, 750))
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1998, DEC, 31, 23, 59, 59, 0)),
          Date.UTC(1999, JAN, 1, 0, 0, 30, 0))
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1998, DEC, 31, 23, 59, 59, 250)),
          Date.UTC(1999, JAN, 1, 0, 0, 30, 250))
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1998, DEC, 31, 23, 59, 59, 500)),
          Date.UTC(1999, JAN, 1, 0, 0, 30, 500))
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1998, DEC, 31, 23, 59, 59, 750)),
          Date.UTC(1999, JAN, 1, 0, 0, 30, 750))
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 0)),
          Date.UTC(1999, JAN, 1, 0, 0, 32, 0))
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 250)),
          Date.UTC(1999, JAN, 1, 0, 0, 32, 250))
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 500)),
          Date.UTC(1999, JAN, 1, 0, 0, 32, 500))
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 750)),
          Date.UTC(1999, JAN, 1, 0, 0, 32, 750))
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 1, 0)),
          Date.UTC(1999, JAN, 1, 0, 0, 33, 0))
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 1, 250)),
          Date.UTC(1999, JAN, 1, 0, 0, 33, 250))
      })

      it('Now-ish', () => {
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(2016, OCT, 27, 20, 5, 14, 678)),
          Date.UTC(2016, OCT, 27, 20, 5, 50, 678))
      })
    })

    it('Demo', () => {
      assert.strictEqual(taiConverter.unixToAtomic(915_148_799_000),
        915_148_830_000)
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1998, DEC, 31, 23, 59, 59)),
        Date.UTC(1999, JAN, 1, 0, 0, 30))
      assert.strictEqual(taiConverter.atomicToUnix(915_148_830_000),
        915_148_799_000)
      assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30)),
        Date.UTC(1998, DEC, 31, 23, 59, 59))

      assert.strictEqual(taiConverter.atomicToUnix(915_148_831_000), 915_148_800_000)
      assert.strictEqual(taiConverter.atomicToUnix(915_148_831_001), 915_148_800_000)
      assert.strictEqual(taiConverter.atomicToUnix(915_148_832_000), 915_148_800_000)
      assert.strictEqual(taiConverter.atomicToUnix(915_148_832_001), 915_148_800_001)
    })

    it('Crazy pre-1972 nonsense', () => {
      // TAI picosecond count rounds to -252_460_798_155 which is not on the ray
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1962, JAN, 1, 0, 0, 0, 0)),
        -252_460_798_155)

      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1962, JAN, 1, 0, 0, 0, 1)),
        -252_460_798_154)
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1962, JAN, 1, 0, 0, 0, 1)),
        Date.UTC(1962, JAN, 1, 0, 0, 1, 846)) // Same
    })

    describe('TAI raw data conversion unit tests based on magic numbers', () => {
      it('taiConverter.unixToAtomic', () => {
        assert.strictEqual(taiConverter.unixToAtomic(63_072_010_000), 63_072_020_000)
        assert.strictEqual(taiConverter.unixToAtomic(78_796_811_000), 78_796_822_000)
        assert.strictEqual(taiConverter.unixToAtomic(94_694_412_000), 94_694_424_000)
        assert.strictEqual(taiConverter.unixToAtomic(126_230_413_000), 126_230_426_000)
        assert.strictEqual(taiConverter.unixToAtomic(157_766_414_000), 157_766_428_000)
        assert.strictEqual(taiConverter.unixToAtomic(189_302_415_000), 189_302_430_000)
        assert.strictEqual(taiConverter.unixToAtomic(220_924_816_000), 220_924_832_000)
        assert.strictEqual(taiConverter.unixToAtomic(252_460_817_000), 252_460_834_000)
        assert.strictEqual(taiConverter.unixToAtomic(283_996_818_000), 283_996_836_000)
        assert.strictEqual(taiConverter.unixToAtomic(315_532_819_000), 315_532_838_000)
        assert.strictEqual(taiConverter.unixToAtomic(362_793_620_000), 362_793_640_000)
        assert.strictEqual(taiConverter.unixToAtomic(394_329_621_000), 394_329_642_000)
        assert.strictEqual(taiConverter.unixToAtomic(425_865_622_000), 425_865_644_000)
        assert.strictEqual(taiConverter.unixToAtomic(489_024_023_000), 489_024_046_000)
        assert.strictEqual(taiConverter.unixToAtomic(567_993_624_000), 567_993_648_000)
        assert.strictEqual(taiConverter.unixToAtomic(631_152_025_000), 631_152_050_000)
        assert.strictEqual(taiConverter.unixToAtomic(662_688_026_000), 662_688_052_000)
        assert.strictEqual(taiConverter.unixToAtomic(709_948_827_000), 709_948_854_000)
        assert.strictEqual(taiConverter.unixToAtomic(741_484_828_000), 741_484_856_000)
        assert.strictEqual(taiConverter.unixToAtomic(773_020_829_000), 773_020_858_000)
        assert.strictEqual(taiConverter.unixToAtomic(820_454_430_000), 820_454_460_000)
        assert.strictEqual(taiConverter.unixToAtomic(867_715_231_000), 867_715_262_000)
        assert.strictEqual(taiConverter.unixToAtomic(915_148_832_000), 915_148_864_000)
        assert.strictEqual(taiConverter.unixToAtomic(1_136_073_633_000), 1_136_073_666_000)
        assert.strictEqual(taiConverter.unixToAtomic(1_230_768_034_000), 1_230_768_068_000)
        assert.strictEqual(taiConverter.unixToAtomic(1_341_100_835_000), 1_341_100_870_000)
        assert.strictEqual(taiConverter.unixToAtomic(1_435_708_836_000), 1_435_708_872_000)
        assert.strictEqual(taiConverter.unixToAtomic(1_483_228_837_000), 1_483_228_874_000)
      })

      it('taiConverter.atomicToUnix', () => {
        assert.strictEqual(taiConverter.atomicToUnix(-283_996_800_000), NaN)
        assert.strictEqual(taiConverter.atomicToUnix(63_072_010_000), 63_072_000_000)
        assert.strictEqual(taiConverter.atomicToUnix(78_796_811_000), 78_796_800_000)
        assert.strictEqual(taiConverter.atomicToUnix(94_694_412_000), 94_694_400_000)
        assert.strictEqual(taiConverter.atomicToUnix(126_230_413_000), 126_230_400_000)
        assert.strictEqual(taiConverter.atomicToUnix(157_766_414_000), 157_766_400_000)
        assert.strictEqual(taiConverter.atomicToUnix(189_302_415_000), 189_302_400_000)
        assert.strictEqual(taiConverter.atomicToUnix(220_924_816_000), 220_924_800_000)
        assert.strictEqual(taiConverter.atomicToUnix(252_460_817_000), 252_460_800_000)
        assert.strictEqual(taiConverter.atomicToUnix(283_996_818_000), 283_996_800_000)
        assert.strictEqual(taiConverter.atomicToUnix(315_532_819_000), 315_532_800_000)
        assert.strictEqual(taiConverter.atomicToUnix(362_793_620_000), 362_793_600_000)
        assert.strictEqual(taiConverter.atomicToUnix(394_329_621_000), 394_329_600_000)
        assert.strictEqual(taiConverter.atomicToUnix(425_865_622_000), 425_865_600_000)
        assert.strictEqual(taiConverter.atomicToUnix(489_024_023_000), 489_024_000_000)
        assert.strictEqual(taiConverter.atomicToUnix(567_993_624_000), 567_993_600_000)
        assert.strictEqual(taiConverter.atomicToUnix(631_152_025_000), 631_152_000_000)
        assert.strictEqual(taiConverter.atomicToUnix(662_688_026_000), 662_688_000_000)
        assert.strictEqual(taiConverter.atomicToUnix(709_948_827_000), 709_948_800_000)
        assert.strictEqual(taiConverter.atomicToUnix(741_484_828_000), 741_484_800_000)
        assert.strictEqual(taiConverter.atomicToUnix(773_020_829_000), 773_020_800_000)
        assert.strictEqual(taiConverter.atomicToUnix(820_454_430_000), 820_454_400_000)
        assert.strictEqual(taiConverter.atomicToUnix(867_715_231_000), 867_715_200_000)
        assert.strictEqual(taiConverter.atomicToUnix(915_148_832_000), 915_148_800_000)
        assert.strictEqual(taiConverter.atomicToUnix(1_136_073_633_000), 1_136_073_600_000)
        assert.strictEqual(taiConverter.atomicToUnix(1_230_768_034_000), 1_230_768_000_000)
        assert.strictEqual(taiConverter.atomicToUnix(1_341_100_835_000), 1_341_100_800_000)
        assert.strictEqual(taiConverter.atomicToUnix(1_435_708_836_000), 1_435_708_800_000)
        assert.strictEqual(taiConverter.atomicToUnix(1_483_228_837_000), 1_483_228_800_000)
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
            assert.strictEqual(taiConverter.atomicToUnix(taiConverter.unixToAtomic(number)), number)
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
            assert.strictEqual(taiConverter.unixToAtomic(taiConverter.atomicToUnix(number)), number)
          })
        })
      })
    })
  })

  describe('smearing', () => {
    const taiConverter = TaiConverter(MODELS.SMEAR)

    it('smears', () => {
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(2016, DEC, 31, 0, 0, 0, 0)),
        Date.UTC(2016, DEC, 31, 0, 0, 36, 0))
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(2016, DEC, 31, 12, 0, 0, 0)),
        Date.UTC(2016, DEC, 31, 12, 0, 36, 0))
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(2016, DEC, 31, 12, 0, 0, 1)),
        Date.UTC(2016, DEC, 31, 12, 0, 36, 1))

      // After 86_400 Unix milliseconds, 86_401 TAI milliseconds have passed
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(2016, DEC, 31, 12, 1, 26, 399)),
        Date.UTC(2016, DEC, 31, 12, 2, 2, 399))
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(2016, DEC, 31, 12, 1, 26, 400)),
        Date.UTC(2016, DEC, 31, 12, 2, 2, 401))

      // After 12 Unix hours, 12 TAI hours and 500 milliseconds
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(2017, JAN, 1, 0, 0, 0, 0)),
        Date.UTC(2017, JAN, 1, 0, 0, 36, 500))

      // After 24 Unix hours, 24 TAI hours and 1 second
      assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(2017, JAN, 1, 12, 0, 0, 0)),
        Date.UTC(2017, JAN, 1, 12, 0, 37))
    })
  })
})

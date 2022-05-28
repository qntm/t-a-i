/* eslint-env jest */

const { TaiConverter, Rat, MODELS, UNIX_START, UNIX_END } = require('./exact.js')
const { Range } = require('./range.js')

const JAN = 0
const FEB = 1
const MAR = 2
const APR = 3
const JUL = 6
const AUG = 7
const SEP = 8
const OCT = 9
const DEC = 11

describe('UNIX_START', () => {
  it('is correct', () => {
    expect(UNIX_START).toEqual(Rat.fromMillis(Date.UTC(1961, JAN, 1)))
  })
})

describe('UNIX_END', () => {
  it('is correct', () => {
    expect(UNIX_END).toEqual(Rat.fromMillis(Date.UTC(2022, DEC, 31, 12, 0, 0, 0)))
  })
})

describe('TaiConverter', () => {
  describe('OVERRUN', () => {
    const taiConverter = TaiConverter(MODELS.OVERRUN)

    describe('unixToAtomic', () => {
      it('starts TAI at 1961-01-01 00:00:01.422_818', () => {
        // 00:00:01.422_818 is in range, but rounds down to 00:00:01.422 which is not
        expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1961, JAN, 1, 0, 0, 0, 0))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1961, JAN, 1, 0, 0, 1, 422)).plus(new Rat(818_000_000n, 1_000_000_000_000n)))
          ])
      })

      it('advances 15 TAI picoseconds per Unix millisecond', () => {
        expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1961, JAN, 1, 0, 0, 0, 1))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1961, JAN, 1, 0, 0, 1, 423)).plus(new Rat(818_000_015n, 1_000_000_000_000n)))
          ])
        expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1961, JAN, 1, 0, 0, 0, 2))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1961, JAN, 1, 0, 0, 1, 424)).plus(new Rat(818_000_030n, 1_000_000_000_000n)))
          ])
        expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1961, JAN, 1, 0, 0, 0, 3))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1961, JAN, 1, 0, 0, 1, 425)).plus(new Rat(818_000_045n, 1_000_000_000_000n)))
          ])
      })

      it('advances 0.001_296 TAI seconds per Unix day', () => {
        expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1961, JAN, 2, 0, 0, 0, 0))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1961, JAN, 2, 0, 0, 1, 424)).plus(new Rat(114n, 1_000_000n)))
          ])
      })

      it('makes certain TAI millisecond counts inaccessible', () => {
        expect(taiConverter.unixToAtomic(Rat.fromMillis(-283_984_666_668)))
          .toEqual([
            new Range(new Rat(-283_984_665_245_000_000_020n, 1_000_000_000_000n))
          ])
        expect(taiConverter.unixToAtomic(Rat.fromMillis(-283_984_666_667)))
          .toEqual([
            new Range(new Rat(-283_984_665_244_000_000_005n, 1_000_000_000_000n))
          ])

        // it's not possible to get a result of -283_984_665_244_XXX_XXX_XXXn

        expect(taiConverter.unixToAtomic(Rat.fromMillis(-283_984_666_666)))
          .toEqual([
            new Range(new Rat(-283_984_665_242_999_999_990n, 1_000_000_000_000n))
          ])
        expect(taiConverter.unixToAtomic(Rat.fromMillis(-283_984_666_665)))
          .toEqual([
            new Range(new Rat(-283_984_665_241_999_999_975n, 1_000_000_000_000n))
          ])
      })
    })

    describe('atomicToUnix', () => {
      it('The NEW earliest instant in TAI', () => {
        expect(taiConverter.atomicToUnix(Rat.fromMillis(Date.UTC(1961, JAN, 1, 0, 0, 1, 422))))
          .toBe(NaN)

        // Actual start of TAI: 1961-01-01 00:00:01.422_818
        expect(taiConverter.atomicToUnix(Rat.fromMillis(Date.UTC(1961, JAN, 1, 0, 0, 1, 422)).plus(new Rat(818n, 1_000_000n))))
          .toEqual(Rat.fromMillis(Date.UTC(1961, JAN, 1, 0, 0, 0, 0)))
      })

      it('start of 1972', () => {
        // After this point in time, conversions become far simpler and always integer numbers of milliseconds
        expect(taiConverter.atomicToUnix(Rat.fromMillis(Date.UTC(1972, JAN, 1, 0, 0, 10, 0))))
          .toEqual(Rat.fromMillis(Date.UTC(1972, JAN, 1, 0, 0, 0, 0)))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(Date.UTC(1972, JAN, 1, 0, 0, 10, 1))))
          .toEqual(Rat.fromMillis(Date.UTC(1972, JAN, 1, 0, 0, 0, 1)))
      })

      it('typical', () => {
        // A typical leap second from the past, note backtracking
        expect(taiConverter.atomicToUnix(Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 31, 999))))
          .toEqual(Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 0, 999)))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 32, 0))))
          .toEqual(Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 0, 0)))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 32, 1))))
          .toEqual(Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 0, 1)))
      })
    })

    describe('TAI->Unix conversions', () => {
      it('now-ish', () => {
        expect(taiConverter.atomicToUnix(Rat.fromMillis(Date.UTC(2016, OCT, 27, 20, 5, 50, 678))))
          .toEqual(Rat.fromMillis(Date.UTC(2016, OCT, 27, 20, 5, 14, 678)))
      })
    })

    describe('Unix->TAI conversions', () => {
      it('The NEW earliest instant in TAI', () => {
        expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1960, DEC, 31, 23, 59, 59, 999))))
          .toEqual([])
      })

      it('icky', () => {
        // Fun fact! There is about 105 leap milliseconds here!
        expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1972, JAN, 1, 0, 0, 0, 0))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1972, JAN, 1, 0, 0, 9, 892)).plus(new Rat(242n, 1_000_000n))),
            new Range(Rat.fromMillis(Date.UTC(1972, JAN, 1, 0, 0, 10, 0)))
          ])
      })

      it('typical', () => {
        // A typical leap second from the past, note repetition
        expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1998, DEC, 31, 23, 59, 59, 999))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 30, 999)))
          ])
        expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 0, 0))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 31, 0))),
            new Range(Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 32, 0)))
          ])
        expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 0, 1))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 31, 1))),
            new Range(Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 32, 1)))
          ])

        expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 0, 999))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 31, 999))),
            new Range(Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 32, 999)))
          ])
        expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 1, 0))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 33, 0)))
          ])
        expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 1, 1))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 33, 1)))
          ])
      })
    })

    it('Crazy pre-1972 nonsense', () => {
      // At the beginning of 1962, the drift rate changed, with no discontinuity in UTC.

      // Prior ray
      // TAI picosecond count rounds to -252_460_798_155 which is not in range
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1961, DEC, 31, 23, 59, 59, 999))))
        .toEqual([
          new Range(new Rat(-252_460_798_155_142_000_015n, 1_000_000_000_000n))
        ])
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1962, JAN, 1, 0, 0, 0, 0))))
        .toEqual([
          new Range(new Rat(-252_460_798_154_142_000_000n, 1_000_000_000_000n))
        ])
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1962, JAN, 1, 0, 0, 0, 1))))
        .toEqual([
          new Range(new Rat(-252_460_798_153_141_999_987n, 1_000_000_000_000n))
        ])
    })

    it('inserted tenth', () => {
      // Oh look, an inserted leap tenth of a second!
      // The period between 1965-09-01 00:00:00 and 00:00:00.100 UTC happened twice!
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1965, SEP, 1, 0, 0, 0, 50))))
        .toEqual([
          new Range(new Rat(-136_771_195_894_941_999_250n, 1_000_000_000_000n)),
          new Range(new Rat(-136_771_195_794_941_999_250n, 1_000_000_000_000n))
        ])
    })

    it('removed twentieth', () => {
      // Hey, what! A removed leap twentieth of a second???
      // Well, technically, that's 1/20th of a TAI second, which is SLIGHTLY LESS than 1/20th of a UTC second
      // Which means that 23:59:59.950 UTC *does* actually exist...
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1961, JUL, 31, 23, 59, 59, 949))))
        .toEqual([
          new Range(new Rat(-265_679_998_353_430_000_765n, 1_000_000_000_000n))
        ])
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1961, JUL, 31, 23, 59, 59, 950))))
        .toEqual([
          new Range(new Rat(-265_679_998_352_430_000_750n, 1_000_000_000_000n))
        ])
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1961, JUL, 31, 23, 59, 59, 951))))
        .toEqual([])

      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1961, JUL, 31, 23, 59, 59, 999))))
        .toEqual([])
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1961, AUG, 1, 0, 0, 0, 0))))
        .toEqual([
          new Range(new Rat(-265_679_998_352_430_000_000n, 1_000_000_000_000n))
        ])
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1961, AUG, 1, 0, 0, 0, 1))))
        .toEqual([
          new Range(new Rat(-265_679_998_351_429_999_985n, 1_000_000_000_000n))
        ])
    })

    it('boundaries', () => {
      // Let's check out some boundaries where the relationship between TAI and UTC changed
      // 1 January 1962: Perfect continuity (although the drift rate changed)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1961, DEC, 31, 23, 59, 59, 999))).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1962, JAN, 1, 0, 0, 0, 0))).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1962, JAN, 1, 0, 0, 0, 1))).length)
        .toBe(1)

      // 1 January 1964: Perfect continuity (drift rate changes)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1963, DEC, 31, 23, 59, 59, 999))).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1964, JAN, 1, 0, 0, 0, 0))).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1964, JAN, 1, 0, 0, 0, 1))).length)
        .toBe(1)

      // 1 April 1964: 0.1 TAI seconds inserted
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1964, MAR, 31, 23, 59, 59, 999))).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1964, APR, 1, 0, 0, 0, 0))).length)
        .toBe(2)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1964, APR, 1, 0, 0, 0, 99))).length)
        .toBe(2)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1964, APR, 1, 0, 0, 0, 100))).length)
        .toBe(1)

      // etc. (various occasions when 0.1 TAI seconds were inserted)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1964, SEP, 1, 0, 0, 0, 99))).length)
        .toBe(2)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1965, JAN, 1, 0, 0, 0, 99))).length)
        .toBe(2)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1965, MAR, 1, 0, 0, 0, 99))).length)
        .toBe(2)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1965, JUL, 1, 0, 0, 0, 99))).length)
        .toBe(2)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1965, SEP, 1, 0, 0, 0, 99))).length)
        .toBe(2)

      // 1 January 1966: Perfect continuity (drift rate changes)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1965, DEC, 31, 23, 59, 59, 999))).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1966, JAN, 1, 0, 0, 0, 0))).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1966, JAN, 1, 0, 0, 0, 1))).length)
        .toBe(1)

      // 1 February 1968: 0.1 TAI seconds removed
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1968, JAN, 31, 23, 59, 59, 899))).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1968, JAN, 31, 23, 59, 59, 900))))
        .toEqual([
          new Range(new Rat(-60_479_993_814_318_003n, 1_000_000_000n))
        ])

      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1968, JAN, 31, 23, 59, 59, 901))).length)
        .toBe(0)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1968, JAN, 31, 23, 59, 59, 999))).length)
        .toBe(0)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1968, FEB, 1, 0, 0, 0, 0))).length)
        .toBe(1)

      // 1 January 1972: 0.107_758 TAI seconds inserted
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1971, DEC, 31, 23, 59, 59, 999))).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1972, JAN, 1, 0, 0, 0, 0))).length)
        .toBe(2)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1972, JAN, 1, 0, 0, 0, 107))).length)
        .toBe(2)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1972, JAN, 1, 0, 0, 0, 108))).length)
        .toBe(1)

      // Removed time
      expect(taiConverter.unixToAtomic(Rat.fromMillis(-265_680_000_051)).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(-265_680_000_050)).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(-265_680_000_049)).length)
        .toBe(0)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(-265_680_000_048)).length)
        .toBe(0)

      expect(taiConverter.unixToAtomic(Rat.fromMillis(-252_460_800_000)).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(-194_659_199_900)).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(-189_388_800_000)).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(-181_526_399_900)).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(-168_307_199_900)).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(-157_766_399_900)).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(-152_668_799_900)).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(-142_127_999_900)).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(-136_771_199_900)).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(-126_230_400_000)).length)
        .toBe(1)

      // Removed time
      expect(taiConverter.unixToAtomic(Rat.fromMillis(-60_480_000_101)).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(-60_480_000_100)).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(-60_480_000_099)).length)
        .toBe(0)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(-60_480_000_098)).length)
        .toBe(0)

      expect(taiConverter.unixToAtomic(Rat.fromMillis(63_072_000_106)).length)
        .toBe(2)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(63_072_000_107)).length)
        .toBe(2)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(63_072_000_108)).length)
        .toBe(1)
      expect(taiConverter.unixToAtomic(Rat.fromMillis(63_072_000_109)).length)
        .toBe(1)
    })

    describe('TAI raw data conversion unit tests based on magic numbers', () => {
      it('taiConverter.unixToAtomic', () => {
        const pairs = [
          [63_072_010_000, 63_072_020_000],
          [78_796_811_000, 78_796_822_000],
          [94_694_412_000, 94_694_424_000],
          [126_230_413_000, 126_230_426_000],
          [157_766_414_000, 157_766_428_000],
          [189_302_415_000, 189_302_430_000],
          [220_924_816_000, 220_924_832_000],
          [252_460_817_000, 252_460_834_000],
          [283_996_818_000, 283_996_836_000],
          [315_532_819_000, 315_532_838_000],
          [362_793_620_000, 362_793_640_000],
          [394_329_621_000, 394_329_642_000],
          [425_865_622_000, 425_865_644_000],
          [489_024_023_000, 489_024_046_000],
          [567_993_624_000, 567_993_648_000],
          [631_152_025_000, 631_152_050_000],
          [662_688_026_000, 662_688_052_000],
          [709_948_827_000, 709_948_854_000],
          [741_484_828_000, 741_484_856_000],
          [773_020_829_000, 773_020_858_000],
          [820_454_430_000, 820_454_460_000],
          [867_715_231_000, 867_715_262_000],
          [915_148_832_000, 915_148_864_000],
          [1_136_073_633_000, 1_136_073_666_000],
          [1_230_768_034_000, 1_230_768_068_000],
          [1_341_100_835_000, 1_341_100_870_000],
          [1_435_708_836_000, 1_435_708_872_000],
          [1_483_228_837_000, 1_483_228_874_000]
        ]

        pairs.forEach(([unixMillis, atomicMillis]) => {
          expect(taiConverter.unixToAtomic(Rat.fromMillis(unixMillis)))
            .toEqual([
              new Range(Rat.fromMillis(atomicMillis))
            ])
        })
      })

      it('taiConverter.atomicToUnix', () => {
        expect(taiConverter.atomicToUnix(Rat.fromMillis(-283_996_800_000)))
          .toBe(NaN)
        expect(taiConverter.atomicToUnix(Rat.fromMillis(63_072_010_000)))
          .toEqual(Rat.fromMillis(63_072_000_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(78_796_811_000)))
          .toEqual(Rat.fromMillis(78_796_800_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(94_694_412_000)))
          .toEqual(Rat.fromMillis(94_694_400_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(126_230_413_000)))
          .toEqual(Rat.fromMillis(126_230_400_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(157_766_414_000)))
          .toEqual(Rat.fromMillis(157_766_400_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(189_302_415_000)))
          .toEqual(Rat.fromMillis(189_302_400_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(220_924_816_000)))
          .toEqual(Rat.fromMillis(220_924_800_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(252_460_817_000)))
          .toEqual(Rat.fromMillis(252_460_800_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(283_996_818_000)))
          .toEqual(Rat.fromMillis(283_996_800_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(315_532_819_000)))
          .toEqual(Rat.fromMillis(315_532_800_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(362_793_620_000)))
          .toEqual(Rat.fromMillis(362_793_600_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(394_329_621_000)))
          .toEqual(Rat.fromMillis(394_329_600_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(425_865_622_000)))
          .toEqual(Rat.fromMillis(425_865_600_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(489_024_023_000)))
          .toEqual(Rat.fromMillis(489_024_000_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(567_993_624_000)))
          .toEqual(Rat.fromMillis(567_993_600_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(631_152_025_000)))
          .toEqual(Rat.fromMillis(631_152_000_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(662_688_026_000)))
          .toEqual(Rat.fromMillis(662_688_000_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(709_948_827_000)))
          .toEqual(Rat.fromMillis(709_948_800_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(741_484_828_000)))
          .toEqual(Rat.fromMillis(741_484_800_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(773_020_829_000)))
          .toEqual(Rat.fromMillis(773_020_800_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(820_454_430_000)))
          .toEqual(Rat.fromMillis(820_454_400_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(867_715_231_000)))
          .toEqual(Rat.fromMillis(867_715_200_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(915_148_832_000)))
          .toEqual(Rat.fromMillis(915_148_800_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(1_136_073_633_000)))
          .toEqual(Rat.fromMillis(1_136_073_600_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(1_230_768_034_000)))
          .toEqual(Rat.fromMillis(1_230_768_000_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(1_341_100_835_000)))
          .toEqual(Rat.fromMillis(1_341_100_800_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(1_435_708_836_000)))
          .toEqual(Rat.fromMillis(1_435_708_800_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(1_483_228_837_000)))
          .toEqual(Rat.fromMillis(1_483_228_800_000))
      })
    })
  })

  describe('STALL', () => {
    const taiConverter = TaiConverter(MODELS.STALL)

    describe('atomicToUnix', () => {
      it('The NEW earliest instant in TAI', () => {
        // Actual start of TAI: 1961-01-01 00:00:01.422_818
        expect(taiConverter.atomicToUnix(Rat.fromMillis(Date.UTC(1961, JAN, 1, 0, 0, 1, 422)).plus(new Rat(818n, 1_000_000n))))
          .toEqual(Rat.fromMillis(Date.UTC(1961, JAN, 1, 0, 0, 0, 0)))
      })

      it('handles the start of 1972', () => {
        expect(taiConverter.atomicToUnix(Rat.fromMillis(Date.UTC(1972, JAN, 1, 0, 0, 10, 0))))
          .toEqual(Rat.fromMillis(Date.UTC(1972, JAN, 1, 0, 0, 0, 0)))
      })

      it('0.107_758 seconds added, start of 1972', () => {
        // stall begins at 1972-01-01 00:00:09.892_242 TAI
        expect(taiConverter.atomicToUnix(Rat.fromMillis(Date.UTC(1972, JAN, 1, 0, 0, 9, 892)).plus(new Rat(242n, 1_000_000n))))
          .toEqual(Rat.fromMillis(Date.UTC(1972, JAN, 1, 0, 0, 0, 0)))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(Date.UTC(1972, JAN, 1, 0, 0, 9, 893))))
          .toEqual(Rat.fromMillis(Date.UTC(1972, JAN, 1, 0, 0, 0, 0)))

        // Leap time over
        // After this point in time, conversions become far simpler and always integer numbers of milliseconds
        expect(taiConverter.atomicToUnix(Rat.fromMillis(Date.UTC(1972, JAN, 1, 0, 0, 9, 999))))
          .toEqual(Rat.fromMillis(Date.UTC(1972, JAN, 1, 0, 0, 0, 0)))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(Date.UTC(1972, JAN, 1, 0, 0, 10, 0))))
          .toEqual(Rat.fromMillis(Date.UTC(1972, JAN, 1, 0, 0, 0, 0)))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(Date.UTC(1972, JAN, 1, 0, 0, 10, 1))))
          .toEqual(Rat.fromMillis(Date.UTC(1972, JAN, 1, 0, 0, 0, 1)))
      })

      it('typical', () => {
        // A typical leap second from the past, note stall
        expect(taiConverter.atomicToUnix(Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 30, 999))))
          .toEqual(Rat.fromMillis(Date.UTC(1998, DEC, 31, 23, 59, 59, 999)))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 31, 0))))
          .toEqual(Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 0, 0)))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 31, 1))))
          .toEqual(Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 0, 0)))

        expect(taiConverter.atomicToUnix(Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 31, 999))))
          .toEqual(Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 0, 0)))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 32, 0))))
          .toEqual(Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 0, 0)))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 32, 1))))
          .toEqual(Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 0, 1)))
      })
    })

    describe('Unix->TAI conversions', () => {
      it('typical', () => {
        // A typical leap second from the past, note stall
        expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1998, DEC, 31, 23, 59, 59, 999))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 30, 999)))
          ])
        expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 0, 0))))
          .toEqual([
            new Range(
              Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 31, 0)),
              Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 32, 0))
            )
          ])
        expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 0, 1))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(1999, JAN, 1, 0, 0, 32, 1)))
          ])
      })

      it('Now-ish', () => {
        expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(2016, OCT, 27, 20, 5, 14, 678))))
          .toEqual([
            new Range(Rat.fromMillis(Date.UTC(2016, OCT, 27, 20, 5, 50, 678)))
          ])
      })
    })

    it('Crazy pre-1972 nonsense', () => {
      // Exact picosecond ratios
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1962, JAN, 1, 0, 0, 0, 0))))
        .toEqual([
          new Range(new Rat(-252_460_798_154_142_000_000n, 1_000_000_000_000n))
        ])
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(1962, JAN, 1, 0, 0, 0, 1))))
        .toEqual([
          new Range(new Rat(-252_460_798_153_141_999_987n, 1_000_000_000_000n))
        ])
    })

    describe('TAI raw data conversion unit tests based on magic numbers', () => {
      it('taiConverter.unixToAtomic', () => {
        const pairs = [
          [63_072_010_000, 63_072_020_000],
          [78_796_811_000, 78_796_822_000],
          [94_694_412_000, 94_694_424_000],
          [126_230_413_000, 126_230_426_000],
          [157_766_414_000, 157_766_428_000],
          [189_302_415_000, 189_302_430_000],
          [220_924_816_000, 220_924_832_000],
          [252_460_817_000, 252_460_834_000],
          [283_996_818_000, 283_996_836_000],
          [315_532_819_000, 315_532_838_000],
          [362_793_620_000, 362_793_640_000],
          [394_329_621_000, 394_329_642_000],
          [425_865_622_000, 425_865_644_000],
          [489_024_023_000, 489_024_046_000],
          [567_993_624_000, 567_993_648_000],
          [631_152_025_000, 631_152_050_000],
          [662_688_026_000, 662_688_052_000],
          [709_948_827_000, 709_948_854_000],
          [741_484_828_000, 741_484_856_000],
          [773_020_829_000, 773_020_858_000],
          [820_454_430_000, 820_454_460_000],
          [867_715_231_000, 867_715_262_000],
          [915_148_832_000, 915_148_864_000],
          [1_136_073_633_000, 1_136_073_666_000],
          [1_230_768_034_000, 1_230_768_068_000],
          [1_341_100_835_000, 1_341_100_870_000],
          [1_435_708_836_000, 1_435_708_872_000],
          [1_483_228_837_000, 1_483_228_874_000]
        ]

        pairs.forEach(([unixMillis, atomicMillis]) => {
          expect(taiConverter.unixToAtomic(Rat.fromMillis(unixMillis)))
            .toEqual([
              new Range(Rat.fromMillis(atomicMillis))
            ])
        })
      })

      it('taiConverter.atomicToUnix', () => {
        expect(taiConverter.atomicToUnix(Rat.fromMillis(-283_996_800_000)))
          .toBe(NaN)
        expect(taiConverter.atomicToUnix(Rat.fromMillis(63_072_010_000)))
          .toEqual(Rat.fromMillis(63_072_000_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(78_796_811_000)))
          .toEqual(Rat.fromMillis(78_796_800_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(94_694_412_000)))
          .toEqual(Rat.fromMillis(94_694_400_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(126_230_413_000)))
          .toEqual(Rat.fromMillis(126_230_400_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(157_766_414_000)))
          .toEqual(Rat.fromMillis(157_766_400_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(189_302_415_000)))
          .toEqual(Rat.fromMillis(189_302_400_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(220_924_816_000)))
          .toEqual(Rat.fromMillis(220_924_800_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(252_460_817_000)))
          .toEqual(Rat.fromMillis(252_460_800_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(283_996_818_000)))
          .toEqual(Rat.fromMillis(283_996_800_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(315_532_819_000)))
          .toEqual(Rat.fromMillis(315_532_800_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(362_793_620_000)))
          .toEqual(Rat.fromMillis(362_793_600_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(394_329_621_000)))
          .toEqual(Rat.fromMillis(394_329_600_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(425_865_622_000)))
          .toEqual(Rat.fromMillis(425_865_600_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(489_024_023_000)))
          .toEqual(Rat.fromMillis(489_024_000_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(567_993_624_000)))
          .toEqual(Rat.fromMillis(567_993_600_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(631_152_025_000)))
          .toEqual(Rat.fromMillis(631_152_000_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(662_688_026_000)))
          .toEqual(Rat.fromMillis(662_688_000_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(709_948_827_000)))
          .toEqual(Rat.fromMillis(709_948_800_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(741_484_828_000)))
          .toEqual(Rat.fromMillis(741_484_800_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(773_020_829_000)))
          .toEqual(Rat.fromMillis(773_020_800_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(820_454_430_000)))
          .toEqual(Rat.fromMillis(820_454_400_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(867_715_231_000)))
          .toEqual(Rat.fromMillis(867_715_200_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(915_148_832_000)))
          .toEqual(Rat.fromMillis(915_148_800_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(1_136_073_633_000)))
          .toEqual(Rat.fromMillis(1_136_073_600_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(1_230_768_034_000)))
          .toEqual(Rat.fromMillis(1_230_768_000_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(1_341_100_835_000)))
          .toEqual(Rat.fromMillis(1_341_100_800_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(1_435_708_836_000)))
          .toEqual(Rat.fromMillis(1_435_708_800_000))
        expect(taiConverter.atomicToUnix(Rat.fromMillis(1_483_228_837_000)))
          .toEqual(Rat.fromMillis(1_483_228_800_000))
      })
    })

    describe('round trips', () => {
      describe('unixToAtomic and back', () => {
        const unixMillises = [
          // Pre 1972, round trips DO NOT work due to rounding behaviour
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
        unixMillises.forEach(unixMillis => {
          it(String(unixMillis), () => {
            const unix = Rat.fromMillis(unixMillis)
            const atomicRange = taiConverter.unixToAtomic(unix)
            expect(taiConverter.atomicToUnix(atomicRange[0].end))
              .toEqual(unix)
          })
        })
      })

      describe('atomicToUnix and back', () => {
        it(String(63_072_010_000), () => {
          const atomic = Rat.fromMillis(63_072_010_000)
          expect(taiConverter.unixToAtomic(taiConverter.atomicToUnix(atomic)))
            .toEqual([
              new Range(atomic.minus(new Rat(107_758n, 1_000_000n)), atomic)
            ])
        })

        const atomicMillises = [
          // Pre 1972, round trips DO NOT work due to rounding behaviour
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
        atomicMillises.forEach(atomicMillis => {
          it(String(atomicMillis), () => {
            const atomic = Rat.fromMillis(atomicMillis)
            expect(taiConverter.unixToAtomic(taiConverter.atomicToUnix(atomic)))
              .toEqual([
                new Range(atomic.minus(Rat.fromMillis(1_000)), atomic)
              ])
          })
        })
      })
    })
  })

  describe('smearing', () => {
    const taiConverter = TaiConverter(MODELS.SMEAR)
    it('smears', () => {
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(2016, DEC, 31, 0, 0, 0, 0))))
        .toEqual([
          new Range(Rat.fromMillis(Date.UTC(2016, DEC, 31, 0, 0, 36, 0)))
        ])

      // SMEAR BEGINS
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(2016, DEC, 31, 11, 59, 59, 999))))
        .toEqual([
          new Range(Rat.fromMillis(Date.UTC(2016, DEC, 31, 12, 0, 35, 999)))
        ])
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(2016, DEC, 31, 12, 0, 0, 0))))
        .toEqual([
          new Range(Rat.fromMillis(Date.UTC(2016, DEC, 31, 12, 0, 36, 0)))
        ])
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(2016, DEC, 31, 12, 0, 0, 1))))
        .toEqual([
          new Range(Rat.fromMillis(Date.UTC(2016, DEC, 31, 12, 0, 36, 1)).plus(new Rat(1n, 86_400_000n)))
        ])

      // After 86_400 Unix milliseconds, exactly 86_401 TAI milliseconds have passed
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(2016, DEC, 31, 12, 1, 26, 400))))
        .toEqual([
          new Range(Rat.fromMillis(Date.UTC(2016, DEC, 31, 12, 2, 2, 401)))
        ])

      // After 12 Unix hours, 12 TAI hours and 500 milliseconds
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(2017, JAN, 1, 0, 0, 0, 0))))
        .toEqual([
          new Range(Rat.fromMillis(Date.UTC(2017, JAN, 1, 0, 0, 36, 500)))
        ])

      // SMEAR ENDS. After 24 Unix hours, 24 TAI hours and 1 second
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(2017, JAN, 1, 11, 59, 59, 999))))
        .toEqual([
          new Range(Rat.fromMillis(Date.UTC(2017, JAN, 1, 12, 0, 35, 999)).plus(new Rat(86_399_999n, 86_400_000n)))
        ])
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(2017, JAN, 1, 12, 0, 0, 0))))
        .toEqual([
          new Range(Rat.fromMillis(Date.UTC(2017, JAN, 1, 12, 0, 37, 0)))
        ])
      expect(taiConverter.unixToAtomic(Rat.fromMillis(Date.UTC(2017, JAN, 1, 12, 0, 0, 1))))
        .toEqual([
          new Range(Rat.fromMillis(Date.UTC(2017, JAN, 1, 12, 0, 37, 1)))
        ])
    })
  })
})

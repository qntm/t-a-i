/* eslint-env jest */

const taiConverter = require('.')

const JAN = 0
const FEB = 1
const MAR = 2
const APR = 3
const JUL = 6
const AUG = 7
const SEP = 8
const OCT = 9
const NOV = 10
const DEC = 11

describe('convert', () => {
  describe('oneToMany.unixToAtomic', () => {
    const unixToAtomicPicos = taiConverter.oneToMany.unixToAtomicPicos
    const unixToAtomic = taiConverter.oneToMany.unixToAtomic

    it('starts TAI at 1961-01-01 00:00:01.422818', () => {
      // 00:00:01.422818 is in range, but rounds down to 00:00:01.422 which is not
      expect(unixToAtomicPicos(Date.UTC(1961, JAN, 1, 0, 0, 0, 0)))
        .toEqual([-283_996_798_577_182_000_000n])
      expect(unixToAtomic(Date.UTC(1961, JAN, 1, 0, 0, 0, 0)))
        .toEqual([])
    })

    it('advances 15 TAI picoseconds per Unix millisecond', () => {
      expect(unixToAtomicPicos(Date.UTC(1961, JAN, 1, 0, 0, 0, 1)))
        .toEqual([-283_996_798_576_181_999_985n])
      expect(unixToAtomicPicos(Date.UTC(1961, JAN, 1, 0, 0, 0, 2)))
        .toEqual([-283_996_798_575_181_999_970n])
      expect(unixToAtomicPicos(Date.UTC(1961, JAN, 1, 0, 0, 0, 3)))
        .toEqual([-283_996_798_574_181_999_955n])

      expect(unixToAtomic(Date.UTC(1961, JAN, 1, 0, 0, 0, 1)))
        .toEqual([Date.UTC(1961, JAN, 1, 0, 0, 1, 423)])
      expect(unixToAtomic(Date.UTC(1961, JAN, 1, 0, 0, 0, 2)))
        .toEqual([Date.UTC(1961, JAN, 1, 0, 0, 1, 424)])
      expect(unixToAtomic(Date.UTC(1961, JAN, 1, 0, 0, 0, 3)))
        .toEqual([Date.UTC(1961, JAN, 1, 0, 0, 1, 425)])
    })

    it('advances 0.001296 TAI seconds per Unix day', () => {
      expect(unixToAtomicPicos(Date.UTC(1961, JAN, 2, 0, 0, 0, 0)))
        .toEqual([-283_910_398_575_886_000_000n])
      expect(unixToAtomic(Date.UTC(1961, JAN, 2, 0, 0, 0, 0)))
        .toEqual([Date.UTC(1961, JAN, 2, 0, 0, 1, 424)])
      // It's 1.424114 but gets rounded down to 1.424000
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

  describe('oneToMany.atomicToUnix', () => {
    const atomicToUnix = taiConverter.oneToMany.atomicToUnix

    it('The NEW earliest instant in TAI', () => {
      expect(() => atomicToUnix(Date.UTC(1961, JAN, 1, 0, 0, 1, 422)))
        .toThrowError('No UTC equivalent: -283996798578')

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

  describe('oneToOne.atomicToUnix', () => {
    const atomicToUnix = taiConverter.oneToOne.atomicToUnix

    it('The NEW earliest instant in TAI', () => {
      expect(() => atomicToUnix(Date.UTC(1961, JAN, 1, 0, 0, 1, 422))).toThrow()
      expect(() => atomicToUnix(-283996798578)).toThrow() // same

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
      expect(() => atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 9, 893))).toThrow()
      expect(() => atomicToUnix(Date.UTC(1972, JAN, 1, 0, 0, 9, 999))).toThrow()
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
      expect(() => atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 0))).toThrow()
      expect(() => atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 250))).toThrow()
      expect(() => atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 500))).toThrow()
      expect(() => atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 750))).toThrow()
      expect(atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 32, 0)))
      .toBe(Date.UTC(1999, JAN, 1, 0, 0, 0, 0))
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

  describe('TAI->Unix conversions', () => {
    it('now-ish', () => {
      expect(taiConverter.oneToMany.atomicToUnix(Date.UTC(2016, OCT, 27, 20, 5, 50, 678)))
        .toBe(Date.UTC(2016, OCT, 27, 20, 5, 14, 678))
    })
  })

  describe('Unix->TAI conversions', () => {
    it('The NEW earliest instant in TAI', () => {
      expect(taiConverter.oneToMany.unixToAtomic(Date.UTC(1960, DEC, 31, 23, 59, 59, 999)))
        .toEqual([])
    })

    it('icky', () => {
      // Again with the icky floating point comparisons. Fun fact! There is about 105 leap milliseconds here!
      expect(taiConverter.oneToMany.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 0))).toEqual([
        Date.UTC(1972, JAN, 1, 0, 0, 9, 892), // should be + 0.242004 but rounded towards 1970
        Date.UTC(1972, JAN, 1, 0, 0, 10, 0)
      ])
      expect(taiConverter.oneToMany.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 1)).length)
      .toBe(2)
      expect(taiConverter.oneToMany.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 1))[1])
      .toBe(Date.UTC(1972, JAN, 1, 0, 0, 10, 1))
      expect(taiConverter.oneToOne.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 2)))
      .toBe(Date.UTC(1972, JAN, 1, 0, 0, 10, 2))
      // etc.
    })

    it('typical', () => {
      // A typical leap second from the past, note repetition
      expect(taiConverter.oneToOne.unixToAtomic(Date.UTC(1998, DEC, 31, 23, 59, 58, 750)))
      .toBe(Date.UTC(1999, JAN, 1, 0, 0, 29, 750))
      expect(taiConverter.oneToOne.unixToAtomic(Date.UTC(1998, DEC, 31, 23, 59, 59, 0)))
      .toBe(Date.UTC(1999, JAN, 1, 0, 0, 30, 0))
      expect(taiConverter.oneToOne.unixToAtomic(Date.UTC(1998, DEC, 31, 23, 59, 59, 250)))
      .toBe(Date.UTC(1999, JAN, 1, 0, 0, 30, 250))
      expect(taiConverter.oneToOne.unixToAtomic(Date.UTC(1998, DEC, 31, 23, 59, 59, 500)))
      .toBe(Date.UTC(1999, JAN, 1, 0, 0, 30, 500))

      expect(taiConverter.oneToMany.unixToAtomic(Date.UTC(1998, DEC, 31, 23, 59, 59, 750))).toEqual([
        Date.UTC(1999, JAN, 1, 0, 0, 30, 750)
      ])
      expect(taiConverter.oneToOne.unixToAtomic(Date.UTC(1998, DEC, 31, 23, 59, 59, 750)))
      .toBe(Date.UTC(1999, JAN, 1, 0, 0, 30, 750))

      expect(taiConverter.oneToMany.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 0))).toEqual([
        Date.UTC(1999, JAN, 1, 0, 0, 31, 0),
        Date.UTC(1999, JAN, 1, 0, 0, 32, 0)
      ])
      expect(taiConverter.oneToOne.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 0)))
      .toBe(Date.UTC(1999, JAN, 1, 0, 0, 32, 0))

      expect(taiConverter.oneToMany.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 250))).toEqual([
        Date.UTC(1999, JAN, 1, 0, 0, 31, 250),
        Date.UTC(1999, JAN, 1, 0, 0, 32, 250)
      ])
      expect(taiConverter.oneToOne.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 250)))
      .toBe(Date.UTC(1999, JAN, 1, 0, 0, 32, 250))

      expect(taiConverter.oneToMany.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 500))).toEqual([
        Date.UTC(1999, JAN, 1, 0, 0, 31, 500),
        Date.UTC(1999, JAN, 1, 0, 0, 32, 500)
      ])
      expect(taiConverter.oneToOne.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 500)))
      .toBe(Date.UTC(1999, JAN, 1, 0, 0, 32, 500))

      expect(taiConverter.oneToMany.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 750))).toEqual([
        Date.UTC(1999, JAN, 1, 0, 0, 31, 750),
        Date.UTC(1999, JAN, 1, 0, 0, 32, 750)
      ])
      expect(taiConverter.oneToOne.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 750)))
      .toBe(Date.UTC(1999, JAN, 1, 0, 0, 32, 750))

      expect(taiConverter.oneToMany.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 1, 0))).toEqual([
        Date.UTC(1999, JAN, 1, 0, 0, 33, 0)
      ])
      expect(taiConverter.oneToOne.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 1, 0)))
      .toBe(Date.UTC(1999, JAN, 1, 0, 0, 33, 0))
      expect(taiConverter.oneToOne.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 1, 250)))
      .toBe(Date.UTC(1999, JAN, 1, 0, 0, 33, 250))
    })

    it('Now-ish', () => {
      expect(taiConverter.oneToOne.unixToAtomic(Date.UTC(2016, OCT, 27, 20, 5, 14, 678)))
      .toBe(Date.UTC(2016, OCT, 27, 20, 5, 50, 678))
    })
  })

  it('Demo', () => {
    expect(taiConverter.oneToOne.unixToAtomic(915148799000))
      .toBe(915148830000)
    expect(taiConverter.oneToOne.unixToAtomic(Date.UTC(1998, DEC, 31, 23, 59, 59)))
      .toBe(Date.UTC(1999, JAN, 1, 0, 0, 30))
    expect(taiConverter.oneToOne.atomicToUnix(915148830000))
      .toBe(915148799000)
    expect(taiConverter.oneToOne.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30)))
      .toBe(Date.UTC(1998, DEC, 31, 23, 59, 59))
    expect(taiConverter.oneToMany.unixToAtomic(915148800000)).toEqual([915148831000, 915148832000])
    expect(taiConverter.oneToMany.atomicToUnix(915148831000))
      .toBe(915148800000)
    expect(taiConverter.oneToMany.atomicToUnix(915148832000))
      .toBe(915148800000)
    expect(() => taiConverter.oneToOne.atomicToUnix(915148831000)).toThrow()
  })

  it('Crazy pre-1972 nonsense', () => {
    // TAI picosecond count rounds to -252_460_798_155 which is not in range
    expect(taiConverter.oneToMany.unixToAtomicPicos(Date.UTC(1962, JAN, 1, 0, 0, 0, 0)))
      .toEqual([-252_460_798_154_142_000_000n])
    expect(taiConverter.oneToOne.unixToAtomicPicos(Date.UTC(1962, JAN, 1, 0, 0, 0, 0)))
      .toEqual(-252_460_798_154_142_000_000n)
    expect(taiConverter.oneToMany.unixToAtomic(Date.UTC(1962, JAN, 1, 0, 0, 0, 0)))
      .toEqual([])
    expect(() => taiConverter.oneToOne.unixToAtomic(Date.UTC(1962, JAN, 1, 0, 0, 0, 0)))
      .toThrowError('No TAI equivalent: -252460800000')

    expect(taiConverter.oneToMany.unixToAtomicPicos(Date.UTC(1962, JAN, 1, 0, 0, 0, 1)))
      .toEqual([-252_460_798_153_141_999_987n])
    expect(taiConverter.oneToOne.unixToAtomicPicos(Date.UTC(1962, JAN, 1, 0, 0, 0, 1)))
      .toEqual(-252_460_798_153_141_999_987n)
    expect(taiConverter.oneToMany.unixToAtomic(Date.UTC(1962, JAN, 1, 0, 0, 0, 1)))
      .toEqual([-252_460_798_154])
    expect(taiConverter.oneToOne.unixToAtomic(Date.UTC(1962, JAN, 1, 0, 0, 0, 1)))
      .toEqual(-252_460_798_154)
    expect(taiConverter.oneToOne.unixToAtomic(Date.UTC(1962, JAN, 1, 0, 0, 0, 1)))
      .toEqual(Date.UTC(1962, JAN, 1, 0, 0, 1, 846)) // Same
  })

  it('inserted tenth', () => {
    // Oh look, an inserted leap tenth of a second!
    // The period between 1965-09-01 00:00:00 and 00:00:00.100 UTC happened twice!
    expect(taiConverter.oneToMany.unixToAtomic(Date.UTC(1965, SEP, 1, 0, 0, 0, 50)).length)
      .toBe(2)
    expect(taiConverter.oneToMany.unixToAtomic(Date.UTC(1965, SEP, 1, 0, 0, 0, 50))[0])
      .toEqual(Date.UTC(1965, SEP, 1, 0, 0, 4, 105))
    expect(taiConverter.oneToMany.unixToAtomic(Date.UTC(1965, SEP, 1, 0, 0, 0, 50))[1])
      .toEqual(Date.UTC(1965, SEP, 1, 0, 0, 4, 205))
  })

  it('removed twentieth', () => {
    // Hey, what! A removed leap twentieth of a second???
    // Well, technically, that's 1/20th of a TAI second, which is SLIGHTLY LESS than 1/20th of a UTC second
    // Which means that 23:59:59.950 UTC *does* actually exist...
    expect(taiConverter.oneToMany.unixToAtomic(Date.UTC(1961, JUL, 31, 23, 59, 59, 949)).length)
      .toBe(1)

    expect(taiConverter.oneToMany.unixToAtomicPicos(Date.UTC(1961, JUL, 31, 23, 59, 59, 950)))
      .toEqual([-265_679_998_352_430_000_750n])
    expect(taiConverter.oneToMany.unixToAtomic(Date.UTC(1961, JUL, 31, 23, 59, 59, 950)))
      .toEqual([-265_679_998_353])

    expect(taiConverter.oneToMany.unixToAtomic(Date.UTC(1961, JUL, 31, 23, 59, 59, 951)).length)
      .toBe(0)
    expect(taiConverter.oneToMany.unixToAtomic(Date.UTC(1961, JUL, 31, 23, 59, 59, 999)).length)
      .toBe(0)
    expect(taiConverter.oneToMany.unixToAtomic(Date.UTC(1961, AUG, 1, 0, 0, 0, 0)).length)
      .toBe(0)
    expect(taiConverter.oneToMany.unixToAtomic(Date.UTC(1961, AUG, 1, 0, 0, 0, 1)).length)
      .toBe(1)
    expect(taiConverter.oneToMany.unixToAtomic(Date.UTC(1961, AUG, 1, 0, 0, 0, 2)).length)
      .toBe(1)
    expect(taiConverter.oneToMany.atomicToUnix(Date.UTC(1961, AUG, 1, 0, 0, 1, 647)))
      .toEqual(Date.UTC(1961, JUL, 31, 23, 59, 59, 949))
  })

  it('boundaries', () => {
    // Let's check out some boundaries where the relationship between TAI and UTC changed
    // 1 January 1962: Perfect continuity (although the drift rate changed)
    expect(taiConverter.oneToMany.unixToAtomicPicos(Date.UTC(1961, DEC, 31, 23, 59, 59, 999)).length)
      .toBe(1)
    expect(taiConverter.oneToMany.unixToAtomicPicos(Date.UTC(1962, JAN, 1, 0, 0, 0, 0)).length)
      .toBe(1)
    expect(taiConverter.oneToMany.unixToAtomicPicos(Date.UTC(1962, JAN, 1, 0, 0, 0, 1)).length)
      .toBe(1)

    // 1 November 1963: 0.1 TAI seconds inserted
    expect(taiConverter.oneToMany.unixToAtomicPicos(Date.UTC(1963, OCT, 30, 23, 59, 59, 999)).length)
      .toBe(1)
    expect(taiConverter.oneToMany.unixToAtomicPicos(Date.UTC(1963, NOV, 1, 0, 0, 0, 0)).length)
      .toBe(2)
    expect(taiConverter.oneToMany.unixToAtomicPicos(Date.UTC(1963, NOV, 1, 0, 0, 0, 99)).length)
      .toBe(2)
    expect(taiConverter.oneToMany.unixToAtomicPicos(Date.UTC(1963, NOV, 1, 0, 0, 0, 100)).length)
      .toBe(1)

    // 1 January 1964: Perfect continuity (drift rate changes)
    expect(taiConverter.oneToMany.unixToAtomicPicos(Date.UTC(1963, DEC, 31, 23, 59, 59, 999)).length)
      .toBe(1)
    expect(taiConverter.oneToMany.unixToAtomicPicos(Date.UTC(1964, JAN, 1, 0, 0, 0, 0)).length)
      .toBe(1)
    expect(taiConverter.oneToMany.unixToAtomicPicos(Date.UTC(1964, JAN, 1, 0, 0, 0, 1)).length)
      .toBe(1)

    // 1 April 1964: 0.1 TAI seconds inserted
    expect(taiConverter.oneToMany.unixToAtomicPicos(Date.UTC(1964, MAR, 31, 23, 59, 59, 999)).length)
      .toBe(1)
    expect(taiConverter.oneToMany.unixToAtomicPicos(Date.UTC(1964, APR, 1, 0, 0, 0, 0)).length)
      .toBe(2)
    expect(taiConverter.oneToMany.unixToAtomicPicos(Date.UTC(1964, APR, 1, 0, 0, 0, 99)).length)
      .toBe(2)
    expect(taiConverter.oneToMany.unixToAtomicPicos(Date.UTC(1964, APR, 1, 0, 0, 0, 100)).length)
      .toBe(1)

    // etc. (various occasions when 0.1 TAI seconds were inserted)
    expect(taiConverter.oneToMany.unixToAtomicPicos(Date.UTC(1964, SEP, 1, 0, 0, 0, 99)).length)
      .toBe(2)
    expect(taiConverter.oneToMany.unixToAtomicPicos(Date.UTC(1965, JAN, 1, 0, 0, 0, 99)).length)
      .toBe(2)
    expect(taiConverter.oneToMany.unixToAtomicPicos(Date.UTC(1965, MAR, 1, 0, 0, 0, 99)).length)
      .toBe(2)
    expect(taiConverter.oneToMany.unixToAtomicPicos(Date.UTC(1965, JUL, 1, 0, 0, 0, 99)).length)
      .toBe(2)
    expect(taiConverter.oneToMany.unixToAtomicPicos(Date.UTC(1965, SEP, 1, 0, 0, 0, 99)).length)
      .toBe(2)

    // 1 January 1966: Perfect continuity (drift rate changes)
    expect(taiConverter.oneToMany.unixToAtomicPicos(Date.UTC(1965, DEC, 31, 23, 59, 59, 999)).length)
      .toBe(1)
    expect(taiConverter.oneToMany.unixToAtomicPicos(Date.UTC(1966, JAN, 1, 0, 0, 0, 0)).length)
      .toBe(1)
    expect(taiConverter.oneToMany.unixToAtomicPicos(Date.UTC(1966, JAN, 1, 0, 0, 0, 1)).length)
      .toBe(1)

    // 1 February 1968: 0.1 TAI seconds removed
    expect(taiConverter.oneToMany.unixToAtomicPicos(Date.UTC(1968, JAN, 31, 23, 59, 59, 899)).length)
      .toBe(1)
    expect(taiConverter.oneToMany.unixToAtomicPicos(Date.UTC(1968, JAN, 31, 23, 59, 59, 900)))
      .toEqual([-60_479_993_814_318_003_000n])
    expect(taiConverter.oneToMany.unixToAtomic(Date.UTC(1968, JAN, 31, 23, 59, 59, 900)))
      .toEqual([-60_479_993_815])

    expect(taiConverter.oneToMany.unixToAtomicPicos(Date.UTC(1968, JAN, 31, 23, 59, 59, 901)).length)
      .toBe(0)
    expect(taiConverter.oneToMany.unixToAtomicPicos(Date.UTC(1968, JAN, 31, 23, 59, 59, 999)).length)
      .toBe(0)
    expect(taiConverter.oneToMany.unixToAtomicPicos(Date.UTC(1968, FEB, 1, 0, 0, 0, 0)).length)
      .toBe(1)

    // 1 January 1972: 0.107758 TAI seconds inserted
    expect(taiConverter.oneToMany.unixToAtomicPicos(Date.UTC(1971, DEC, 31, 23, 59, 59, 999)).length)
      .toBe(1)
    expect(taiConverter.oneToMany.unixToAtomicPicos(Date.UTC(1972, JAN, 1, 0, 0, 0, 0)).length)
      .toBe(2)
    expect(taiConverter.oneToMany.unixToAtomicPicos(Date.UTC(1972, JAN, 1, 0, 0, 0, 107)).length)
      .toBe(2)
    expect(taiConverter.oneToMany.unixToAtomicPicos(Date.UTC(1972, JAN, 1, 0, 0, 0, 108)).length)
      .toBe(1)

    // Removed time
    expect(taiConverter.oneToMany.unixToAtomicPicos(-265680000051).length)
      .toBe(1)
    expect(taiConverter.oneToMany.unixToAtomicPicos(-265680000050).length)
      .toBe(1)
    expect(taiConverter.oneToMany.unixToAtomicPicos(-265680000049).length)
      .toBe(0)
    expect(taiConverter.oneToMany.unixToAtomicPicos(-265680000048).length)
      .toBe(0)

    expect(taiConverter.oneToMany.unixToAtomicPicos(-252460800000).length)
      .toBe(1)
    expect(taiConverter.oneToMany.unixToAtomicPicos(-194659199900).length)
      .toBe(1)
    expect(taiConverter.oneToMany.unixToAtomicPicos(-189388800000).length)
      .toBe(1)
    expect(taiConverter.oneToMany.unixToAtomicPicos(-181526399900).length)
      .toBe(1)
    expect(taiConverter.oneToMany.unixToAtomicPicos(-168307199900).length)
      .toBe(1)
    expect(taiConverter.oneToMany.unixToAtomicPicos(-157766399900).length)
      .toBe(1)
    expect(taiConverter.oneToMany.unixToAtomicPicos(-152668799900).length)
      .toBe(1)
    expect(taiConverter.oneToMany.unixToAtomicPicos(-142127999900).length)
      .toBe(1)
    expect(taiConverter.oneToMany.unixToAtomicPicos(-136771199900).length)
      .toBe(1)
    expect(taiConverter.oneToMany.unixToAtomicPicos(-126230400000).length)
      .toBe(1)

    // Removed time
    expect(taiConverter.oneToMany.unixToAtomicPicos(-60480000101).length)
      .toBe(1)
    expect(taiConverter.oneToMany.unixToAtomicPicos(-60480000100).length)
      .toBe(1)
    expect(taiConverter.oneToMany.unixToAtomicPicos(-60480000099).length)
      .toBe(0)
    expect(taiConverter.oneToMany.unixToAtomicPicos(-60480000098).length)
      .toBe(0)

    expect(taiConverter.oneToMany.unixToAtomicPicos(63072000106).length)
      .toBe(2)
    expect(taiConverter.oneToMany.unixToAtomicPicos(63072000107).length)
      .toBe(2)
    expect(taiConverter.oneToMany.unixToAtomicPicos(63072000108).length)
      .toBe(1)
    expect(taiConverter.oneToMany.unixToAtomicPicos(63072000109).length)
      .toBe(1)
  })
})

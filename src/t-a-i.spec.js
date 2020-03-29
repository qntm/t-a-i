'use strict'

/* eslint-env jasmine */

const tai = require('./../src/t-a-i.js')

const JANUARY = 0
const FEBRUARY = 1
const MARCH = 2
const APRIL = 3
const JULY = 6
const AUGUST = 7
const SEPTEMBER = 8
const OCTOBER = 9
const NOVEMBER = 10
const DECEMBER = 11

describe('tai', () => {
  describe('TAI->Unix conversions', () => {
    it('The NEW earliest instant in TAI', () => {
      expect(() => tai.atomicToUnix(Date.UTC(1961, JANUARY, 1, 0, 0, 1, 422))).toThrow()
      expect(() => tai.atomicToUnix(Date.UTC(1961, JANUARY, 1, 0, 0, 1, 422) + 0.818)).toThrow()
      expect(() => tai.atomicToUnix(-283996798577.182)).toThrow() // same
    })

    it('earliest', () => {
      // This is the earliest 64-bit float number of TAI milliseconds which represents a legal
      // TAI time, coming just slightly after the beginning of TAI.
      expect(tai.atomicToUnix(-283996798577.18195)).toBeGreaterThan(-283996800000)
      expect(tai.atomicToUnix(-283996798577.18195)).toBe(-283996799999.99994)
    })

    it('Oog, floating point', () => {
      expect(Math.round(tai.convert.oneToMany.atomicToUnix(Date.UTC(1961, JANUARY, 1, 0, 0, 1, 423)))).toBe(Date.UTC(1961, JANUARY, 1, 0, 0, 0, 0))
      expect(tai.convert.oneToMany.atomicToUnix(Date.UTC(1972, JANUARY, 1, 0, 0, 9, 999))).toBe(63072000106.757996)
      expect(tai.convert.oneToMany.atomicToUnix(Date.UTC(1972, JANUARY, 1, 0, 0, 9, 999))).toBe(Date.UTC(1972, JANUARY, 1, 0, 0, 0, 106) + 0.757996)
    })

    it('simpler', () => {
      // After this point in time, conversions become far simpler and always integer numbers of milliseconds
      expect(tai.convert.oneToMany.atomicToUnix(Date.UTC(1972, JANUARY, 1, 0, 0, 10, 0))).toBe(Date.UTC(1972, JANUARY, 1, 0, 0, 0, 0))
      expect(tai.convert.oneToMany.atomicToUnix(Date.UTC(1972, JANUARY, 1, 0, 0, 10, 1))).toBe(Date.UTC(1972, JANUARY, 1, 0, 0, 0, 1))
      expect(tai.convert.oneToMany.atomicToUnix(Date.UTC(1972, JANUARY, 1, 0, 0, 10, 2))).toBe(Date.UTC(1972, JANUARY, 1, 0, 0, 0, 2))

      expect(tai.convert.oneToOne.atomicToUnix(Date.UTC(1972, JANUARY, 1, 0, 0, 10, 0))).toBe(Date.UTC(1972, JANUARY, 1, 0, 0, 0, 0))
      expect(tai.convert.oneToOne.atomicToUnix(Date.UTC(1972, JANUARY, 1, 0, 0, 10, 1))).toBe(Date.UTC(1972, JANUARY, 1, 0, 0, 0, 1))
      expect(tai.convert.oneToOne.atomicToUnix(Date.UTC(1972, JANUARY, 1, 0, 0, 10, 2))).toBe(Date.UTC(1972, JANUARY, 1, 0, 0, 0, 2))

      expect(tai.atomicToUnix(Date.UTC(1972, JANUARY, 1, 0, 0, 10, 0))).toBe(Date.UTC(1972, JANUARY, 1, 0, 0, 0, 0))
      expect(tai.atomicToUnix(Date.UTC(1972, JANUARY, 1, 0, 0, 10, 1))).toBe(Date.UTC(1972, JANUARY, 1, 0, 0, 0, 1))
      expect(tai.atomicToUnix(Date.UTC(1972, JANUARY, 1, 0, 0, 10, 2))).toBe(Date.UTC(1972, JANUARY, 1, 0, 0, 0, 2))
      // etc.
    })

    it('typical', () => {
      // A typical leap second from the past, note repetition
      expect(tai.convert.oneToMany.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 29, 750))).toBe(Date.UTC(1998, DECEMBER, 31, 23, 59, 58, 750))
      expect(tai.convert.oneToMany.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 30, 0))).toBe(Date.UTC(1998, DECEMBER, 31, 23, 59, 59, 0))
      expect(tai.convert.oneToMany.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 30, 250))).toBe(Date.UTC(1998, DECEMBER, 31, 23, 59, 59, 250))
      expect(tai.convert.oneToMany.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 30, 500))).toBe(Date.UTC(1998, DECEMBER, 31, 23, 59, 59, 500))
      expect(tai.convert.oneToMany.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 30, 750))).toBe(Date.UTC(1998, DECEMBER, 31, 23, 59, 59, 750))
      expect(tai.convert.oneToMany.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 31, 0))).toBe(Date.UTC(1999, JANUARY, 1, 0, 0, 0, 0))
      expect(tai.convert.oneToMany.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 31, 250))).toBe(Date.UTC(1999, JANUARY, 1, 0, 0, 0, 250))
      expect(tai.convert.oneToMany.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 31, 500))).toBe(Date.UTC(1999, JANUARY, 1, 0, 0, 0, 500))
      expect(tai.convert.oneToMany.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 31, 750))).toBe(Date.UTC(1999, JANUARY, 1, 0, 0, 0, 750))
      expect(tai.convert.oneToMany.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 32, 0))).toBe(Date.UTC(1999, JANUARY, 1, 0, 0, 0, 0)) // repetition
      expect(tai.convert.oneToMany.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 32, 250))).toBe(Date.UTC(1999, JANUARY, 1, 0, 0, 0, 250)) // repetition
      expect(tai.convert.oneToMany.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 32, 500))).toBe(Date.UTC(1999, JANUARY, 1, 0, 0, 0, 500)) // repetition
      expect(tai.convert.oneToMany.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 32, 750))).toBe(Date.UTC(1999, JANUARY, 1, 0, 0, 0, 750)) // repetition
      expect(tai.convert.oneToMany.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 33, 0))).toBe(Date.UTC(1999, JANUARY, 1, 0, 0, 1, 0))
      expect(tai.convert.oneToMany.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 33, 250))).toBe(Date.UTC(1999, JANUARY, 1, 0, 0, 1, 250))
    })

    it('now-ish', () => {
      expect(tai.convert.oneToMany.atomicToUnix(Date.UTC(2016, OCTOBER, 27, 20, 5, 50, 678))).toBe(Date.UTC(2016, OCTOBER, 27, 20, 5, 14, 678))
    })
  })

  describe('Unix->TAI conversions', () => {
    it('The NEW earliest instant in TAI', () => {
      expect(() => tai.convert.oneToMany.unixToAtomic(Date.UTC(1960, DECEMBER, 31, 23, 59, 59, 999))).toThrow()
    })

    it('icky', () => {
      // Again with the icky floating point comparisons. Fun fact! There is about 105 leap milliseconds here!
      expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1972, JANUARY, 1, 0, 0, 0, 0))).toEqual([
        Date.UTC(1972, JANUARY, 1, 0, 0, 9, 892) + 0.242004,
        Date.UTC(1972, JANUARY, 1, 0, 0, 10, 0)
      ])
      expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1972, JANUARY, 1, 0, 0, 0, 1)).length).toBe(2)
      expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1972, JANUARY, 1, 0, 0, 0, 1))[1]).toBe(Date.UTC(1972, JANUARY, 1, 0, 0, 10, 1))
      expect(tai.convert.oneToOne.unixToAtomic(Date.UTC(1972, JANUARY, 1, 0, 0, 0, 2))).toBe(Date.UTC(1972, JANUARY, 1, 0, 0, 10, 2))
      expect(tai.unixToAtomic(Date.UTC(1972, JANUARY, 1, 0, 0, 0, 2))).toBe(Date.UTC(1972, JANUARY, 1, 0, 0, 10, 2))
      // etc.
    })

    it('typical', () => {
      // A typical leap second from the past, note repetition
      expect(tai.convert.oneToOne.unixToAtomic(Date.UTC(1998, DECEMBER, 31, 23, 59, 58, 750))).toBe(Date.UTC(1999, JANUARY, 1, 0, 0, 29, 750))
      expect(tai.convert.oneToOne.unixToAtomic(Date.UTC(1998, DECEMBER, 31, 23, 59, 59, 0))).toBe(Date.UTC(1999, JANUARY, 1, 0, 0, 30, 0))
      expect(tai.convert.oneToOne.unixToAtomic(Date.UTC(1998, DECEMBER, 31, 23, 59, 59, 250))).toBe(Date.UTC(1999, JANUARY, 1, 0, 0, 30, 250))
      expect(tai.convert.oneToOne.unixToAtomic(Date.UTC(1998, DECEMBER, 31, 23, 59, 59, 500))).toBe(Date.UTC(1999, JANUARY, 1, 0, 0, 30, 500))

      expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1998, DECEMBER, 31, 23, 59, 59, 750))).toEqual([
        Date.UTC(1999, JANUARY, 1, 0, 0, 30, 750)
      ])
      expect(tai.convert.oneToOne.unixToAtomic(Date.UTC(1998, DECEMBER, 31, 23, 59, 59, 750))).toBe(Date.UTC(1999, JANUARY, 1, 0, 0, 30, 750))

      expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1999, JANUARY, 1, 0, 0, 0, 0))).toEqual([
        Date.UTC(1999, JANUARY, 1, 0, 0, 31, 0),
        Date.UTC(1999, JANUARY, 1, 0, 0, 32, 0)
      ])
      expect(tai.convert.oneToOne.unixToAtomic(Date.UTC(1999, JANUARY, 1, 0, 0, 0, 0))).toBe(Date.UTC(1999, JANUARY, 1, 0, 0, 32, 0))

      expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1999, JANUARY, 1, 0, 0, 0, 250))).toEqual([
        Date.UTC(1999, JANUARY, 1, 0, 0, 31, 250),
        Date.UTC(1999, JANUARY, 1, 0, 0, 32, 250)
      ])
      expect(tai.convert.oneToOne.unixToAtomic(Date.UTC(1999, JANUARY, 1, 0, 0, 0, 250))).toBe(Date.UTC(1999, JANUARY, 1, 0, 0, 32, 250))

      expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1999, JANUARY, 1, 0, 0, 0, 500))).toEqual([
        Date.UTC(1999, JANUARY, 1, 0, 0, 31, 500),
        Date.UTC(1999, JANUARY, 1, 0, 0, 32, 500)
      ])
      expect(tai.convert.oneToOne.unixToAtomic(Date.UTC(1999, JANUARY, 1, 0, 0, 0, 500))).toBe(Date.UTC(1999, JANUARY, 1, 0, 0, 32, 500))

      expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1999, JANUARY, 1, 0, 0, 0, 750))).toEqual([
        Date.UTC(1999, JANUARY, 1, 0, 0, 31, 750),
        Date.UTC(1999, JANUARY, 1, 0, 0, 32, 750)
      ])
      expect(tai.convert.oneToOne.unixToAtomic(Date.UTC(1999, JANUARY, 1, 0, 0, 0, 750))).toBe(Date.UTC(1999, JANUARY, 1, 0, 0, 32, 750))

      expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1999, JANUARY, 1, 0, 0, 1, 0))).toEqual([
        Date.UTC(1999, JANUARY, 1, 0, 0, 33, 0)
      ])
      expect(tai.convert.oneToOne.unixToAtomic(Date.UTC(1999, JANUARY, 1, 0, 0, 1, 0))).toBe(Date.UTC(1999, JANUARY, 1, 0, 0, 33, 0))
      expect(tai.convert.oneToOne.unixToAtomic(Date.UTC(1999, JANUARY, 1, 0, 0, 1, 250))).toBe(Date.UTC(1999, JANUARY, 1, 0, 0, 33, 250))
    })

    it('Now-ish', () => {
      expect(tai.convert.oneToOne.unixToAtomic(Date.UTC(2016, OCTOBER, 27, 20, 5, 14, 678))).toBe(Date.UTC(2016, OCTOBER, 27, 20, 5, 50, 678))
    })
  })

  it('Demo', () => {
    expect(tai.unixToAtomic(915148799000)).toBe(915148830000)
    expect(tai.unixToAtomic(Date.UTC(1998, DECEMBER, 31, 23, 59, 59))).toBe(Date.UTC(1999, JANUARY, 1, 0, 0, 30))
    expect(tai.atomicToUnix(915148830000)).toBe(915148799000)
    expect(tai.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 30))).toBe(Date.UTC(1998, DECEMBER, 31, 23, 59, 59))
    expect(tai.convert.oneToMany.unixToAtomic(915148800000)).toEqual([915148831000, 915148832000])
    expect(tai.convert.oneToMany.atomicToUnix(915148831000)).toBe(915148800000)
    expect(tai.convert.oneToMany.atomicToUnix(915148832000)).toBe(915148800000)
    expect(() => tai.convert.oneToOne.atomicToUnix(915148831000)).toThrow()
  })

  it('Crazy pre-1972 nonsense', () => {
    expect(Math.abs(tai.unixToAtomic(Date.UTC(1962, JANUARY, 1, 0, 0, 0)) - (Date.UTC(1962, JANUARY, 1, 0, 0, 1, 845) + 0.858)) < 0.0001)
  })

  it('inserted tenth', () => {
    // Oh look, an inserted leap tenth of a second!
    // The period between 1965-09-01 00:00:00 and 00:00:00.100 UTC happened twice!
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1965, SEPTEMBER, 1, 0, 0, 0, 50)).length).toBe(2)
    expect(Math.abs(tai.convert.oneToMany.unixToAtomic(Date.UTC(1965, SEPTEMBER, 1, 0, 0, 0, 50))[0] - (Date.UTC(1965, SEPTEMBER, 1, 0, 0, 4, 105) + 0.058)) < 0.0001)
    expect(Math.abs(tai.convert.oneToMany.unixToAtomic(Date.UTC(1965, SEPTEMBER, 1, 0, 0, 0, 50))[1] - (Date.UTC(1965, SEPTEMBER, 1, 0, 0, 4, 205) + 0.058)) < 0.0001)
  })

  it('removed twentieth', () => {
    // Hey, what! A removed leap twentieth of a second???
    // Well, technically, that's 1/20th of a TAI second, which is SLIGHTLY LESS than 1/20th of a UTC second
    // Which means that 23:59:59.950 UTC *does* actually exist...
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1961, JULY, 31, 23, 59, 59, 949)).length).toBe(1)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1961, JULY, 31, 23, 59, 59, 950)).length).toBe(1)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1961, JULY, 31, 23, 59, 59, 951)).length).toBe(0)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1961, JULY, 31, 23, 59, 59, 999)).length).toBe(0)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1961, AUGUST, 1, 0, 0, 0, 0)).length).toBe(1)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1961, AUGUST, 1, 0, 0, 0, 1)).length).toBe(1)
    expect(Math.abs(tai.convert.oneToMany.atomicToUnix(Date.UTC(1961, AUGUST, 1, 0, 0, 1, 647) + 0.570) - Date.UTC(1961, AUGUST, 1, 0, 0, 0, 0)) < 0.0001)
  })

  it('boundaries', () => {
    // Let's check out some boundaries where the relationship between TAI and UTC changed
    // 1 August 1961: 0.05 TAI seconds removed
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1961, JULY, 31, 23, 59, 59, 950)).length).toBe(1)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1961, JULY, 31, 23, 59, 59, 951)).length).toBe(0)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1961, JULY, 31, 23, 59, 59, 999)).length).toBe(0)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1961, AUGUST, 1, 0, 0, 0, 0)).length).toBe(1)

    // 1 January 1962: Perfect continuity (although the drift rate changed)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1961, DECEMBER, 31, 23, 59, 59, 999)).length).toBe(1)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1962, JANUARY, 1, 0, 0, 0, 0)).length).toBe(1)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1962, JANUARY, 1, 0, 0, 0, 1)).length).toBe(1)

    // 1 November 1963: 0.1 TAI seconds inserted
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1963, OCTOBER, 30, 23, 59, 59, 999)).length).toBe(1)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1963, NOVEMBER, 1, 0, 0, 0, 0)).length).toBe(2)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1963, NOVEMBER, 1, 0, 0, 0, 99)).length).toBe(2)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1963, NOVEMBER, 1, 0, 0, 0, 100)).length).toBe(1)

    // 1 January 1964: Perfect continuity (drift rate changes)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1963, DECEMBER, 31, 23, 59, 59, 999)).length).toBe(1)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1964, JANUARY, 1, 0, 0, 0, 0)).length).toBe(1)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1964, JANUARY, 1, 0, 0, 0, 1)).length).toBe(1)

    // 1 April 1964: 0.1 TAI seconds inserted
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1964, MARCH, 31, 23, 59, 59, 999)).length).toBe(1)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1964, APRIL, 1, 0, 0, 0, 0)).length).toBe(2)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1964, APRIL, 1, 0, 0, 0, 99)).length).toBe(2)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1964, APRIL, 1, 0, 0, 0, 100)).length).toBe(1)

    // etc. (various occasions when 0.1 TAI seconds were inserted)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1964, SEPTEMBER, 1, 0, 0, 0, 99)).length).toBe(2)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1965, JANUARY, 1, 0, 0, 0, 99)).length).toBe(2)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1965, MARCH, 1, 0, 0, 0, 99)).length).toBe(2)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1965, JULY, 1, 0, 0, 0, 99)).length).toBe(2)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1965, SEPTEMBER, 1, 0, 0, 0, 99)).length).toBe(2)

    // 1 January 1966: Perfect continuity (drift rate changes)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1965, DECEMBER, 31, 23, 59, 59, 999)).length).toBe(1)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1966, JANUARY, 1, 0, 0, 0, 0)).length).toBe(1)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1966, JANUARY, 1, 0, 0, 0, 1)).length).toBe(1)

    // 1 February 1968: 0.1 TAI seconds removed
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1968, JANUARY, 31, 23, 59, 59, 899)).length).toBe(1)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1968, JANUARY, 31, 23, 59, 59, 900)).length).toBe(1)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1968, JANUARY, 31, 23, 59, 59, 901)).length).toBe(0)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1968, JANUARY, 31, 23, 59, 59, 999)).length).toBe(0)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1968, FEBRUARY, 1, 0, 0, 0, 0)).length).toBe(1)

    // 1 January 1972: 0.107758 TAI seconds inserted
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1971, DECEMBER, 31, 23, 59, 59, 999)).length).toBe(1)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1972, JANUARY, 1, 0, 0, 0, 0)).length).toBe(2)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1972, JANUARY, 1, 0, 0, 0, 107)).length).toBe(2)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1972, JANUARY, 1, 0, 0, 0, 108)).length).toBe(1)

    expect(tai.convert.oneToMany.unixToAtomic(-265680000049.99997).length).toBe(0) // Removed time
    expect(tai.convert.oneToMany.unixToAtomic(-252460800000).length).toBe(1)
    expect(tai.convert.oneToMany.unixToAtomic(-194659199900).length).toBe(1)
    expect(tai.convert.oneToMany.unixToAtomic(-189388800000).length).toBe(1)
    expect(tai.convert.oneToMany.unixToAtomic(-181526399900).length).toBe(1)
    expect(tai.convert.oneToMany.unixToAtomic(-168307199900).length).toBe(1)
    expect(tai.convert.oneToMany.unixToAtomic(-157766399900).length).toBe(1)
    expect(tai.convert.oneToMany.unixToAtomic(-152668799900).length).toBe(1)
    expect(tai.convert.oneToMany.unixToAtomic(-142127999900).length).toBe(1)
    expect(tai.convert.oneToMany.unixToAtomic(-136771199900).length).toBe(1)
    expect(tai.convert.oneToMany.unixToAtomic(-126230400000).length).toBe(1)
    expect(tai.convert.oneToMany.unixToAtomic(-60480000099.99999).length).toBe(0) // Removed time
    expect(tai.convert.oneToMany.unixToAtomic(63072000107.758).length).toBe(1)

    expect(tai.convert.oneToMany.unixToAtomic(-60480000100).length).toBe(1)
    expect(tai.convert.oneToMany.unixToAtomic(Date.UTC(1968, 0, 31, 23, 59, 59, 900)).length).toBe(1)
  })
})

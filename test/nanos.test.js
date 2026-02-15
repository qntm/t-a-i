import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { TaiConverter, MODELS, UNIX_START, UNIX_END } from '../src/nanos.js'

const JAN = 0
const JUN = 5
const OCT = 9
const DEC = 11

describe('UNIX_START', () => {
  it('is correct', () => {
    assert.equal(UNIX_START, Date.UTC(1961, JAN, 1) * 1_000_000)
  })
})

describe('UNIX_END', () => {
  it('is at the limit of validity', () => {
    // https://hpiers.obspm.fr/iers/bul/bulc/BULLETINC.GUIDE.html
    const endDate = new Date(UNIX_END / 1_000_000)

    assert([JUN, DEC].includes(endDate.getUTCMonth()))
    assert.equal(endDate.getUTCDate(), 28)
    assert.equal(endDate.getUTCHours(), 0)
    assert.equal(endDate.getUTCMinutes(), 0)
    assert.equal(endDate.getUTCSeconds(), 0)
    assert.equal(endDate.getUTCMilliseconds(), 0)
  })
})

describe('TaiConverter', () => {
  describe('OVERRUN', () => {
    const taiConverter = TaiConverter(MODELS.OVERRUN)

    describe('unixToAtomic (array mode)', () => {
      const unixToAtomic = unixMillis => taiConverter.unixToAtomic(unixMillis, { array: true })

      it('starts TAI at 1961-01-01 00:00:01.422_818', () => {
        assert.deepEqual(unixToAtomic(Date.UTC(1961, JAN, 1, 0, 0, 0, 0) * 1_000_000),
          [-283_996_798_577_182_000])
        assert.deepEqual(unixToAtomic(BigInt(Date.UTC(1961, JAN, 1, 0, 0, 0, 0)) * 1_000_000n),
          [-283_996_798_577_182_000n])
        assert.deepEqual(unixToAtomic(BigInt(Date.UTC(1961, JAN, 1, 0, 0, 0, 0)) * 1_000_000n),
          [BigInt(Date.UTC(1961, JAN, 1, 0, 0, 1, 422)) * 1_000_000n + 818_000n])
      })

      it('advances 15 nanoseconds per second', () => {
        assert.deepEqual(unixToAtomic(Date.UTC(1961, JAN, 1, 0, 0, 1, 0) * 1_000_000),
          [-283_996_797_577_181_980]) // inaccurate
        assert.deepEqual(unixToAtomic(BigInt(Date.UTC(1961, JAN, 1, 0, 0, 1, 0)) * 1_000_000n),
          [-283_996_797_577_181_985n]) // precise

        // Or put this another way
        const unix1 = BigInt(Date.UTC(1961, JAN, 1, 0, 0, 1, 0)) * 1_000_000n
        const atomic1 = unixToAtomic(unix1)[0]
        const unix2 = unix1 + 1_000_000_000n
        const atomic2 = unixToAtomic(unix2)[0]
        assert.equal(atomic2, atomic1 + 1_000_000_015n)
      })

      it('advances 0.001_296 TAI seconds per Unix day', () => {
        assert.deepEqual(unixToAtomic(Date.UTC(1961, JAN, 2, 0, 0, 0, 0) * 1_000_000),
          [Date.UTC(1961, JAN, 2, 0, 0, 1, 424) * 1_000_000 + 114_000])
        assert.deepEqual(unixToAtomic(BigInt(Date.UTC(1961, JAN, 2, 0, 0, 0, 0)) * 1_000_000n),
          [BigInt(Date.UTC(1961, JAN, 2, 0, 0, 1, 424)) * 1_000_000n + 114_000n])
      })
    })

    describe('atomicToUnix', () => {
      it('typical', () => {
        // A typical leap second from the past, note repetition
        assert.equal(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 29, 750) * 1_000_000),
          Date.UTC(1998, DEC, 31, 23, 59, 58, 750) * 1_000_000)
        assert.equal(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30, 0) * 1_000_000),
          Date.UTC(1998, DEC, 31, 23, 59, 59, 0) * 1_000_000)
        assert.equal(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30, 250) * 1_000_000),
          Date.UTC(1998, DEC, 31, 23, 59, 59, 250) * 1_000_000)
        assert.equal(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30, 500) * 1_000_000),
          Date.UTC(1998, DEC, 31, 23, 59, 59, 500) * 1_000_000)
        assert.equal(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30, 750) * 1_000_000),
          Date.UTC(1998, DEC, 31, 23, 59, 59, 750) * 1_000_000)
        assert.equal(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 0) * 1_000_000),
          Date.UTC(1999, JAN, 1, 0, 0, 0, 0) * 1_000_000)
        assert.equal(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 250) * 1_000_000),
          Date.UTC(1999, JAN, 1, 0, 0, 0, 250) * 1_000_000)
        assert.equal(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 500) * 1_000_000),
          Date.UTC(1999, JAN, 1, 0, 0, 0, 500) * 1_000_000)
        assert.equal(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 750) * 1_000_000),
          Date.UTC(1999, JAN, 1, 0, 0, 0, 750) * 1_000_000)
        assert.equal(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 32, 0) * 1_000_000),
          Date.UTC(1999, JAN, 1, 0, 0, 0, 0) * 1_000_000) // repetition
        assert.equal(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 32, 250) * 1_000_000),
          Date.UTC(1999, JAN, 1, 0, 0, 0, 250) * 1_000_000) // repetition
        assert.equal(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 32, 500) * 1_000_000),
          Date.UTC(1999, JAN, 1, 0, 0, 0, 500) * 1_000_000) // repetition
        assert.equal(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 32, 750) * 1_000_000),
          Date.UTC(1999, JAN, 1, 0, 0, 0, 750) * 1_000_000) // repetition
        assert.equal(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 33, 0) * 1_000_000),
          Date.UTC(1999, JAN, 1, 0, 0, 1, 0) * 1_000_000)
        assert.equal(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 33, 250) * 1_000_000),
          Date.UTC(1999, JAN, 1, 0, 0, 1, 250) * 1_000_000)
      })
    })

    describe('atomicToOffset', () => {
      it('typical', () => {
        // A typical leap second from the past, note repetition
        assert.equal(taiConverter.atomicToOffset(BigInt(Date.UTC(1999, JAN, 1, 0, 0, 29, 750)) * 1_000_000n),
          31_000_000_000n)
        assert.equal(taiConverter.atomicToOffset(BigInt(Date.UTC(1999, JAN, 1, 0, 0, 30, 0)) * 1_000_000n),
          31_000_000_000n)
        assert.equal(taiConverter.atomicToOffset(BigInt(Date.UTC(1999, JAN, 1, 0, 0, 30, 250)) * 1_000_000n),
          31_000_000_000n)
        assert.equal(taiConverter.atomicToOffset(BigInt(Date.UTC(1999, JAN, 1, 0, 0, 30, 500)) * 1_000_000n),
          31_000_000_000n)
        assert.equal(taiConverter.atomicToOffset(BigInt(Date.UTC(1999, JAN, 1, 0, 0, 30, 750)) * 1_000_000n),
          31_000_000_000n)
        assert.equal(taiConverter.atomicToOffset(BigInt(Date.UTC(1999, JAN, 1, 0, 0, 31, 0)) * 1_000_000n),
          31_000_000_000n)
        assert.equal(taiConverter.atomicToOffset(BigInt(Date.UTC(1999, JAN, 1, 0, 0, 31, 250)) * 1_000_000n),
          31_000_000_000n)
        assert.equal(taiConverter.atomicToOffset(BigInt(Date.UTC(1999, JAN, 1, 0, 0, 31, 500)) * 1_000_000n),
          31_000_000_000n)
        assert.equal(taiConverter.atomicToOffset(BigInt(Date.UTC(1999, JAN, 1, 0, 0, 31, 750)) * 1_000_000n),
          31_000_000_000n)
        assert.equal(taiConverter.atomicToOffset(BigInt(Date.UTC(1999, JAN, 1, 0, 0, 32, 0)) * 1_000_000n),
          32_000_000_000n)
        assert.equal(taiConverter.atomicToOffset(BigInt(Date.UTC(1999, JAN, 1, 0, 0, 32, 250)) * 1_000_000n),
          32_000_000_000n)
        assert.equal(taiConverter.atomicToOffset(BigInt(Date.UTC(1999, JAN, 1, 0, 0, 32, 500)) * 1_000_000n),
          32_000_000_000n)
        assert.equal(taiConverter.atomicToOffset(BigInt(Date.UTC(1999, JAN, 1, 0, 0, 32, 750)) * 1_000_000n),
          32_000_000_000n)
        assert.equal(taiConverter.atomicToOffset(BigInt(Date.UTC(1999, JAN, 1, 0, 0, 33, 0)) * 1_000_000n),
          32_000_000_000n)
        assert.equal(taiConverter.atomicToOffset(BigInt(Date.UTC(1999, JAN, 1, 0, 0, 33, 250)) * 1_000_000n),
          32_000_000_000n)
      })
    })

    describe('TAI->Unix conversions', () => {
      it('now-ish', () => {
        assert.equal(taiConverter.atomicToUnix(BigInt(Date.UTC(2016, OCT, 27, 20, 5, 50, 678)) * 1_000_000n),
          BigInt(Date.UTC(2016, OCT, 27, 20, 5, 14, 678)) * 1_000_000n)
        assert.equal(taiConverter.atomicToOffset(BigInt(Date.UTC(2016, OCT, 27, 20, 5, 50, 678)) * 1_000_000n),
          36_000_000_000n)
      })
    })

    describe('Unix->TAI conversions', () => {
      it('The NEW earliest instant in TAI', () => {
        assert.deepEqual(taiConverter.unixToAtomic(Date.UTC(1960, DEC, 31, 23, 59, 59, 999) * 1_000_000, { array: true }),
          [])
        assert.equal(taiConverter.unixToAtomic(Date.UTC(1960, DEC, 31, 23, 59, 59, 999) * 1_000_000),
          NaN)
      })

      it('icky', () => {
        // Again with the icky floating point comparisons. Fun fact! There is about 105 leap milliseconds here!
        assert.deepEqual(taiConverter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 0) * 1_000_000, { array: true }),
          [
            Date.UTC(1972, JAN, 1, 0, 0, 9, 892) * 1_000_000 + 242_000, // should be + 0.242_004 but rounded towards 1970
            Date.UTC(1972, JAN, 1, 0, 0, 10, 0) * 1_000_000
          ])
        assert.equal(taiConverter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 0) * 1_000_000),
          Date.UTC(1972, JAN, 1, 0, 0, 10, 0) * 1_000_000)
        assert.equal(taiConverter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 1) * 1_000_000, { array: true }).length,
          2)
        assert.equal(taiConverter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 1) * 1_000_000, { array: true })[1],
          Date.UTC(1972, JAN, 1, 0, 0, 10, 1) * 1_000_000)
        assert.equal(taiConverter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 1) * 1_000_000),
          Date.UTC(1972, JAN, 1, 0, 0, 10, 1) * 1_000_000)
        assert.equal(taiConverter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 2) * 1_000_000),
          Date.UTC(1972, JAN, 1, 0, 0, 10, 2) * 1_000_000)
        // etc.
      })

      it('typical', () => {
        // A typical leap second from the past, note repetition
        assert.equal(taiConverter.unixToAtomic(Date.UTC(1998, DEC, 31, 23, 59, 59, 750) * 1_000_000),
          Date.UTC(1999, JAN, 1, 0, 0, 30, 750) * 1_000_000)
        assert.equal(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 0) * 1_000_000),
          Date.UTC(1999, JAN, 1, 0, 0, 32, 0) * 1_000_000)
        assert.equal(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 250) * 1_000_000),
          Date.UTC(1999, JAN, 1, 0, 0, 32, 250) * 1_000_000)
        assert.equal(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 500) * 1_000_000),
          Date.UTC(1999, JAN, 1, 0, 0, 32, 500) * 1_000_000)
        assert.equal(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 750) * 1_000_000),
          Date.UTC(1999, JAN, 1, 0, 0, 32, 750) * 1_000_000)
        assert.equal(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 1, 0) * 1_000_000),
          Date.UTC(1999, JAN, 1, 0, 0, 33, 0) * 1_000_000)
      })
    })
  })

  describe('SMEAR (demo)', () => {
    it('is not quite right when using floats', () => {
      const taiConverter = TaiConverter(MODELS.SMEAR)
      const unixNanos = Date.UTC(2017, JAN, 1, 11, 59, 59, 999) * 1_000_000
      const taiNanos = taiConverter.unixToAtomic(unixNanos)

      assert.equal(BigInt(unixNanos), 1_483_271_999_999_000_064n)
      assert.equal(BigInt(taiNanos), 1_483_272_036_999_000_064n)
    })

    it('gives extremely accurate values when using BigInts', () => {
      const taiConverter = TaiConverter(MODELS.SMEAR)
      const unixNanos = BigInt(Date.UTC(2017, JAN, 1, 11, 59, 59, 999)) * 1_000_000n
      const taiNanos = taiConverter.unixToAtomic(unixNanos)

      assert.equal(unixNanos, 1_483_271_999_999_000_000n)
      assert.equal(taiNanos, 1_483_272_036_998_999_988n)
    })
  })

  describe('atomicToOffset', () => {
    it('may or may not reflect a simple subtraction', () => {
      const taiConverter = TaiConverter(MODELS.STALL)

      assert.equal(taiConverter.unixToAtomic(0n), 8_000_082_000n) // exact
      assert.equal(taiConverter.unixToAtomic(1n), 8_000_082_000n + 1n) // truncated
      assert.equal(taiConverter.unixToAtomic(33_333_333n), 8_000_082_000n + 33_333_333n) // truncated
      // 33,333,333.3...ns would be exactly 1ns of drift
      assert.equal(taiConverter.unixToAtomic(33_333_334n), 8_000_082_000n + 33_333_335n) // truncated

      assert.equal(taiConverter.unixToAtomic(100_000_000n), 8_100_082_003n) // 3 ns drift, exact
      assert.equal(taiConverter.unixToAtomic(1_000_000_000n), 9_000_082_030n) // 30 ns drift, exact
      assert.equal(taiConverter.unixToAtomic(2_000_000_000n), 10_000_082_060n) // 60 ns drift
      assert.equal(taiConverter.unixToAtomic(86_400_000_000_000n), 86_408_002_674_000n) // 2,592,000 ns drift

      // Reverse
      assert.equal(taiConverter.atomicToUnix(8_000_082_000n), 0n)
      assert.equal(taiConverter.atomicToUnix(8_000_082_001n), 0n) // truncated
      assert.equal(taiConverter.atomicToUnix(8_000_082_002n), 1n) // truncated
      assert.equal(taiConverter.atomicToUnix(8_000_082_010n), 9n) // truncated
      assert.equal(taiConverter.atomicToUnix(8_000_082_011n), 10n) // truncated
      assert.equal(taiConverter.atomicToUnix(8_000_082_100n), 99n) // truncated
      assert.equal(taiConverter.atomicToUnix(8_000_082_101n), 100n) // truncated
      assert.equal(taiConverter.atomicToUnix(8_000_083_000n), 999n) // truncated
      assert.equal(taiConverter.atomicToUnix(8_000_083_001n), 1_000n) // truncated
      assert.equal(taiConverter.atomicToUnix(8_000_092_000n), 9_999n) // truncated
      assert.equal(taiConverter.atomicToUnix(8_000_092_001n), 10_000n) // truncated
      assert.equal(taiConverter.atomicToUnix(8_000_182_000n), 99_999n) // truncated
      assert.equal(taiConverter.atomicToUnix(8_000_182_001n), 100_000n) // truncated
      assert.equal(taiConverter.atomicToUnix(8_001_082_000n), 999_999n) // truncated
      assert.equal(taiConverter.atomicToUnix(8_001_082_001n), 1_000_000n) // truncated
      assert.equal(taiConverter.atomicToUnix(8_010_082_000n), 9_999_999n) // truncated
      assert.equal(taiConverter.atomicToUnix(8_010_082_001n), 10_000_000n) // truncated
      assert.equal(taiConverter.atomicToUnix(8_000_082_000n + 33_333_333n), 33_333_332n)
      assert.equal(taiConverter.atomicToUnix(8_000_082_000n + 33_333_334n), 33_333_333n)
      assert.equal(taiConverter.atomicToUnix(8_000_082_000n + 33_333_335n), 33_333_333n)
      assert.equal(taiConverter.atomicToUnix(8_100_082_003n), 100_000_000n)
      assert.equal(taiConverter.atomicToUnix(8_500_082_015n), 500_000_000n)
      assert.equal(taiConverter.atomicToUnix(9_000_082_030n), 1_000_000_000n)
      assert.equal(taiConverter.atomicToUnix(10_000_082_060n), 2_000_000_000n)
      assert.equal(taiConverter.atomicToUnix(86_408_002_674_000n), 86_400_000_000_000n)

      assert.equal(taiConverter.atomicToOffset(8_000_082_000n), 8_000_082_000n)
      assert.equal(taiConverter.atomicToOffset(8_000_082_001n), 8_000_082_000n)
      assert.equal(taiConverter.atomicToOffset(8_000_082_002n), 8_000_082_000n)
      assert.equal(taiConverter.atomicToOffset(8_000_082_000n + 33_333_333n), 8_000_082_000n)
      assert.equal(taiConverter.atomicToOffset(8_000_082_000n + 33_333_334n), 8_000_082_000n)
      assert.equal(taiConverter.atomicToOffset(8_000_082_000n + 33_333_335n), 8_000_082_001n)
      assert.equal(taiConverter.atomicToOffset(8_100_082_003n), 8_000_082_000n + 3n)
      assert.equal(taiConverter.atomicToOffset(8_500_082_015n), 8_000_082_000n + 15n)
      assert.equal(taiConverter.atomicToOffset(9_000_082_030n), 8_000_082_000n + 30n)
      assert.equal(taiConverter.atomicToOffset(10_000_082_060n), 8_000_082_000n + 60n)
      assert.equal(taiConverter.atomicToOffset(86_408_002_674_000n), 8_000_082_000n + 2_592_000n)

      // Here is a succinct demonstration of why `atomicToOffset` exists
      const atomic = 8_000_082_001n
      assert.equal(atomic - taiConverter.atomicToUnix(atomic), 8_000_082_001n) // wrong
      assert.equal(taiConverter.atomicToOffset(atomic), 8_000_082_000n) // right
    })
  })
})

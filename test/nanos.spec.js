import assert from 'node:assert'
import { describe, it } from 'mocha'
import { TaiConverter, MODELS, UNIX_START, UNIX_END } from '../src/nanos.js'

const JAN = 0
const JUN = 5
const OCT = 9
const DEC = 11

describe('UNIX_START', () => {
  it('is correct', () => {
    assert.strictEqual(UNIX_START, Date.UTC(1961, JAN, 1) * 1_000_000)
  })
})

describe('UNIX_END', () => {
  it('is at the limit of validity', () => {
    // https://hpiers.obspm.fr/iers/bul/bulc/BULLETINC.GUIDE.html
    const endDate = new Date(UNIX_END / 1_000_000)

    assert([JUN, DEC].includes(endDate.getUTCMonth()))
    assert.strictEqual(endDate.getUTCDate(), 28)
    assert.strictEqual(endDate.getUTCHours(), 0)
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
        assert.deepStrictEqual(unixToAtomic(Date.UTC(1961, JAN, 1, 0, 0, 0, 0) * 1_000_000),
          [-283_996_798_577_182_000])
        assert.deepStrictEqual(unixToAtomic(BigInt(Date.UTC(1961, JAN, 1, 0, 0, 0, 0)) * 1_000_000n),
          [-283_996_798_577_182_000n])
        assert.deepStrictEqual(unixToAtomic(BigInt(Date.UTC(1961, JAN, 1, 0, 0, 0, 0)) * 1_000_000n),
          [BigInt(Date.UTC(1961, JAN, 1, 0, 0, 1, 422)) * 1_000_000n + 818_000n])
      })

      it('advances 15 nanoseconds per second', () => {
        assert.deepStrictEqual(unixToAtomic(Date.UTC(1961, JAN, 1, 0, 0, 1, 0) * 1_000_000),
          [-283_996_797_577_181_980]) // inaccurate
        assert.deepStrictEqual(unixToAtomic(BigInt(Date.UTC(1961, JAN, 1, 0, 0, 1, 0)) * 1_000_000n),
          [-283_996_797_577_181_985n]) // precise

        // Or put this another way
        const unix1 = BigInt(Date.UTC(1961, JAN, 1, 0, 0, 1, 0)) * 1_000_000n
        const atomic1 = unixToAtomic(unix1)[0]
        const unix2 = unix1 + 1_000_000_000n
        const atomic2 = unixToAtomic(unix2)[0]
        assert.strictEqual(atomic2, atomic1 + 1_000_000_015n)
      })

      it('advances 0.001_296 TAI seconds per Unix day', () => {
        assert.deepStrictEqual(unixToAtomic(Date.UTC(1961, JAN, 2, 0, 0, 0, 0) * 1_000_000),
          [Date.UTC(1961, JAN, 2, 0, 0, 1, 424) * 1_000_000 + 114_000])
        assert.deepStrictEqual(unixToAtomic(BigInt(Date.UTC(1961, JAN, 2, 0, 0, 0, 0)) * 1_000_000n),
          [BigInt(Date.UTC(1961, JAN, 2, 0, 0, 1, 424)) * 1_000_000n + 114_000n])
      })
    })

    describe('atomicToUnix', () => {
      it('typical', () => {
        // A typical leap second from the past, note repetition
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 29, 750) * 1_000_000),
          Date.UTC(1998, DEC, 31, 23, 59, 58, 750) * 1_000_000)
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30, 0) * 1_000_000),
          Date.UTC(1998, DEC, 31, 23, 59, 59, 0) * 1_000_000)
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30, 250) * 1_000_000),
          Date.UTC(1998, DEC, 31, 23, 59, 59, 250) * 1_000_000)
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30, 500) * 1_000_000),
          Date.UTC(1998, DEC, 31, 23, 59, 59, 500) * 1_000_000)
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 30, 750) * 1_000_000),
          Date.UTC(1998, DEC, 31, 23, 59, 59, 750) * 1_000_000)
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 0) * 1_000_000),
          Date.UTC(1999, JAN, 1, 0, 0, 0, 0) * 1_000_000)
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 250) * 1_000_000),
          Date.UTC(1999, JAN, 1, 0, 0, 0, 250) * 1_000_000)
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 500) * 1_000_000),
          Date.UTC(1999, JAN, 1, 0, 0, 0, 500) * 1_000_000)
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 31, 750) * 1_000_000),
          Date.UTC(1999, JAN, 1, 0, 0, 0, 750) * 1_000_000)
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 32, 0) * 1_000_000),
          Date.UTC(1999, JAN, 1, 0, 0, 0, 0) * 1_000_000) // repetition
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 32, 250) * 1_000_000),
          Date.UTC(1999, JAN, 1, 0, 0, 0, 250) * 1_000_000) // repetition
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 32, 500) * 1_000_000),
          Date.UTC(1999, JAN, 1, 0, 0, 0, 500) * 1_000_000) // repetition
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 32, 750) * 1_000_000),
          Date.UTC(1999, JAN, 1, 0, 0, 0, 750) * 1_000_000) // repetition
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 33, 0) * 1_000_000),
          Date.UTC(1999, JAN, 1, 0, 0, 1, 0) * 1_000_000)
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(1999, JAN, 1, 0, 0, 33, 250) * 1_000_000),
          Date.UTC(1999, JAN, 1, 0, 0, 1, 250) * 1_000_000)
      })
    })

    describe('TAI->Unix conversions', () => {
      it('now-ish', () => {
        assert.strictEqual(taiConverter.atomicToUnix(Date.UTC(2016, OCT, 27, 20, 5, 50, 678) * 1_000_000),
          Date.UTC(2016, OCT, 27, 20, 5, 14, 678) * 1_000_000)
      })
    })

    describe('Unix->TAI conversions', () => {
      it('The NEW earliest instant in TAI', () => {
        assert.deepStrictEqual(taiConverter.unixToAtomic(Date.UTC(1960, DEC, 31, 23, 59, 59, 999) * 1_000_000, { array: true }),
          [])
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1960, DEC, 31, 23, 59, 59, 999) * 1_000_000),
          NaN)
      })

      it('icky', () => {
        // Again with the icky floating point comparisons. Fun fact! There is about 105 leap milliseconds here!
        assert.deepStrictEqual(taiConverter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 0) * 1_000_000, { array: true }),
          [
            Date.UTC(1972, JAN, 1, 0, 0, 9, 892) * 1_000_000 + 242_000, // should be + 0.242_004 but rounded towards 1970
            Date.UTC(1972, JAN, 1, 0, 0, 10, 0) * 1_000_000
          ])
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 0) * 1_000_000),
          Date.UTC(1972, JAN, 1, 0, 0, 10, 0) * 1_000_000)
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 1) * 1_000_000, { array: true }).length,
          2)
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 1) * 1_000_000, { array: true })[1],
          Date.UTC(1972, JAN, 1, 0, 0, 10, 1) * 1_000_000)
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 1) * 1_000_000),
          Date.UTC(1972, JAN, 1, 0, 0, 10, 1) * 1_000_000)
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1972, JAN, 1, 0, 0, 0, 2) * 1_000_000),
          Date.UTC(1972, JAN, 1, 0, 0, 10, 2) * 1_000_000)
        // etc.
      })

      it('typical', () => {
        // A typical leap second from the past, note repetition
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1998, DEC, 31, 23, 59, 59, 750) * 1_000_000),
          Date.UTC(1999, JAN, 1, 0, 0, 30, 750) * 1_000_000)
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 0) * 1_000_000),
          Date.UTC(1999, JAN, 1, 0, 0, 32, 0) * 1_000_000)
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 250) * 1_000_000),
          Date.UTC(1999, JAN, 1, 0, 0, 32, 250) * 1_000_000)
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 500) * 1_000_000),
          Date.UTC(1999, JAN, 1, 0, 0, 32, 500) * 1_000_000)
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 0, 750) * 1_000_000),
          Date.UTC(1999, JAN, 1, 0, 0, 32, 750) * 1_000_000)
        assert.strictEqual(taiConverter.unixToAtomic(Date.UTC(1999, JAN, 1, 0, 0, 1, 0) * 1_000_000),
          Date.UTC(1999, JAN, 1, 0, 0, 33, 0) * 1_000_000)
      })
    })
  })

  describe('SMEAR (demo)', () => {
    it('is not quite right when using floats', () => {
      const taiConverter = TaiConverter(MODELS.SMEAR)
      const unixNanos = Date.UTC(2017, JAN, 1, 11, 59, 59, 999) * 1_000_000
      const taiNanos = taiConverter.unixToAtomic(unixNanos)

      assert.strictEqual(BigInt(unixNanos), 1_483_271_999_999_000_064n)
      assert.strictEqual(BigInt(taiNanos), 1_483_272_036_999_000_064n)
    })

    it('gives extremely accurate values when using BigInts', () => {
      const taiConverter = TaiConverter(MODELS.SMEAR)
      const unixNanos = BigInt(Date.UTC(2017, JAN, 1, 11, 59, 59, 999)) * 1_000_000n
      const taiNanos = taiConverter.unixToAtomic(unixNanos)

      assert.strictEqual(unixNanos, 1_483_271_999_999_000_000n)
      assert.strictEqual(taiNanos, 1_483_272_036_998_999_988n)
    })
  })
})

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
  it('is correct', () => {
    const endDate = new Date(UNIX_END / 1_000_000)

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
        assert.deepStrictEqual(unixToAtomic(Date.UTC(1961, JAN, 1, 0, 0, 0, 0) * 1_000_000),
          [-283_996_798_577_182_000])
      })

      it('advances 0.001_296 TAI seconds per Unix day', () => {
        assert.deepStrictEqual(unixToAtomic(Date.UTC(1961, JAN, 2, 0, 0, 0, 0) * 1_000_000),
          [Date.UTC(1961, JAN, 2, 0, 0, 1, 424) * 1_000_000 + 114_000])
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
})

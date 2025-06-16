import assert from 'node:assert'
import { describe, it } from 'mocha'
import { MODELS } from '../src/munge.js'
import { NanosConverter } from '../src/nanos-converter.js'

const JAN = 0
const OCT = 9
const NOV = 10

describe('NanosConverter', () => {
  describe('one ray', () => {
    const data = [
      [Date.UTC(1970, JAN, 1), 0]
    ]

    describe('OVERRUN', () => {
      const nanosConverter = new NanosConverter(data, MODELS.OVERRUN)

      it('manages basic conversions', () => {
        assert.deepStrictEqual(nanosConverter.unixToAtomic(0, { range: true, array: true }),
          [[0, 0]])
        assert.deepStrictEqual(nanosConverter.unixToAtomic(0, { range: true }),
          [0, 0])
        assert.deepStrictEqual(nanosConverter.unixToAtomic(0, { array: true }),
          [0])
        assert.strictEqual(nanosConverter.unixToAtomic(0),
          0)
        assert.strictEqual(nanosConverter.atomicToUnix(0),
          0)
      })
    })

    describe('BREAK', () => {
      const nanosConverter = new NanosConverter(data, MODELS.BREAK)

      it('manages basic conversions', () => {
        assert.strictEqual(nanosConverter.unixToAtomic(0),
          0)
        assert.strictEqual(nanosConverter.atomicToUnix(0),
          0)
      })
    })

    describe('STALL', () => {
      const nanosConverter = new NanosConverter(data, MODELS.STALL)

      it('fails on a non-integer number of milliseconds', () => {
        assert.throws(() => nanosConverter.unixToAtomic(89.3), /Not an integer: 89.3/)
        assert.throws(() => nanosConverter.unixToAtomic('boop'), /Not an integer: boop/)
        assert.throws(() => nanosConverter.atomicToUnix(Infinity), /Not an integer: Infinity/)
        assert.throws(() => nanosConverter.atomicToUnix('boops'), /Not an integer: boops/)
      })

      it('fails when the atomic count is out of bounds', () => {
        assert.strictEqual(nanosConverter.atomicToUnix(0),
          0)
        assert.strictEqual(nanosConverter.atomicToUnix(-1),
          NaN)
      })

      it('fails when the Unix count is out of bounds', () => {
        assert.strictEqual(nanosConverter.unixToAtomic(0),
          0)
        assert.strictEqual(nanosConverter.unixToAtomic(-1),
          NaN)
      })

      it('manages basic conversions', () => {
        assert.deepStrictEqual(nanosConverter.unixToAtomic(0, { range: true, array: true }), [[0, 0]])
        assert.deepStrictEqual(nanosConverter.unixToAtomic(0, { range: true }), [0, 0])
        assert.deepStrictEqual(nanosConverter.unixToAtomic(0, { array: true }), [0])
        assert.strictEqual(nanosConverter.unixToAtomic(0), 0)
        assert.strictEqual(nanosConverter.atomicToUnix(0), 0)
      })
    })

    describe('SMEAR', () => {
      const nanosConverter = new NanosConverter(data, MODELS.SMEAR)

      it('manages basic conversions', () => {
        assert.strictEqual(nanosConverter.unixToAtomic(0),
          0)
        assert.strictEqual(nanosConverter.atomicToUnix(0),
          0)
      })
    })
  })

  describe('1 November 1963: 0.1 TAI seconds inserted', () => {
    const data = [
      [Date.UTC(1962, JAN, 1), 1.845_858_0, 37_665, 0.001_123_2],
      [Date.UTC(1963, NOV, 1), 1.945_858_0, 37_665, 0.001_123_2] // 0.1 TAI seconds added to UTC
    ]
    const nanosConverter = new NanosConverter(data, MODELS.OVERRUN)

    it('before anything clever occurs', () => {
      assert.deepStrictEqual(nanosConverter.unixToAtomic(Date.UTC(1963, OCT, 31, 23, 59, 59, 999) * 1_000_000, { array: true }),
        [
          Date.UTC(1963, NOV, 1, 0, 0, 2, 596) * 1_000_000 + 278_800
        ])
      // -194_745_597_404_844_400_013n TAI picoseconds
    })

    it('exactly at the time', () => {
      assert.deepStrictEqual(nanosConverter.unixToAtomic(Date.UTC(1963, NOV, 1, 0, 0, 0, 0) * 1_000_000, { array: true }),
        [
          Date.UTC(1963, NOV, 1, 0, 0, 2, 597) * 1_000_000 + 278_800,
          Date.UTC(1963, NOV, 1, 0, 0, 2, 697) * 1_000_000 + 278_800
        ])
    })

    it('then', () => {
      assert.deepStrictEqual(nanosConverter.unixToAtomic(Date.UTC(1963, NOV, 1, 0, 0, 0, 1) * 1_000_000, { array: true }),
        [
          Date.UTC(1963, NOV, 1, 0, 0, 2, 598) * 1_000_000 + 278_800,
          Date.UTC(1963, NOV, 1, 0, 0, 2, 698) * 1_000_000 + 278_800
        ])

      assert.deepStrictEqual(nanosConverter.unixToAtomic(Date.UTC(1963, NOV, 1, 0, 0, 0, 99) * 1_000_000, { array: true }),
        [
          Date.UTC(1963, NOV, 1, 0, 0, 2, 696) * 1_000_000 + 278_820,
          Date.UTC(1963, NOV, 1, 0, 0, 2, 796) * 1_000_000 + 278_820 // -194_659_197_203_721_198_713n TAI
        ])

      assert.deepStrictEqual(nanosConverter.unixToAtomic(Date.UTC(1963, NOV, 1, 0, 0, 0, 100) * 1_000_000, { array: true }),
        [
          Date.UTC(1963, NOV, 1, 0, 0, 2, 797) * 1_000_000 + 278_820
        ])

      assert.deepStrictEqual(nanosConverter.unixToAtomic(Date.UTC(1963, NOV, 1, 0, 0, 0, 101) * 1_000_000, { array: true }),
        [
          Date.UTC(1963, NOV, 1, 0, 0, 2, 798) * 1_000_000 + 278_820
        ])
    })
  })
})

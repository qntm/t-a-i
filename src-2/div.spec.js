const {
  roundNegativeInfinity,
  roundPositiveInfinity
} = require('./div')

describe('div', () => {
  describe('roundNegativeInfinity', () => {
    it('works', () => {
      expect(roundNegativeInfinity(789n, 1n)).toBe(789n)
      expect(roundNegativeInfinity(1n, 1n)).toBe(1n)
      expect(roundNegativeInfinity(0n, 1n)).toBe(0n)
      expect(roundNegativeInfinity(-1n, 1n)).toBe(-1n)
      expect(roundNegativeInfinity(-123n, 1n)).toBe(-123n)

      expect(roundNegativeInfinity(60n, 6n)).toBe(10n)
      expect(roundNegativeInfinity(61n, 6n)).toBe(10n)
      expect(roundNegativeInfinity(65n, 6n)).toBe(10n)
      expect(roundNegativeInfinity(66n, 6n)).toBe(11n)

      expect(roundNegativeInfinity(-60n, 6n)).toBe(-10n)
      expect(roundNegativeInfinity(-61n, 6n)).toBe(-11n)
      expect(roundNegativeInfinity(-65n, 6n)).toBe(-11n)
      expect(roundNegativeInfinity(-66n, 6n)).toBe(-11n)

      expect(roundNegativeInfinity(-576n, 100n)).toBe(-6n)
    })
  })

  describe('roundPositiveInfinity', () => {
      expect(roundPositiveInfinity(789n, 1n)).toBe(789n)
      expect(roundPositiveInfinity(1n, 1n)).toBe(1n)
      expect(roundPositiveInfinity(0n, 1n)).toBe(0n)
      expect(roundPositiveInfinity(-1n, 1n)).toBe(-1n)
      expect(roundPositiveInfinity(-123n, 1n)).toBe(-123n)

      expect(roundPositiveInfinity(60n, 6n)).toBe(10n) // % is 0n
      expect(roundPositiveInfinity(61n, 6n)).toBe(11n) // % is 1n
      expect(roundPositiveInfinity(65n, 6n)).toBe(11n) // % is 5n
      expect(roundPositiveInfinity(66n, 6n)).toBe(11n) // % is 0n

      expect(roundPositiveInfinity(-60n, 6n)).toBe(-10n) // % is 0n
      expect(roundPositiveInfinity(-61n, 6n)).toBe(-10n) // % is -1n
      expect(roundPositiveInfinity(-65n, 6n)).toBe(-10n) // % is -5n
      expect(roundPositiveInfinity(-66n, 6n)).toBe(-11n) // % is 0n
  })
})

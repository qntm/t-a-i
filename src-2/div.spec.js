const {
  roundNegativeInfinity,
  roundPositiveInfinity
} = require('./div')

describe('div', () => {
  describe('roundNegativeInfinity', () => {
    it('works', () => {
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
      expect(roundPositiveInfinity(60n, 6n)).toBe(10n)
      expect(roundPositiveInfinity(61n, 6n)).toBe(11n)
      expect(roundPositiveInfinity(65n, 6n)).toBe(11n)
      expect(roundPositiveInfinity(66n, 6n)).toBe(11n)
      expect(roundPositiveInfinity(-60n, 6n)).toBe(-10n)
      expect(roundPositiveInfinity(-61n, 6n)).toBe(-10n)
      expect(roundPositiveInfinity(-65n, 6n)).toBe(-10n)
      expect(roundPositiveInfinity(-66n, 6n)).toBe(-11n)
  })
})

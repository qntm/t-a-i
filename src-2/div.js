// BigInt division rounds towards zero but we need a division which rounds
// towards negative infinity. Assume `b` is positive

const roundNegativeInfinity = (a, b) =>
  a / b - (a % b < 0n ? 1n : 0n)

const roundPositiveInfinity = (a, b) =>
  a / b + (a % b > 0n ? 1n : 0n)

module.exports = {
  roundNegativeInfinity,
  roundPositiveInfinity
}

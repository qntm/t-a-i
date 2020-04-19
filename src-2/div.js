// BigInt division rounds towards zero but we need a division which rounds
// towards negative infinity

const roundNegativeInfinity = (a, b) => {
  const modulus = (a % b) + (a >= 0n ? 0n : b)
  return (a - modulus) / b
}

const roundPositiveInfinity = (a, b) => {
  const antiModulus = (a <= 0n ? 0n : b) - a % b
  return (antiModulus - a) / b
}

module.exports = {
  roundNegativeInfinity,
  roundPositiveInfinity
}

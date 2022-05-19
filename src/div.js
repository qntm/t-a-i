// Divide two BigInts and round the result towards negative infinity

// Why doesn't JavaScript have this?
const sign = a => a > 0n ? 1n : a === 0n ? 0n : -1n

const div = (a, b) => {
  const q = a / b

  // `b` must be non-zero or we would have thrown an exception by now

  if (a % b === 0n) {
    // a is a precise multiple of b, no truncation occurred
    return q
  }

  // `a` must be non-zero

  if (sign(a) === sign(b)) {
    // Result was positive, quotient was rounded in the correct direction already
    return q
  }

  // Result was negative, quotient was rounded in the wrong direction, undo this
  return q - 1n
}

// Return value always has the same sign as `b`, so we can divide both `a` and `b`
// by the return value to always end up with a positive `b`
const gcd = (a, b) => {
  const bNegative = b < 0n
  while (b !== 0n) {
    [a, b] = [b, a % b]
  }
  const aNegative = a < 0n
  return aNegative === bNegative ? a : -a
}

module.exports.sign = sign
module.exports.div = div
module.exports.gcd = gcd

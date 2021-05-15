// Divide two BigInts and round the result towards negative infinity
const div = (a, b) => {
  const q = a / b

  // `b` must be non-zero or we would have thrown an exception by now

  if (a % b === 0n) {
    // a is a precise multiple of b, no truncation occurred
    return q
  }

  // `a` must be non-zero

  if ((a > 0n) === (b > 0n)) {
    // Result was positive, quotient was rounded in the correct direction already
    return q
  }

  // Result was negative, quotient was rounded in the wrong direction, undo this
  return q - 1n
}

module.exports.div = div

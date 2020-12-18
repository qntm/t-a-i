// Divide and round towards negative infinity
module.exports = (a, b) => {
  const q = a / b
  
  // `b` is non-zero or we would have thrown an exception by now

  if (a % b === 0n) {
    // a is a precise multiple of b, no truncation occurred
    return q
  }

  // `a` is also non-zero

  if (a > 0n === b > 0n) {
    // Result was positive, quotient was rounded in the correct direction already
    return q
  }

  // Result was negative, quotient was rounded in the wrong direction, undo this
  return q - 1n
}

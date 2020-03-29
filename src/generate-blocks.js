/**
  Convert the initial parameters and the leap seconds list into a list of
  blocks of Unix time which track exactly with atomic time.
*/

const atomicToUnix = (atomic, offset, undriftRate) => {
  if (atomic === Infinity) {
    return Infinity
  }
  atomic -= offset
  // Ordinarily we would now divide `atomic` by `1 + driftRate`
  // but this number is very close to 1 so we seem to lose a little precision.
  atomic -= atomic * undriftRate
  return atomic
}

module.exports = leapSeconds => {
  if (leapSeconds.length < 1) {
    throw new Error('Need to provide at least one reference point')
  }

  leapSeconds.forEach((leapSecond, i) => {
    if (i + 1 < leapSeconds.length && leapSeconds[i + 1].atomic <= leapSecond.atomic) {
      throw new Error('Disordered leap seconds: ' + leapSecond.atomic + ', ' + leapSeconds[i + 1].atomic)
    }
  })

  return leapSeconds.map((leapSecond, i) => {
    const offset = leapSecond.offset
    const driftRate = leapSecond.driftRate === undefined ? 0.000000 : leapSecond.driftRate

    // Convert UTC to TAI by multiplying by (1 + driftRate)
    // Defaults to 0

    // Convert TAI to UTC by multiplying by (1 - undriftRate), where
    // UDR = DR - DR^2 + DR^3 - ...
    let undriftRate = 0
    let power = 1
    while (true) {
      const newUndriftRate = undriftRate - Math.pow(-driftRate, power)
      if (newUndriftRate === undriftRate) {
        break
      }
      undriftRate = newUndriftRate
      power++
    }

    const atomicStart = leapSecond.atomic
    const atomicEnd = i + 1 === leapSeconds.length ? Infinity : leapSeconds[i + 1].atomic

    // `unixStart` and `unixEnd` may optionally be pre-specified
    const unixStart = 'unixStart' in leapSecond ? leapSecond.unixStart : atomicToUnix(atomicStart, offset, undriftRate)
    const unixEnd = 'unixEnd' in leapSecond ? leapSecond.unixEnd : atomicToUnix(atomicEnd, offset, undriftRate)

    return {
      offset,
      driftRate,
      undriftRate,
      atomicStart,
      atomicEnd,
      unixStart,
      unixEnd
    }
  })
}

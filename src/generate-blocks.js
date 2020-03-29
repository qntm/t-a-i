/**
  Convert the initial parameters and the leap seconds list into a list of
  blocks of Unix time which track exactly with atomic time.
*/

const picosPerMilli = 1000000000n

const dateToUnixPicos = date => BigInt(date.getTime()) * picosPerMilli

const millisPerDay = 24n * 60n * 60n * 1000n
const mjdEpoch_date = new Date(1858, 10 /* November */, 17)
const mjdEpoch_unixMillis = BigInt(mjdEpoch_date.getTime())

const unixEpoch_date = new Date(1970, 0 /* January */, 1)
const unixEpoch_unixMillis = BigInt(unixEpoch_date.getTime())
const unixEpoch_unixPicos = dateToUnixPicos(unixEpoch_date)

// Convert a modified Julian day count e.g. 37_300n to a `Date`
// e.g. 1961-01-01
const mjdToDate = mjd => new Date(Number(mjdEpoch_unixMillis + mjd * millisPerDay))

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
    if ((i + 1) in leapSeconds && leapSeconds[i + 1].atomic <= leapSecond.atomic) {
      throw new Error('Disordered leap seconds: ' + leapSecond.atomic + ', ' + leapSeconds[i + 1].atomic)
    }
  })

  return leapSeconds.map((leapSecond, i) => {
    const blockRoot_date = mjdToDate(leapSecond.blockRoot_mjd)

    const blockStart_unixMillis = BigInt(leapSecond.blockStart_date.getTime())
    const blockRoot_unixMillis = BigInt(blockRoot_date.getTime())

    const driftRate_taiPicosPerUnixMilli = leapSecond.driftRate_taiPicosPerUnixDay / millisPerDay

    const offsetAtUnixEpoch_unixPicos = leapSecond.offsetAtBlockRoot_picos + driftRate_taiPicosPerUnixMilli * (unixEpoch_unixMillis - blockRoot_unixMillis)

    return {
      blockStart_unixMillis,
      driftRate_taiPicosPerUnixMilli,
      offsetAtUnixEpoch_unixPicos
    }

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

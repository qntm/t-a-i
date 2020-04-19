// So what do we ACTUALLY need from our data?

const JAN = 0
const NOV = 10

const picosPerMilli = 1000n * 1000n * 1000n
const millisPerDay = 24n * 60n * 60n * 1000n

const mjdEpoch_date = new Date(Date.UTC(1858, NOV, 17))
const mjdEpoch_unixMillis = BigInt(mjdEpoch_date.getTime())

module.exports = data => {
  const munged = data.map(datum => {
    const [
      blockStart_unixMillis,
      offsetAtRoot_atomicPicos,
      root_mjds = 0n,
      driftRate_atomicPicosPerUnixDay = 0n
    ] = datum

    const root_unixMillis = mjdEpoch_unixMillis + root_mjds * millisPerDay

    const driftRate_atomicPicosPerUnixMilli = driftRate_atomicPicosPerUnixDay / millisPerDay
    // Typically 15n

    const ratio_atomicPicosPerUnixMilli = picosPerMilli + driftRate_atomicPicosPerUnixMilli
    // Typically 1000000015n

    const offsetAtUnixEpoch_atomicPicos = offsetAtRoot_atomicPicos
      - root_unixMillis * driftRate_atomicPicosPerUnixMilli

    const blockStart_atomicPicos = offsetAtUnixEpoch_atomicPicos
      + blockStart_unixMillis * ratio_atomicPicosPerUnixMilli

    return {
      blockStart_unixMillis,
      ratio_atomicPicosPerUnixMilli,
      blockStart_atomicPicos,
      offsetAtUnixEpoch_atomicPicos
    }
  })

  munged.forEach((datum, i, arr) => {
    datum.blockEnd_atomicPicos = i + 1 in arr ? arr[i + 1].blockStart_atomicPicos : Infinity
  })

  return munged
}

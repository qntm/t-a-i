const data = require('./data')
const div = require('./div')
const munge = require('./munge')

const picosPerMilli = 1000n * 1000n * 1000n

module.exports = data => {
  const munged = munge(data)

  const unixMillisToAtomicPicosArray = unixMillis => {
    if (!Number.isInteger(unixMillis)) {
      throw Error(`Not an integer: ${unixMillis}`)
    }

    if (BigInt(unixMillis) < munged[0].blockStart_unixMillis) {
      throw Error(`Out of bounds: ${unixMillis}`)
    }

    const atomicPicosArray = []

    munged.forEach(({
      blockStart_atomicPicos,
      blockEnd_atomicPicos,
      ratio_atomicPicosPerUnixMilli,
      offsetAtUnixEpoch_atomicPicos
    }) => {
      // Depending on its parameters, each block linearly transforms `unixMillis`
      // into a different `atomicPicos`
      const atomicPicos = offsetAtUnixEpoch_atomicPicos + BigInt(unixMillis) * ratio_atomicPicosPerUnixMilli

      // Keep only the ones still falling in the block
      if (
        blockStart_atomicPicos <= atomicPicos &&
        atomicPicos < blockEnd_atomicPicos
      ) {
        atomicPicosArray.push(atomicPicos)
      }
    })

    return atomicPicosArray
  }

  const unixMillisToAtomicMillisArray = unixMillis => {
    return unixMillisToAtomicPicosArray(unixMillis).map(atomicPicos =>
      // When converting a TAI picosecond count to a TAI millisecond count it is
      // important that we always round towards negative infinity, so that we do
      // not accidentally return a TAI millisecond count from the next block up
      Number(div.roundNegativeInfinity(atomicPicos, picosPerMilli))
    )
  }

  const atomicMillisToUnixMillis = current_atomicMillis => {
    if (!Number.isInteger(current_atomicMillis)) {
      throw Error(`Not an integer: ${current_atomicMillis}`)
    }

    return atomicPicosToUnixMillis(BigInt(current_atomicMillis) * picosPerMilli)
  }

  const atomicPicosToUnixMillis = atomicPicos => {
    const block = munged.find(({
      blockStart_atomicPicos,
      blockEnd_atomicPicos
    }) =>
      blockStart_atomicPicos <= current_atomicPicos &&
      current_atomicPicos < blockEnd_atomicPicos
    )

    if (block === undefined) {
      throw Error(`Out of bounds: ${current_atomicMillis}`)
    }

    const {
      blockStart_unixMillis,
      blockStart_atomicPicos,
      ratio_atomicPicosPerUnixMilli
    } = block

    const blockElapsed_atomicPicos = current_atomicPicos - blockStart_atomicPicos

    // This division needs to round towards positive infinity
    const blockElapsed_unixMillis = div.roundPositiveInfinity(blockElapsed_atomicPicos, ratio_atomicPicosPerUnixMilli)

    return Number(blockStart_unixMillis + blockElapsed_unixMillis)
  }

  return {
    unixMillisToAtomicPicosArray,
    unixMillisToAtomicMillisArray,
    atomicMillisToUnixMillis
  }
}

const picosPerMilli = 1000n * 1000n * 1000n

module.exports = blocks => {
  if (!(0 in blocks)) {
    throw Error('No blocks')
  }

  const unixMillisToAtomicMillisArray = unixMillis => {
    if (!Number.isInteger(unixMillis)) {
      throw Error(`Not an integer: ${unixMillis}`)
    }

    if (BigInt(unixMillis) < blocks[0].blockStart.unixMillis) {
      // Pre-1961
      throw Error(`Out of bounds: ${unixMillis}`)
    }

    const atomicMillisArray = []

    blocks.forEach(({
      blockStart,
      blockEnd,
      ratio,
      offsetAtUnixEpoch
    }) => {
      // Depending on its parameters, each block linearly transforms `unixMillis`
      // into a different `atomicPicos`
      const atomicPicos = offsetAtUnixEpoch.atomicPicos + BigInt(unixMillis) * ratio.atomicPicosPerUnixMilli
      const atomicMillis = atomicPicos / picosPerMilli // rounds towards 0n

      // Keep only the ones still falling in the block
      if (
        blockStart.atomicMillis <= atomicMillis &&
        atomicMillis < blockEnd.atomicMillis
      ) {
        atomicMillisArray.push(Number(atomicMillis))
      }
    })

    return atomicMillisArray
  }

  const unixMillisToAtomicMillis = unixMillis => {
    const atomicMillisArray = unixMillisToAtomicMillisArray(unixMillis)
    const i = atomicMillisArray.length - 1
    if (!(i in atomicMillisArray)) {
      // Removed leap second; this Unix time never occurred
      throw Error(`No TAI equivalent: ${unixMillis}`)
    }

    return atomicMillisArray[i]
  }

  const atomicMillisToUnixMillis = atomicMillis => {
    if (!Number.isInteger(atomicMillis)) {
      throw Error(`Not an integer: ${atomicMillis}`)
    }

    if (BigInt(atomicMillis) < blocks[0].blockStart.atomicMillis) {
      // Pre-1961
      throw Error(`Out of bounds: ${atomicMillis}`)
    }

    const unixMillisArray = []

    blocks.forEach(({
      blockStart,
      blockEnd,
      ratio,
      offsetAtUnixEpoch
    }) => {
      // Depending on its parameters, each block linearly transforms `atomicPicos`
      // into a different `unixMillis`
      const atomicPicos = BigInt(atomicMillis) * picosPerMilli
      const unixMillis = (atomicPicos - offsetAtUnixEpoch.atomicPicos) /
        ratio.atomicPicosPerUnixMilli // Rounds towards 0n

      // Keep only the ones still falling in the block
      if (
        blockStart.unixMillis <= unixMillis &&
        unixMillis < blockEnd.unixMillis
      ) {
        unixMillisArray.push(Number(unixMillis))
      }
    })

    if (!(0 in unixMillisArray)) {
      throw Error(`Atomic time not found: ${atomicMillis}. This should be impossible`)
    }

    if (1 in unixMillisArray) {
      throw Error(`Ambiguous atomic time: ${atomicMillis}. This should be impossible`)
    }

    return Number(unixMillisArray[0])
  }

  const canonicalAtomicMillisToUnixMillis = atomicMillis => {
    const unixMillis = atomicMillisToUnixMillis(atomicMillis)

    // OK so a single Unix millisecond count can technically appear in multiple blocks
    // And if it does appear in multiple blocks, this means it has multiple atomic time preimages.
    // So we need to make sure we have the "canonical" (latest) atomic time preimage
    if (blocks.some(block =>
      block.blockStart.unixMillis <= unixMillis &&
      unixMillis < block.blockEnd.unixMillis &&
      !(
        block.blockStart.atomicMillis <= atomicMillis &&
        atomicMillis < block.blockEnd.atomicMillis
      )
    )) {
      throw Error(`No UTC equivalent: ${atomicMillis}`)
    }

    return unixMillis
  }

  return {
    oneToMany: {
      unixToAtomic: unixMillisToAtomicMillisArray,
      atomicToUnix: atomicMillisToUnixMillis
    },
    oneToOne: {
      unixToAtomic: unixMillisToAtomicMillis,
      atomicToUnix: canonicalAtomicMillisToUnixMillis
    }
  }
}

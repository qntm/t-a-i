// Several complex conditions in this code are intentionally left more complex than strictly
// necessary, in order to encourage testing

const picosPerMilli = 1000n * 1000n * 1000n

module.exports = blocks => {
  if (!(0 in blocks)) {
    throw Error('No blocks')
  }

  const unixMillisToBlocksWithAtomicPicos = unixMillis => {
    if (!Number.isInteger(unixMillis)) {
      throw Error(`Not an integer: ${unixMillis}`)
    }

    unixMillis = BigInt(unixMillis)

    return blocks
      .map(block => ({
        block,

        // Depending on its parameters, each block linearly transforms `unixMillis`
        // into a different `atomicPicos`. This value is always exact.
        atomicPicos: unixMillis * block.ratio.atomicPicosPerUnixMilli +
          block.offsetAtUnixEpoch.atomicPicos
      }))
      .filter(({ block, atomicPicos }) => {
        // Input has to be in range.
        if (atomicPicos < block.blockStart.atomicPicos) {
          return false
        }
        if (block.blockEnd.atomicPicos <= atomicPicos) {
          return false
        }
        return true
      })
  }

  const unixMillisToAtomicPicosArray = unixMillis =>
    unixMillisToBlocksWithAtomicPicos(unixMillis)
      .map(({ atomicPicos }) => atomicPicos)

  const unixMillisToAtomicMillisArray = unixMillis =>
    unixMillisToBlocksWithAtomicPicos(unixMillis)
      .map(({ block, atomicPicos }) => ({
        block,

        // This rounds towards 0n. This is potentially problematic because even if the atomic
        // picosecond count is part of this block, the rounded millisecond count may not be...
        atomicMillis: atomicPicos / picosPerMilli
      }))
      .filter(({ block, atomicMillis }) => {
        // ...hence this additional test
        if (atomicMillis * picosPerMilli < block.blockStart.atomicPicos) {
          return false
        }
        if (block.blockEnd.atomicPicos <= atomicMillis * picosPerMilli) {
          return false
        }
        return true
      })
      .map(({ atomicMillis }) => Number(atomicMillis))

  const unixMillisToCanonicalAtomicPicos = unixMillis => {
    const atomicPicosArray = unixMillisToAtomicPicosArray(unixMillis)
    const i = atomicPicosArray.length - 1
    if (!(i in atomicPicosArray)) {
      // Removed leap second; this Unix time never occurred
      throw Error(`No TAI equivalent: ${unixMillis}`)
    }
    return atomicPicosArray[i]
  }

  const unixMillisToCanonicalAtomicMillis = unixMillis => {
    const atomicMillisArray = unixMillisToAtomicMillisArray(unixMillis)
    const i = atomicMillisArray.length - 1
    if (!(i in atomicMillisArray)) {
      // Removed leap second; this Unix time never occurred
      throw Error(`No TAI equivalent: ${unixMillis}`)
    }
    return atomicMillisArray[i]
  }

  /// /////////////////////////////////////

  const atomicMillisToBlockWithUnixMillis = atomicMillis => {
    if (!Number.isInteger(atomicMillis)) {
      throw Error(`Not an integer: ${atomicMillis}`)
    }

    atomicMillis = BigInt(atomicMillis)

    const blockIndex = blocks.findIndex(block => {
      if (atomicMillis * picosPerMilli < block.blockStart.atomicPicos) {
        return false
      }
      if (block.blockEnd.atomicPicos <= atomicMillis * picosPerMilli) {
        return false
      }
      return true
    })

    if (blockIndex === -1) {
      // Pre-1961
      throw Error(`No UTC equivalent: ${atomicMillis}`)
    }

    const block = blocks[blockIndex]

    // This division rounds towards 0n.
    // Could that rounding theoretically take the result *outside* of the block?
    const unixMillis = (atomicMillis * picosPerMilli - block.offsetAtUnixEpoch.atomicPicos) /
      block.ratio.atomicPicosPerUnixMilli

    const atomicPicos2 = unixMillis * block.ratio.atomicPicosPerUnixMilli + block.offsetAtUnixEpoch.atomicPicos

    if (atomicPicos2 < block.blockStart.atomicPicos) {
      throw Error(`Atomic time not found: ${atomicMillis}. This should be impossible`)
    }

    if (block.blockEnd.atomicPicos <= atomicPicos2) {
      throw Error(`Atomic time not found: ${atomicMillis}. This should be impossible`)
    }

    return { block, unixMillis }
  }

  const atomicMillisToUnixMillis = atomicMillis => {
    const { unixMillis } = atomicMillisToBlockWithUnixMillis(atomicMillis)

    return Number(unixMillis)
  }

  const canonicalAtomicMillisToUnixMillis = atomicMillis => {
    const { block, unixMillis } = atomicMillisToBlockWithUnixMillis(atomicMillis)

    atomicMillis = BigInt(atomicMillis)

    if (block.overlapStart.atomicPicos <= atomicMillis * picosPerMilli) {
      // There is a later atomic time which converts to the same UTC time as this one
      // That means we are "non-canonical"
      throw Error(`No UTC equivalent: ${atomicMillis}`)
    }

    const atomicPicos2 = unixMillis * block.ratio.atomicPicosPerUnixMilli + block.offsetAtUnixEpoch.atomicPicos

    // The division and rounding could theoretically take us from an atomic time outside of the
    // overlap to a Unix time inside of it?
    if (block.overlapStart.atomicPicos <= atomicPicos2) {
      throw Error(`Atomic time not found: ${atomicMillis}. This should be impossible`)
    }

    return Number(unixMillis)
  }

  return {
    oneToMany: {
      unixToAtomicPicos: unixMillisToAtomicPicosArray,
      unixToAtomic: unixMillisToAtomicMillisArray,
      atomicToUnix: atomicMillisToUnixMillis
    },
    oneToOne: {
      unixToAtomicPicos: unixMillisToCanonicalAtomicPicos,
      unixToAtomic: unixMillisToCanonicalAtomicMillis,
      atomicToUnix: canonicalAtomicMillisToUnixMillis
    }
  }
}

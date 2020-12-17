const picosPerMilli = 1000n * 1000n * 1000n

module.exports = blocks => {
  if (!(0 in blocks)) {
    throw Error('No blocks')
  }

  const unixMillisToBlocksWithAtomicPicos = unixMillis => {
    if (!Number.isInteger(unixMillis)) {
      throw Error(`Not an integer: ${unixMillis}`)
    }

    if (unixMillis < blocks[0].blockStart.unixMillis) {
      // Pre-1961
      throw Error(`Out of bounds: ${unixMillis}`)
    }

    return blocks
      .filter(block =>
        // Input has to be in range
        block.blockStart.unixMillis <= unixMillis &&
        unixMillis < block.blockEnd.unixMillis
      )
      .map(block => ({
        block,
        // Depending on its parameters, each block linearly transforms `unixMillis`
        // into a different `atomicPicos`. This value is always exact.
        atomicPicos: BigInt(unixMillis) * block.ratio.atomicPicosPerUnixMilli + block.offsetAtUnixEpoch.atomicPicos
      }))
      .filter(({ block, atomicPicos }) =>
        // This filter should never catch anything really
        block.blockStart.atomicPicos <= atomicPicos &&
        atomicPicos < block.blockEnd.atomicPicos
      )
  }

  const unixMillisToAtomicPicosArray = unixMillis =>
    unixMillisToBlocksWithAtomicPicos(unixMillis)
      .map(({ atomicPicos }) => atomicPicos)

  const unixMillisToAtomicMillisArray = unixMillis =>
    unixMillisToBlocksWithAtomicPicos(unixMillis)
      .map(({ block, atomicPicos }) => ({
        block,

        // This rounds towards 0n. This is potentially problematic because even if the atomic
        // picosecond count is part of this block, the rounded millisecond count may not...
        atomicMillis: atomicPicos / picosPerMilli
      }))
      .filter(({ block, atomicMillis }) =>
        // ...hence this additional test
        block.blockStart.atomicMillis <= atomicMillis &&
        atomicMillis < block.blockEnd.atomicMillis
      )
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

    if (atomicMillis < blocks[0].blockStart.atomicMillis) {
      // Pre-1961
      throw Error(`Out of bounds: ${atomicMillis}`)
    }

    const block = blocks.find(block =>
      block.blockStart.atomicMillis <= atomicMillis &&
      atomicMillis < block.blockEnd.atomicMillis
    )

    // This division rounds towards 0n.
    // That rounding can theoretically take the result *outside* of the block.
    const unixMillis = (BigInt(atomicMillis) * picosPerMilli - block.offsetAtUnixEpoch.atomicPicos) /
      block.ratio.atomicPicosPerUnixMilli

    if (
      unixMillis < block.blockStart.unixMillis ||
      block.blockEnd.unixMillis <= unixMillis
    ) {
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

    if (block.overlapStart.atomicMillis <= atomicMillis) {
      // There is a later atomic time which converts to the same UTC time as this one
      // That means we are "non-canonical"
      throw Error(`No UTC equivalent: ${atomicMillis}`)
    }

    // The division and rounding could theoretically take us from an atomic time outside of the
    // overlap to a Unix time inside of it?
    if (block.overlapStart.unixMillis <= unixMillis) {
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

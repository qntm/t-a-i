// Several complex conditions in this code are intentionally left more complex than strictly
// necessary, in order to force more exhaustive testing

const div = require('./div')
const munge = require('./munge')

const picosPerMilli = 1000n * 1000n * 1000n

module.exports = data => {
  const blocks = munge(data)

  const atomicPicosInBlock = (atomicPicos, blockId) => {
    // ...however, the result has to still be in the block!
    if (atomicPicos < blocks[blockId].start.atomicPicos) {
      // Falls before this block began, whoops
      return false
    }
    if (blockId + 1 in blocks && blocks[blockId + 1].start.atomicPicos <= atomicPicos) {
      // Result falls in next block, whoops
      return false
    }
    return true
  }

  const unixMillisToBlocksWithAtomicPicos = unixMillis => {
    if (!Number.isInteger(unixMillis)) {
      throw Error(`Not an integer: ${unixMillis}`)
    }

    return blocks
      .map((block, blockId) => ({
        blockId,

        // Depending on its parameters, each block linearly transforms `unixMillis`
        // into a different `atomicPicos`. This value is always exact...
        atomicPicos: BigInt(unixMillis) * block.ratio.atomicPicosPerUnixMilli +
          block.offsetAtUnixEpoch.atomicPicos
      }))
      .filter(({ blockId, atomicPicos }) =>
        // ...however, the result has to still be in the block!
        atomicPicosInBlock(atomicPicos, blockId)
      )
  }

  const unixMillisToAtomicPicosArray = unixMillis =>
    unixMillisToBlocksWithAtomicPicos(unixMillis)
      .map(({ atomicPicos }) => atomicPicos)

  const unixMillisToAtomicMillisArray = unixMillis =>
    unixMillisToBlocksWithAtomicPicos(unixMillis)
      .map(({ blockId, atomicPicos }) => ({
        blockId,

        // This rounds towards negative infinity. This is potentially problematic because even if
        // the atomic picosecond count is part of this block, the rounded millisecond count may not
        // be...
        atomicMillis: Number(div(atomicPicos, picosPerMilli))
      }))
      .filter(({ blockId, atomicMillis }) =>
        // ...hence this additional test
        atomicPicosInBlock(BigInt(atomicMillis) * picosPerMilli, blockId)
      )
      .map(({ atomicMillis }) => atomicMillis)

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

  const atomicMillisToUnixMillisWithOverlap = atomicMillis => {
    if (!Number.isInteger(atomicMillis)) {
      throw Error(`Not an integer: ${atomicMillis}`)
    }

    const atomicPicos = BigInt(atomicMillis) * picosPerMilli

    const blockIndex = blocks.findIndex((block, blockId) =>
      atomicPicosInBlock(atomicPicos, blockId)
    )

    if (blockIndex === -1) {
      // Pre-1961
      throw Error(`No UTC equivalent: ${atomicMillis}`)
    }

    const block = blocks[blockIndex]

    const unixMillis = Number(div(
      atomicPicos - block.offsetAtUnixEpoch.atomicPicos,
      block.ratio.atomicPicosPerUnixMilli
    ))

    // There is no need to separately check that `unixMillis` is still in the block. Although some
    // rounding may have occurred, rounding was towards negative infinity - there's no chance we
    // left the block by accident.

    // This can be before, exactly at, or after `end`. Before is the case we care about most.
    const overlapStart = {}
    overlapStart.atomicPicos = blockIndex + 1 in blocks
      ? BigInt(blocks[blockIndex + 1].start.unixMillis) * block.ratio.atomicPicosPerUnixMilli +
        block.offsetAtUnixEpoch.atomicPicos
      : Infinity

    const overlapsNextBlock = overlapStart.atomicPicos <= BigInt(atomicMillis) * picosPerMilli

    return { unixMillis, overlapsNextBlock }
  }

  const atomicMillisToUnixMillis = atomicMillis =>
    atomicMillisToUnixMillisWithOverlap(atomicMillis).unixMillis

  const canonicalAtomicMillisToUnixMillis = atomicMillis => {
    const { unixMillis, overlapsNextBlock } = atomicMillisToUnixMillisWithOverlap(atomicMillis)

    if (overlapsNextBlock) {
      // There is a later atomic time which converts to the same UTC time as this one
      // That means we are "non-canonical"
      throw Error(`No UTC equivalent: ${atomicMillis}`)
    }

    // There is no need to separately check that `unixMillis` is still in the non-overlap section
    // of the block, for the same reason we don't need to check that it's in the block at all.

    return unixMillis
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

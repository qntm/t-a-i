// Several complex conditions in this code are intentionally left more complex than strictly
// necessary, in order to force more exhaustive testing

const div = require('./div')
const munge = require('./munge')

const picosPerMilli = 1000n * 1000n * 1000n

module.exports = data => {
  const blocks = munge(data)

  if (!(0 in blocks)) {
    throw Error('No blocks')
  }

  const unixMillisToBlocksWithAtomicPicos = unixMillis => {
    if (!Number.isInteger(unixMillis)) {
      throw Error(`Not an integer: ${unixMillis}`)
    }

    return blocks
      .map(block => ({
        block,

        // Depending on its parameters, each block linearly transforms `unixMillis`
        // into a different `atomicPicos`. This value is always exact...
        atomicPicos: BigInt(unixMillis) * block.ratio.atomicPicosPerUnixMilli +
          block.offsetAtUnixEpoch.atomicPicos
      }))
      .filter(({ block, atomicPicos }) => {
        // ...however, the result has to still be in the block!
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

        // This rounds towards negative infinity. This is potentially problematic because even if
        // the atomic picosecond count is part of this block, the rounded millisecond count may not
        // be...
        atomicMillis: div(atomicPicos, picosPerMilli)
      }))
      .filter(({ block, atomicMillis }) => {
        // ...hence this additional test
        const atomicPicosRounded = atomicMillis * picosPerMilli
        if (atomicPicosRounded < block.blockStart.atomicPicos) {
          return false
        }

        // This case is impossible. We round towards negative infinity, we cannot round up, past the
        // end of the block
        /* istanbul ignore next */
        if (block.blockEnd.atomicPicos <= atomicPicosRounded) {
          throw Error(`Atomic time rounded up past end of block. This should be impossible`)
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

    const atomicPicos = BigInt(atomicMillis) * picosPerMilli
    // TODO: how about rounding `atomicPicos` to the nearest Unix millisecond here instead?
    // What if more than one block matches??

    const blockIndex = blocks.findIndex(block => {
      if (atomicPicos < block.blockStart.atomicPicos) {
        return false
      }
      if (block.blockEnd.atomicPicos <= atomicPicos) {
        return false
      }
      return true
    })

    if (blockIndex === -1) {
      // Pre-1961
      throw Error(`No UTC equivalent: ${atomicMillis}`)
    }

    const block = blocks[blockIndex]

    // This division rounds towards negative infinity.
    // Could rounding theoretically take the result *outside* of the block?
    const unixMillis = div(
      atomicPicos - block.offsetAtUnixEpoch.atomicPicos,
      block.ratio.atomicPicosPerUnixMilli
    )

    const atomicPicos2 = unixMillis * block.ratio.atomicPicosPerUnixMilli +
      block.offsetAtUnixEpoch.atomicPicos

    // This case is impossible. Because the block start is always a whole number of Unix
    // milliseconds, this would mean the precise result of `unixMillis` was *less* than this and
    // rounded down, which means `atomicPicos` also would have to be before the start of the block,
    // which we already tested for
    /* istanbul ignore next */
    if (atomicPicos2 < block.blockStart.atomicPicos) {
      throw Error(`Atomic time not found: ${atomicMillis}. This should be impossible`)
    }

    // This is also impossible. `atomicPicos2` cannot be greater than `atomicPicos`, which is in
    // the block.
    /* istanbul ignore next */
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

    if (block.overlapStart.atomicPicos <= BigInt(atomicMillis) * picosPerMilli) {
      // There is a later atomic time which converts to the same UTC time as this one
      // That means we are "non-canonical"
      throw Error(`No UTC equivalent: ${atomicMillis}`)
    }

    const atomicPicos2 = unixMillis * block.ratio.atomicPicosPerUnixMilli +
      block.offsetAtUnixEpoch.atomicPicos

    // This should be impossible, `atomicPicos2` is less than or equal to `atomicPicos`
    /* istanbul ignore next */
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

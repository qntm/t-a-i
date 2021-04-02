// The way to think about this is a 2D graph with TAI on the X axis, UTC on the Y, and a collection
// of numbered *rays*. Each ray starts at a well defined position in both TAI and UTC and proceeds
// diagonally up and to the right, expressing *one* relationship between the two.
// Typically each new ray is either (1) the previous ray translated up or down a little or (2) a
// discrete change in direction/slope of the previous ray with no discontinuity.
// A ray becomes invalid once we reach the TAI start point of the next (numerical) ray. So, every
// TAI time (vertical line) intersects exactly one ray, and maps to exactly 1 UTC time, unless it
// precedes the beginning of TAI.
// A UTC time (horizontal line) can intersect 0, 1, 2 or theoretically many more rays, and hence map
// to multiple TAI times. We can return an array of these, or just the result from the latest ray
// (according to its numbering).
// The logic below should work even if these rays proceed horizontally, or UTC runs backwards, or if
// the rays are supplied in the wrong order or if the period of validity of a ray is 0.

const div = require('./div')
const munge = require('./munge')

const picosPerMilli = 1000n * 1000n * 1000n

module.exports = data => {
  const blocks = munge(data)

  /// Helper methods

  const atomicPicosInBlock = (block, atomicPicos) =>
    block.start.atomicPicos <= atomicPicos && atomicPicos < block.end.atomicPicos

  // Depending on its parameters, each block linearly transforms `unixMillis`
  // into a different `atomicPicos`. This value is always exact
  const unixMillisToAtomicPicos = (block, unixMillis) =>
    BigInt(unixMillis) * block.ratio.atomicPicosPerUnixMilli +
      block.offsetAtUnixEpoch.atomicPicos

  // This result is rounded towards negative infinity. This means that, provided that `atomicPicos`
  // is in the block, `unixMillis` is also guaranteed to be in the block.
  const atomicPicosToUnixMillis = (block, atomicPicos) =>
    Number(div(
      atomicPicos - block.offsetAtUnixEpoch.atomicPicos,
      block.ratio.atomicPicosPerUnixMilli
    ))

  /// Unix to TAI conversion methods

  const unixMillisToBlocksWithAtomicPicos = unixMillis => {
    if (!Number.isInteger(unixMillis)) {
      throw Error(`Not an integer: ${unixMillis}`)
    }

    return blocks
      .map(block => ({
        block,
        atomicPicos: unixMillisToAtomicPicos(block, unixMillis)
      }))
      .filter(({ block, atomicPicos }) =>
        // ...however, the result has to still be in the block!
        atomicPicosInBlock(block, atomicPicos)
      )
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
        atomicMillis: Number(div(atomicPicos, picosPerMilli))
      }))
      .filter(({ block, atomicMillis }) =>
        // ...hence this additional test
        atomicPicosInBlock(block, BigInt(atomicMillis) * picosPerMilli)
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

  /// TAI to Unix conversion methods

  const atomicMillisToUnixMillis = (atomicMillis, overrun) => {
    if (!Number.isInteger(atomicMillis)) {
      throw Error(`Not an integer: ${atomicMillis}`)
    }

    const atomicPicos = BigInt(atomicMillis) * picosPerMilli

    const blockId = blocks.findIndex(block =>
      atomicPicosInBlock(block, atomicPicos)
    )

    if (blockId === -1) {
      // Pre-1961
      throw Error(`No UTC equivalent: ${atomicMillis}`)
    }

    const unixMillis = atomicPicosToUnixMillis(blocks[blockId], atomicPicos)

    if (overrun) {
      return unixMillis
    }

    // If a later block starts at a Unix time before this one, apply stalling behaviour
    return Math.min(
      unixMillis,
      ...blocks.slice(blockId + 1).map(block => block.start.unixMillis)
    )
  }

  const atomicMillisToUnixMillisOverrun = atomicMillis =>
    atomicMillisToUnixMillis(atomicMillis, true)

  const atomicMillisToUnixMillisStall = atomicMillis =>
    atomicMillisToUnixMillis(atomicMillis, false)

  return {
    oneToMany: {
      unixToAtomicPicos: unixMillisToAtomicPicosArray,
      unixToAtomic: unixMillisToAtomicMillisArray,
      atomicToUnix: atomicMillisToUnixMillisOverrun
    },
    oneToOne: {
      unixToAtomicPicos: unixMillisToCanonicalAtomicPicos,
      unixToAtomic: unixMillisToCanonicalAtomicMillis,
      atomicToUnix: atomicMillisToUnixMillisStall
    }
  }
}

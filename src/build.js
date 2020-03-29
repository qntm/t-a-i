/**
  Set the parameters of your very own spinning Earth and compare it with
  reality! (This provides DI for testing against simpler structures of leap
  seconds.)
*/

'use strict'

const generateBlocks = require('./generate-blocks')

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

const unixToAtomic = (unix, offset, driftRate) => {
  // Ordinarily we would multiply `unix` by `1 + driftRate`
  // but this number is very close to 1 so we could lose precision (maybe??)
  unix += unix * driftRate
  unix += offset
  return unix
}

/**
  Build and return an atomic time converter.
  `leapSeconds`: An array of pairs {atomic, offset}.
  `atomic` is the atomic time when the offset changed; the offset in milliseconds
  indicates the new offset (TAI minus Unix) as of this atomic time.
*/
module.exports = leapSeconds => {
  const blocks = generateBlocks(leapSeconds)

  // Compute the "beginning" of atomic time. We need this so we can check it
  const earliestAtomic = Math.min.apply(Math, blocks.map(block => block.atomicStart))
  const earliestUnix = Math.min.apply(Math, blocks.map(block => block.unixStart))

  const atomicTooEarly = atomic => atomic < earliestAtomic
  const unixTooEarly = unix => unix < earliestUnix

  // One-to-many APIs

  /**
    Convert this Unix time to an array of atomic times. Ordinarily
    this will return a single-element array, but if the Unix time
    falls during an inserted leap second, then there will be two
    elements in the array. A removed leap second? No elements.
  */
  const oneToManyUnixToAtomic = unix => {
    if (unixTooEarly(unix)) {
      throw new Error('This Unix time falls before atomic time was defined.')
    }
    return blocks
      .filter(block => block.unixStart <= unix && unix < block.unixEnd)
      .map(block => unixToAtomic(unix, block.offset, block.driftRate))
  }

  /**
    Convert this atomic time object to a Unix time.
    If it falls during a removed leap second, return the second,
    "canonical" Unix time (since the earlier one never happened).
    `oneToMany.atomicToUnix(oneToMany.unixToAtomic(x))` returns `x`.
    If the "atomic time" falls too early, throw an exception.
  */
  const oneToManyAtomicToUnix = atomic => {
    if (atomicTooEarly(atomic)) {
      throw new Error('This atomic time is not defined.')
    }
    const results = blocks
      .filter(block => block.atomicStart <= atomic && atomic < block.atomicEnd)
      .map(block => atomicToUnix(atomic, block.offset, block.undriftRate))
    if (results.length === 0) {
      throw new Error('This atomic time was not found. This should be impossible.')
    }
    if (results.length > 1) {
      throw new Error('This atomic time is ambiguous. This should be impossible.')
    }
    return results[0]
  }

  // One-to-one APIs

  /**
    Same as `oneToManyUnixToAtomic` but select a canonical result.
    If the Unix time doesn't exist (due to being clobbered during a
    removed leap second), throws an exception.
  */
  const oneToOneUnixToAtomic = unix => {
    const many = oneToManyUnixToAtomic(unix)
    if (many.length === 0) {
      throw new Error('This Unix time never happened; it falls during a removed leap second.')
    }
    return many[many.length - 1]
  }

  /**
    Same as `oneToManyAtomicToUnix` but if the target Unix time is the
    first of a repeated Unix time due to an inserted leap
    second, throws an exception.
  */
  const oneToOneAtomicToUnix = atomic => {
    const unix = oneToManyAtomicToUnix(atomic)
    if (oneToOneUnixToAtomic(unix) !== atomic) {
      throw new Error('This atomic time cannot be represented in Unix time; it falls during an inserted leap second.')
    }
    return unix
  }

  return {
    atomicTooEarly: atomicTooEarly,
    unixTooEarly: unixTooEarly,
    unixToAtomic: oneToOneUnixToAtomic,
    atomicToUnix: oneToManyAtomicToUnix,
    convert: {
      oneToMany: {
        unixToAtomic: oneToManyUnixToAtomic,
        atomicToUnix: oneToManyAtomicToUnix
      },
      oneToOne: {
        unixToAtomic: oneToOneUnixToAtomic,
        atomicToUnix: oneToOneAtomicToUnix
      }
    }
  }
}

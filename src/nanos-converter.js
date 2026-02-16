import { Rat } from './rat.js'
import { Second } from './second.js'
import { Converter } from './converter.js'

const unwrap = nanos => {
  const isInteger = Number.isInteger(nanos)

  if (isInteger) {
    nanos = BigInt(nanos)
  }

  if (typeof nanos !== 'bigint') {
    throw Error(`Not an integer: ${nanos}`)
  }

  const second = Second.fromNanos(nanos)

  return { isInteger, second }
}

const wrap = ({ isInteger, second }) => {
  if (Number.isNaN(second)) {
    return second
  }

  let nanos = second.toNanos()

  if (isInteger) {
    nanos = Number(nanos)
  }

  return nanos
}

// Do not subclass `Converter` as we do not expose the same interface
export class NanosConverter {
  constructor (data, model) {
    this.converter = new Converter(data, model)
  }

  atomicToUnix (atomicNanos) {
    const { isInteger, second: atomic } = unwrap(atomicNanos)
    const unix = this.converter.atomicToUnix(atomic)
    return wrap({ isInteger, second: unix })
  }

  atomicToOffset (atomicNanos) {
    const { isInteger, second: atomic } = unwrap(atomicNanos)
    const unix = this.converter.atomicToOffset(atomic)
    return wrap({ isInteger, second: unix })
  }

  atomicToDriftRate (atomicNanos) {
    const { isInteger, second: atomic } = unwrap(atomicNanos)
    const atomicPerUnix = this.converter.atomicToDriftRate(atomic)

    if (Number.isNaN(atomicPerUnix) || atomicPerUnix === Infinity) {
      return atomicPerUnix
    }

    let atomicNanosPerUnixDay = atomicPerUnix.times(new Rat(86_400_000_000_000n)).trunc()

    if (isInteger) {
      atomicNanosPerUnixDay = Number(atomicNanosPerUnixDay)
    }

    return atomicNanosPerUnixDay
  }

  unixToAtomic (unixNanos, options = {}) {
    const { isInteger, second: unix } = unwrap(unixNanos)
    const ranges = this.converter.unixToAtomic(unix)
      .map(range => [
        wrap({ isInteger, second: range.start }),
        wrap({ isInteger, second: range.end })
      ])

    if (options.array === true) {
      return options.range === true ? ranges : ranges.map(range => range[1])
    }

    const i = ranges.length - 1
    const lastRange = i in ranges ? ranges[i] : [NaN, NaN]
    return options.range === true ? lastRange : lastRange[1]
  }
}

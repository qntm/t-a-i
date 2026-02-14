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

  nanos = Second.fromNanos(nanos)

  return { isInteger, nanos }
}

const wrap = ({ isInteger, nanos }) => {
  if (Number.isNaN(nanos)) {
    return nanos
  }

  nanos = nanos.toNanos()

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
    const { isInteger, nanos: atomic } = unwrap(atomicNanos)
    const unix = this.converter.atomicToUnix(atomic)
    return wrap({ isInteger, nanos: unix })
  }

  atomicToOffset (atomicNanos) {
    const { isInteger, nanos: atomic } = unwrap(atomicNanos)
    const unix = this.converter.atomicToOffset(atomic)
    return wrap({ isInteger, nanos: unix })
  }

  unixToAtomic (unixNanos, options = {}) {
    const { isInteger, nanos: unix } = unwrap(unixNanos)
    const ranges = this.converter.unixToAtomic(unix)
      .map(range => [
        wrap({ isInteger, nanos: range.start }),
        wrap({ isInteger, nanos: range.end })
      ])

    if (options.array === true) {
      return options.range === true ? ranges : ranges.map(range => range[1])
    }

    const i = ranges.length - 1
    const lastRange = i in ranges ? ranges[i] : [NaN, NaN]
    return options.range === true ? lastRange : lastRange[1]
  }
}

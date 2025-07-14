import { Second } from './second.js'
import { Converter } from './converter.js'

// Do not subclass `Converter` as we do not expose the same interface
export class NanosConverter {
  constructor (data, model) {
    this.converter = new Converter(data, model)
  }

  atomicToUnix (atomicNanos) {
    const isInteger = Number.isInteger(atomicNanos)

    if (isInteger) {
      atomicNanos = BigInt(atomicNanos)
    }

    if (typeof atomicNanos !== 'bigint') {
      throw Error(`Not an integer: ${atomicNanos}`)
    }

    let unix = this.converter.atomicToUnix(Second.fromNanos(atomicNanos))
    if (Number.isNaN(unix)) {
      return unix
    }

    unix = unix.toNanos()

    if (isInteger) {
      unix = Number(unix)
    }

    return unix
  }

  unixToAtomic (unixNanos, options = {}) {
    const isInteger = Number.isInteger(unixNanos)

    if (isInteger) {
      unixNanos = BigInt(unixNanos)
    }

    if (typeof unixNanos !== 'bigint') {
      throw Error(`Not an integer: ${unixNanos}`)
    }

    let ranges = this.converter.unixToAtomic(Second.fromNanos(unixNanos))
    ranges = ranges.map(range => [
      range.start.toNanos(),
      range.end.toNanos()
    ])

    if (isInteger) {
      ranges = ranges.map(range => [
        Number(range[0]),
        Number(range[1])
      ])
    }

    if (options.array === true) {
      return options.range === true ? ranges : ranges.map(range => range[1])
    }

    const i = ranges.length - 1
    const lastRange = i in ranges ? ranges[i] : [NaN, NaN]
    return options.range === true ? lastRange : lastRange[1]
  }
}

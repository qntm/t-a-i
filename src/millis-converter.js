import { Second } from './second.js'
import { Converter } from './converter.js'

// Do not subclass `Converter` as we do not expose the same interface
export class MillisConverter {
  constructor (data, model) {
    this.converter = new Converter(data, model)
  }

  atomicToUnix (atomicMillis) {
    const isInteger = Number.isInteger(atomicMillis)

    if (isInteger) {
      atomicMillis = BigInt(atomicMillis)
    }

    if (typeof atomicMillis !== 'bigint') {
      throw Error(`Not an integer: ${atomicMillis}`)
    }

    let unix = this.converter.atomicToUnix(Second.fromMillis(atomicMillis))
    if (Number.isNaN(unix)) {
      return unix
    }

    unix = unix.toMillis()

    if (isInteger) {
      unix = Number(unix)
    }

    return unix
  }

  unixToAtomic (unixMillis, options = {}) {
    const isInteger = Number.isInteger(unixMillis)

    if (isInteger) {
      unixMillis = BigInt(unixMillis)
    }

    if (typeof unixMillis !== 'bigint') {
      throw Error(`Not an integer: ${unixMillis}`)
    }

    let ranges = this.converter.unixToAtomic(Second.fromMillis(unixMillis))
    ranges = ranges.map(range => [
      range.start.toMillis(),
      range.end.toMillis()
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

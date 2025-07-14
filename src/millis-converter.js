import { Second } from './second.js'
import { Converter } from './converter.js'

// Do not subclass `Converter` as we do not expose the same interface
export class MillisConverter {
  constructor (data, model) {
    this.converter = new Converter(data, model)
  }

  atomicToUnix (atomicMillis) {
    if (!Number.isInteger(atomicMillis)) {
      throw Error(`Not an integer: ${atomicMillis}`)
    }

    const unix = this.converter.atomicToUnix(Second.fromMillis(BigInt(atomicMillis)))
    return Number.isNaN(unix)
      ? unix
      : unix.toMillis()
  }

  unixToAtomic (unixMillis, options = {}) {
    if (!Number.isInteger(unixMillis)) {
      throw Error(`Not an integer: ${unixMillis}`)
    }

    const ranges = this.converter.unixToAtomic(Second.fromMillis(BigInt(unixMillis)))
      .map(range => [
        range.start.toMillis(),
        range.end.toMillis()
      ])

    if (options.array === true) {
      return options.range === true ? ranges : ranges.map(range => range[1])
    }

    const i = ranges.length - 1
    const lastRange = i in ranges ? ranges[i] : [NaN, NaN]
    return options.range === true ? lastRange : lastRange[1]
  }
}

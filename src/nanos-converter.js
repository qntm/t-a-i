import { Second } from './second.js'
import { Converter } from './converter.js'

// Do not subclass `Converter` as we do not expose the same interface
export class NanosConverter {
  constructor (data, model) {
    this.converter = new Converter(data, model)
  }

  atomicToUnix (atomicNanos) {
    const unix = this.converter.atomicToUnix(Second.fromNanos(atomicNanos))
    return Number.isNaN(unix)
      ? unix
      : unix.toNanos()
  }

  unixToAtomic (unixNanos, options = {}) {
    const ranges = this.converter.unixToAtomic(Second.fromNanos(unixNanos))
      .map(range => [
        range.start.toNanos(),
        range.end.toNanos()
      ])

    if (options.array === true) {
      return options.range === true ? ranges : ranges.map(range => range[1])
    }

    const i = ranges.length - 1
    const lastRange = i in ranges ? ranges[i] : [NaN, NaN]
    return options.range === true ? lastRange : lastRange[1]
  }
}

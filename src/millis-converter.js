const { Second } = require('./second.js')
const { Converter } = require('./converter.js')

// Do not subclass `Converter` as we do not expose the same interface
module.exports.MillisConverter = class {
  constructor (data, model) {
    this.converter = new Converter(data, model)
  }

  atomicToUnix (atomicMillis) {
    const unix = this.converter.atomicToUnix(Second.fromMillis(atomicMillis))
    return Number.isNaN(unix)
      ? unix
      : unix.toMillis()
  }

  unixToAtomic (unixMillis, options = {}) {
    const ranges = this.converter.unixToAtomic(Second.fromMillis(unixMillis))
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

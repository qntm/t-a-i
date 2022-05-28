const { Rat } = require('./rat.js')

module.exports.Converter = exactConverter => ({
  atomicToUnix: atomicMillis => {
    const unix = exactConverter.atomicToUnix(Rat.fromMillis(atomicMillis))
    return Number.isNaN(unix)
      ? unix
      : unix.toMillis()
  },

  unixToAtomic: (unixMillis, options = {}) => {
    const ranges = exactConverter.unixToAtomic(Rat.fromMillis(unixMillis))
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
})

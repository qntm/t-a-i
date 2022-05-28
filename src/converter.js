const { Rat } = require('./rat.js')
const { ExactConverter } = require('./exact-converter.js')

const Converter = (data, model) => {
  const exactConverter = ExactConverter(data, model)

  const atomicToUnix = atomicMillis => {
    const unix = exactConverter.atomicToUnix(Rat.fromMillis(atomicMillis))
    return Number.isNaN(unix)
      ? unix
      : unix.toMillis()
  }

  const unixToAtomic = (unixMillis, options = {}) => {
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

  return {
    atomicToUnix,
    unixToAtomic
  }
}

module.exports.Converter = Converter

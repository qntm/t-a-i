import { Second } from './second.js'
import { Converter } from './converter.js'

const unwrap = millis => {
  const isInteger = Number.isInteger(millis)

  if (isInteger) {
    millis = BigInt(millis)
  }

  if (typeof millis !== 'bigint') {
    throw Error(`Not an integer: ${millis}`)
  }

  millis = Second.fromMillis(millis)

  return { isInteger, millis }
}

const wrap = ({ isInteger, millis }) => {
  if (Number.isNaN(millis)) {
    return millis
  }

  millis = millis.toMillis()

  if (isInteger) {
    millis = Number(millis)
  }

  return millis
}

// Do not subclass `Converter` as we do not expose the same interface
export class MillisConverter {
  constructor (data, model) {
    this.converter = new Converter(data, model)
  }

  atomicToUnix (atomicMillis) {
    const { isInteger, millis: atomic } = unwrap(atomicMillis)
    const unix = this.converter.atomicToUnix(atomic)
    return wrap({ isInteger, millis: unix })
  }

  atomicToOffset (atomicMillis) {
    const { isInteger, millis: atomic } = unwrap(atomicMillis)
    const unix = this.converter.atomicToOffset(atomic)
    return wrap({ isInteger, millis: unix })
  }

  unixToAtomic (unixMillis, options = {}) {
    const { isInteger, millis: unix } = unwrap(unixMillis)

    const ranges = this.converter.unixToAtomic(unix)
      .map(range => [
        wrap({ isInteger, millis: range.start }),
        wrap({ isInteger, millis: range.end })
      ])

    if (options.array === true) {
      return options.range === true ? ranges : ranges.map(range => range[1])
    }

    const i = ranges.length - 1
    const lastRange = i in ranges ? ranges[i] : [NaN, NaN]
    return options.range === true ? lastRange : lastRange[1]
  }
}

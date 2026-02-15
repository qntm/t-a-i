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

  const second = Second.fromMillis(millis)

  return { isInteger, second }
}

const wrap = ({ isInteger, second }) => {
  if (Number.isNaN(second)) {
    return second
  }

  let millis = second.toMillis()

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
    const { isInteger, second: atomic } = unwrap(atomicMillis)
    const unix = this.converter.atomicToUnix(atomic)
    return wrap({ isInteger, second: unix })
  }

  atomicToOffset (atomicMillis) {
    const { isInteger, second: atomic } = unwrap(atomicMillis)
    const unix = this.converter.atomicToOffset(atomic)
    return wrap({ isInteger, second: unix })
  }

  unixToAtomic (unixMillis, options = {}) {
    const { isInteger, second: unix } = unwrap(unixMillis)

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

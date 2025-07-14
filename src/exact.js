import { taiData, UNIX_START_MILLIS, UNIX_END_MILLIS } from './tai-data.js'
import { Converter } from './converter.js'
import { Second } from './second.js'

export { MODELS } from './munge.js'
export { Second }

export const UNIX_START = Second.fromMillis(BigInt(UNIX_START_MILLIS))
export const UNIX_END = Second.fromMillis(BigInt(UNIX_END_MILLIS))
export const TaiConverter = model => new Converter(taiData, model)

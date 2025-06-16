import { taiData, UNIX_START_MILLIS, UNIX_END_MILLIS } from './tai-data.js'
import { NanosConverter } from './nanos-converter.js'
import { Second } from './second.js'

export { MODELS } from './munge.js'

export const UNIX_START = Second.fromMillis(UNIX_START_MILLIS).toNanos()
export const UNIX_END = Second.fromMillis(UNIX_END_MILLIS).toNanos()
export const TaiConverter = model => new NanosConverter(taiData, model)

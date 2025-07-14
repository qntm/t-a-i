import { taiData, UNIX_START_MILLIS, UNIX_END_MILLIS } from './tai-data.js'
import { NanosConverter } from './nanos-converter.js'
import { Second } from './second.js'

export { MODELS } from './munge.js'

// TODO: need to expose BigInts for these as they are inaccurate.
// Or are they? CHECK.
export const UNIX_START = Number(Second.fromMillis(BigInt(UNIX_START_MILLIS)).toNanos())
export const UNIX_END = Number(Second.fromMillis(BigInt(UNIX_END_MILLIS)).toNanos())
export const TaiConverter = model => new NanosConverter(taiData, model)

import { taiData, UNIX_START_MILLIS, UNIX_END_MILLIS } from './tai-data.js'
import { MillisConverter } from './millis-converter.js'

export { MODELS } from './munge.js'

export const UNIX_START = UNIX_START_MILLIS
export const UNIX_END = UNIX_END_MILLIS
export const TaiConverter = model => new MillisConverter(taiData, model)

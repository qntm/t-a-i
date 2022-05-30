const { taiData, UNIX_START_MILLIS, UNIX_END_MILLIS } = require('./tai-data.js')
const { MODELS } = require('./munge.js')
const { MillisConverter } = require('./millis-converter.js')

module.exports.UNIX_START = UNIX_START_MILLIS
module.exports.UNIX_END = UNIX_END_MILLIS
module.exports.MODELS = MODELS
module.exports.TaiConverter = model => new MillisConverter(taiData, model)

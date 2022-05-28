const { taiData, UNIX_START, UNIX_END } = require('./tai-data.js')
const { MODELS } = require('./munge.js')
const { MillisConverter } = require('./millis-converter.js')

module.exports.UNIX_START = UNIX_START.toMillis()
module.exports.UNIX_END = UNIX_END.toMillis()
module.exports.MODELS = MODELS
module.exports.TaiConverter = model => new MillisConverter(taiData, model)

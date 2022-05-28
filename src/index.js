const { taiData, UNIX_START, UNIX_END } = require('./tai-data')
const { MODELS } = require('./munge.js')
const { Converter } = require('./converter')

module.exports.UNIX_START = UNIX_START.toMillis()
module.exports.UNIX_END = UNIX_END.toMillis()
module.exports.MODELS = MODELS
module.exports.TaiConverter = model => Converter(taiData, model)

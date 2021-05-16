const { Converter, MODELS } = require('./converter')
const { taiData, UNIX_START, UNIX_END } = require('./tai-data')

module.exports.UNIX_START = UNIX_START
module.exports.UNIX_END = UNIX_END
module.exports.MODELS = MODELS
module.exports.TaiConverter = model => Converter(taiData, model)

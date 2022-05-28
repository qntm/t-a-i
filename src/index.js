const { TaiConverter, MODELS, UNIX_START, UNIX_END } = require('./exact')
const { Converter } = require('./converter')

module.exports.UNIX_START = UNIX_START.toMillis()
module.exports.UNIX_END = UNIX_END.toMillis()
module.exports.MODELS = MODELS
module.exports.TaiConverter = model => Converter(TaiConverter(model))

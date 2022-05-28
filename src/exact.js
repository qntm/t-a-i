const { taiData, UNIX_START, UNIX_END } = require('./tai-data.js')
const { MODELS } = require('./munge.js')
const { Converter } = require('./converter.js')
const { Rat } = require('./rat.js')

module.exports.UNIX_START = UNIX_START
module.exports.UNIX_END = UNIX_END
module.exports.MODELS = MODELS
module.exports.TaiConverter = model => new Converter(taiData, model)
module.exports.Rat = Rat

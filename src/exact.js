const { taiData, UNIX_START_MILLIS, UNIX_END_MILLIS } = require('./tai-data.js')
const { MODELS } = require('./munge.js')
const { Converter } = require('./converter.js')
const { Rat } = require('./rat.js')

module.exports.UNIX_START = Rat.fromMillis(UNIX_START_MILLIS)
module.exports.UNIX_END = Rat.fromMillis(UNIX_END_MILLIS)
module.exports.MODELS = MODELS
module.exports.TaiConverter = model => new Converter(taiData, model)
module.exports.Rat = Rat

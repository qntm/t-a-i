const { taiData, UNIX_START, UNIX_END } = require('./tai-data.js')
const { MODELS } = require('./munge.js')
const { ExactConverter } = require('./exact-converter')
const { Rat } = require('./rat')

module.exports.UNIX_START = UNIX_START
module.exports.UNIX_END = UNIX_END
module.exports.MODELS = MODELS
module.exports.TaiConverter = model => ExactConverter(taiData, model)
module.exports.Rat = Rat

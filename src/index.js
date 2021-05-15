const { MODELS, Converter } = require('./converter')
const { taiData } = require('./tai-data')

module.exports.MODELS = MODELS
module.exports.Converter = model => Converter(taiData, model)

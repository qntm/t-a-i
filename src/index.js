const { INSERT_MODELS, Converter } = require('./converter')
const taiData = require('./tai-data')

module.exports.INSERT_MODELS = INSERT_MODELS
module.exports.Converter = insertModel => Converter(taiData, insertModel)

const { ONE_TO_MANY, ONE_TO_ONE, Converter } = require('./converter')
const taiData = require('./tai-data')

module.exports.ONE_TO_MANY = ONE_TO_MANY
module.exports.ONE_TO_ONE = ONE_TO_ONE
module.exports.Converter = model => Converter(taiData, model)

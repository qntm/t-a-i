const { INSERT_OVERRUN_ARRAY, INSERT_STALL_LAST, Converter } = require('./converter')
const taiData = require('./tai-data')

module.exports.INSERT_OVERRUN_ARRAY = INSERT_OVERRUN_ARRAY
module.exports.INSERT_STALL_LAST = INSERT_STALL_LAST
module.exports.Converter = model => Converter(taiData, model)

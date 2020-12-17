const Converter = require('./converter')
const munge = require('./munge')
const taiData = require('./tai-data')

module.exports = Converter(munge(taiData))

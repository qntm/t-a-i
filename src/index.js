const Converter = require('./converter')
const munge = require('./munge')
const taiData = require('./tai-data')

const taiBlocks = munge(taiData)
const taiConverter = Converter(taiBlocks)

module.exports = taiConverter

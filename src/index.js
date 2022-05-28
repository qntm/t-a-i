const { Converter, MODELS } = require('./converter')
const { taiData, UNIX_START_MILLIS, UNIX_END_MILLIS } = require('./tai-data')
const { Rat } = require('./rat')

// Some of the externals' names aren't quite right so rename them here
module.exports.UNIX_START = UNIX_START_MILLIS
module.exports.UNIX_END = UNIX_END_MILLIS
module.exports.MODELS = MODELS
module.exports.Rat = Rat
module.exports.TaiConverter = model => {
  const converter = Converter(taiData, model)
  return {
    atomicToUnix: converter.atomicMillisToUnixMillis,
    unixToAtomic: converter.unixMillisToAtomicMillis
  }
}

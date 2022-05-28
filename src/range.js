module.exports.Range = class {
  constructor (start, end = start, open = false) {
    this.start = start
    this.end = end
    this.open = open
  }
}

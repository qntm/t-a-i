'use strict'

/* eslint-env jest */

const data = require('./data.js')
const generateBlocks = require('./generate-blocks.js')

describe.only('generateBlocks', () => {
  it('must have at least one block', () => {
    expect(() => generateBlocks([])).toThrow()
  })

  it.skip('must have the leap seconds in the right order', () => {
    expect(() => generateBlocks([
      {atomic: 0, offset: 0},
      {atomic: 3, offset: -1},
      {atomic: 2, offset: 1}
    ])).toThrow()

    expect(() => generateBlocks([
      {atomic: 0, offset: 0},
      {atomic: 3, offset: -1},
      {atomic: 3, offset: -2}
    ])).toThrow()
  })

  expect(generateBlocks(data)[0]).toEqual({
    blockStart_unixMillis: -283996800000n,
    driftRateTaiPicosPerUnixMilli: 15n,
    offsetAtUnixEpoch_unixPicos: 5682770000000n
  })

  /*
    it('works', () => {
      expect(generateBlocks([
        {atomic: 0, offset: 0}
      ])).toEqual([{
        offset: 0,
        unixStart: 0,
        unixEnd: Infinity,
        atomicStart: 0,
        atomicEnd: Infinity,
        driftRate: 0,
        undriftRate: 0
      }])

      expect(generateBlocks([
        {atomic: 7, offset: 0}
      ])).toEqual([{
        offset: 0,
        unixStart: 7,
        unixEnd: Infinity,
        atomicStart: 7,
        atomicEnd: Infinity,
        driftRate: 0,
        undriftRate: 0
      }])

      expect(generateBlocks([
        {atomic: 0, offset: -4}
      ])).toEqual([{
        offset: -4,
        atomicStart: 0,
        atomicEnd: Infinity,
        unixStart: 4,
        unixEnd: Infinity,
        driftRate: 0,
        undriftRate: 0
      }])

      expect(generateBlocks([
        {atomic: 7, offset: -4}
      ])).toEqual([{
        offset: -4,
        unixStart: 11,
        unixEnd: Infinity,
        atomicStart: 7,
        atomicEnd: Infinity,
        driftRate: 0,
        undriftRate: 0
      }])

      //                  inserted       removed
      //                       \/         \/
      // TAI:          [3][4][5][6][ 7][ 8][ 9][...]
      // Unix: [...][6][7][8][9][9][10][11][13][...]
      expect(generateBlocks([
        {atomic: 3, offset: -4},
        {atomic: 6, offset: -3}, // inserted leap millisecond
        {atomic: 9, offset: -4}  // removed leap millisecond
      ])).toEqual([{
        offset: -4,
        atomicStart: 3,
        atomicEnd: 6,
        unixStart: 7,
        unixEnd: 10,
        driftRate: 0,
        undriftRate: 0
      }, {
        offset: -3,
        atomicStart: 6,
        atomicEnd: 9,
        unixStart: 9,
        unixEnd: 12,
        driftRate: 0,
        undriftRate: 0
      }, {
        offset: -4,
        atomicStart: 9,
        atomicEnd: Infinity,
        unixStart: 13,
        unixEnd: Infinity,
        driftRate: 0,
        undriftRate: 0
      }])
    })
  */
})

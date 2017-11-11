'use strict'

/* eslint-env jasmine */

const build = require('./../src/build.js')

describe('build', () => {
  describe('_generateBlocks', () => {
    const generateBlocks = arg => {
      const results = build._generateBlocks(arg)
      results.forEach(result => {
        delete result.unixToAtomic
        delete result.atomicToUnix
      })
      return results
    }

    it('must have at least one block', () => {
      expect(() => generateBlocks([])).toThrow()
    })

    it('must have the leap seconds in the right order', () => {
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
  })

  describe('a', () => {
    //                  inserted       removed
    //                       \/         \/
    // TAI:          [3][4][5][6][ 7][ 8][ 9][...]
    // Unix: [...][6][7][8][9][9][10][11][13][...]
    const a = build([
      {atomic: 3, offset: -4},
      {atomic: 6, offset: -3}, // inserted leap millisecond
      {atomic: 9, offset: -4}  // removed leap millisecond
    ])

    describe('convert.oneToMany.atomicToUnix', () => {
      it('works', () => {
        expect(() => a.convert.oneToMany.atomicToUnix(2)).toThrow()
        expect(a.convert.oneToMany.atomicToUnix(3)).toBe(7)
        expect(a.convert.oneToMany.atomicToUnix(4)).toBe(8)
        expect(a.convert.oneToMany.atomicToUnix(5)).toBe(9)
        expect(a.convert.oneToMany.atomicToUnix(6)).toBe(9)
        expect(a.convert.oneToMany.atomicToUnix(7)).toBe(10)
        expect(a.convert.oneToMany.atomicToUnix(8)).toBe(11)
        // no way to get 12
        expect(a.convert.oneToMany.atomicToUnix(9)).toBe(13)
      })
    })

    describe('atomicToUnix', () => {
      it('works', () => {
        expect(() => a.atomicToUnix(2)).toThrow()
        expect(a.atomicToUnix(3)).toBe(7)
        expect(a.atomicToUnix(4)).toBe(8)
        expect(a.atomicToUnix(5)).toBe(9)
        expect(a.atomicToUnix(6)).toBe(9)
        expect(a.atomicToUnix(7)).toBe(10)
        expect(a.atomicToUnix(8)).toBe(11)
        // no way to get 12
        expect(a.atomicToUnix(9)).toBe(13)
      })
    })

    describe('convert.oneToOne.atomicToUnix', () => {
      it('fails somewhere', () => {
        expect(() => a.convert.oneToOne.atomicToUnix(2)).toThrow()
      })

      it('works', () => {
        expect(a.convert.oneToOne.atomicToUnix(3)).toBe(7)
        expect(a.convert.oneToOne.atomicToUnix(4)).toBe(8)
        expect(() => a.convert.oneToOne.atomicToUnix(5)).toThrow()
        expect(a.convert.oneToOne.atomicToUnix(6)).toBe(9)
        expect(a.convert.oneToOne.atomicToUnix(7)).toBe(10)
        expect(a.convert.oneToOne.atomicToUnix(8)).toBe(11)
        // no way to get 12
        expect(a.convert.oneToOne.atomicToUnix(9)).toBe(13)
      })
    })

    describe('convert.oneToMany.unixToAtomic', () => {
      it('works', () => {
        expect(() => a.convert.oneToMany.unixToAtomic(6)).toThrow()
        expect(a.convert.oneToMany.unixToAtomic(7)).toEqual([3])
        expect(a.convert.oneToMany.unixToAtomic(8)).toEqual([4])
        // No way to get 5
        expect(a.convert.oneToMany.unixToAtomic(9)).toEqual([5, 6])
        expect(a.convert.oneToMany.unixToAtomic(10)).toEqual([7])
        expect(a.convert.oneToMany.unixToAtomic(11)).toEqual([8])
        expect(a.convert.oneToMany.unixToAtomic(12)).toEqual([])
        expect(a.convert.oneToMany.unixToAtomic(13)).toEqual([9])
      })
    })

    describe('convert.oneToOne.unixToAtomic', () => {
      it('works', () => {
        expect(() => a.convert.oneToOne.unixToAtomic(6)).toThrow()
        expect(a.convert.oneToOne.unixToAtomic(7)).toBe(3)
        expect(a.convert.oneToOne.unixToAtomic(8)).toBe(4)
        // No way to get 5
        expect(a.convert.oneToOne.unixToAtomic(9)).toBe(6)
        expect(a.convert.oneToOne.unixToAtomic(10)).toBe(7)
        expect(a.convert.oneToOne.unixToAtomic(11)).toBe(8)
        expect(() => a.convert.oneToOne.unixToAtomic(12)).toThrow()
        expect(a.convert.oneToOne.unixToAtomic(13)).toBe(9)
      })
    })

    describe('unixToAtomic', () => {
      it('works', () => {
        expect(() => a.unixToAtomic(6)).toThrow()
        expect(a.unixToAtomic(7)).toBe(3)
        expect(a.unixToAtomic(8)).toBe(4)
        // No way to get 5
        expect(a.unixToAtomic(9)).toBe(6)
        expect(a.unixToAtomic(10)).toBe(7)
        expect(a.unixToAtomic(11)).toBe(8)
        expect(() => a.unixToAtomic(12)).toThrow()
        expect(a.unixToAtomic(13)).toBe(9)
      })
    })

    it('has a bug fixed', () => {
      expect(a.convert.oneToMany.unixToAtomic(7)).toEqual([3])
      expect(isNaN(a.convert.oneToOne.unixToAtomic(7))).toBe(false)
    })
  })

  it('weird example with two removed leap seconds in succession', () => {
    expect(() => build([
      {atomic: 0, offset: 0},
      {atomic: 3, offset: -1},
      {atomic: 3, offset: -1}
    ])).toThrow()
  })

  it('bizarre example where the first offset sets Unix back before the beginning of TAI', () => {
    expect(() => build([
      {atomic: 0, offset: 0},
      {atomic: 3, offset: -5}
    ])).not.toThrow()
  })

  // TODO: what if the first thing that happens is that we insert 5 leap seconds?
})

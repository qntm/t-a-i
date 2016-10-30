"use strict";

var build = require("./../src/build.js");

{
	// _generateBlocks

	// Must have at least one block
	try {
		build._generateBlocks([]);
		console.log(false);
	} catch(e) {
		console.log(true);
	}

	// Got to put those leap seconds in the right order
	try {
		build._generateBlocks([
			{atomic: 0, offset:  0},
			{atomic: 3, offset: -1},
			{atomic: 2, offset:  1}
		]);
		console.log(false);
	} catch(e) {
		console.log(true);
	}

	try {
		build._generateBlocks([
			{atomic: 0, offset:  0},
			{atomic: 3, offset: -1},
			{atomic: 3, offset: -2}
		]);
		console.log(false);
	} catch(e) {
		console.log(true);
	}

	{
		var blocks = build._generateBlocks([
			{atomic: 0, offset: 0}
		]);
		console.log(blocks.length === 1);
		console.log(blocks[0].offset === 0);
		console.log(blocks[0].unixStart === 0);
		console.log(blocks[0].unixEnd === Infinity);
		console.log(blocks[0].atomicStart === 0);
		console.log(blocks[0].atomicEnd === Infinity);
	}

	{
		var blocks2 = build._generateBlocks([
			{atomic: 7, offset: 0}
		]);
		console.log(blocks2.length === 1);
		console.log(blocks2[0].offset === 0);
		console.log(blocks2[0].unixStart === 7);
		console.log(blocks2[0].unixEnd === Infinity);
		console.log(blocks2[0].atomicStart === 7);
		console.log(blocks2[0].atomicEnd === Infinity);
	}

	{
		var blocks3 = build._generateBlocks([
			{atomic: 0, offset: -4}
		]);
		console.log(blocks3.length === 1);
		console.log(blocks3[0].offset === -4);
		console.log(blocks3[0].atomicStart === 0);
		console.log(blocks3[0].atomicEnd === Infinity);
		console.log(blocks3[0].unixStart === 4);
		console.log(blocks3[0].unixEnd === Infinity);
	}

	{
		var blocks4 = build._generateBlocks([
			{atomic: 7, offset: -4}
		]);
		console.log(blocks4.length === 1);
		console.log(blocks4[0].offset === -4);
		console.log(blocks4[0].unixStart === 11);
		console.log(blocks4[0].unixEnd === Infinity);
		console.log(blocks4[0].atomicStart === 7);
		console.log(blocks4[0].atomicEnd === Infinity);
	}

	{
		//                  inserted       removed
		//                       \/         \/
		// TAI:          [3][4][5][6][ 7][ 8][ 9][...]
		// Unix: [...][6][7][8][9][9][10][11]
		//                               [12][13][...]
		var blocks5 = build._generateBlocks([
			{atomic: 3, offset: -4},
			{atomic: 6, offset: -3}, // inserted leap millisecond
			{atomic: 9, offset: -4}  // removed leap millisecond
		]);
		console.log(blocks5.length === 3);
		console.log(blocks5[0].offset === -4);
		console.log(blocks5[0].atomicStart === 3);
		console.log(blocks5[0].atomicEnd === 6);
		console.log(blocks5[0].unixStart === 7);
		console.log(blocks5[0].unixEnd === 10);
		console.log(blocks5[1].offset === -3);
		console.log(blocks5[1].atomicStart === 6);
		console.log(blocks5[1].atomicEnd === 9);
		console.log(blocks5[1].unixStart === 9);
		console.log(blocks5[1].unixEnd === 12);
		console.log(blocks5[2].offset === -4);
		console.log(blocks5[2].atomicStart === 8);
		console.log(blocks5[2].atomicEnd === Infinity);
		console.log(blocks5[2].unixStart === 12);
		console.log(blocks5[2].unixEnd === Infinity);
	}
}

{
	// build

	//                  inserted       removed
	//                       \/         \/
	// TAI:          [3][4][5][6][ 7][ 8][ 9][...]
	// Unix: [...][6][7][8][9][9][10][11]
	//                               [12][13][...]
	var a = build([
		{atomic: 3, offset: -4},
		{atomic: 6, offset: -3}, // inserted leap millisecond
		{atomic: 9, offset: -4}  // removed leap millisecond
	]);

	console.log(a.leapSeconds.length === 3);

	{
		// convert.manyToMany.atomicToUnix
		try {
			a.convert.manyToMany.atomicToUnix(2);
			console.log(false);
		} catch(e) {
			console.log(true);
		}
		console.log(a.convert.manyToMany.atomicToUnix(3).length === 1);
		console.log(a.convert.manyToMany.atomicToUnix(3)[0] === 7);
		console.log(a.convert.manyToMany.atomicToUnix(4).length === 1);
		console.log(a.convert.manyToMany.atomicToUnix(4)[0] === 8);
		console.log(a.convert.manyToMany.atomicToUnix(5).length === 1);
		console.log(a.convert.manyToMany.atomicToUnix(5)[0] === 9);
		console.log(a.convert.manyToMany.atomicToUnix(6).length === 1);
		console.log(a.convert.manyToMany.atomicToUnix(6)[0] === 9);
		console.log(a.convert.manyToMany.atomicToUnix(7).length === 1);
		console.log(a.convert.manyToMany.atomicToUnix(7)[0] === 10);
		console.log(a.convert.manyToMany.atomicToUnix(8).length === 2);
		console.log(a.convert.manyToMany.atomicToUnix(8)[0] === 11);
		console.log(a.convert.manyToMany.atomicToUnix(8)[1] === 12);
		console.log(a.convert.manyToMany.atomicToUnix(9).length === 1);
		console.log(a.convert.manyToMany.atomicToUnix(9)[0] === 13);
	}

	{
		// convert.manyToOne.atomicToUnix
		try {
			a.convert.manyToOne.atomicToUnix(2);
			console.log(false);
		} catch(e) {
			console.log(true);
		}
		console.log(a.convert.manyToOne.atomicToUnix(3) === 7);
		console.log(a.convert.manyToOne.atomicToUnix(4) === 8);
		console.log(a.convert.manyToOne.atomicToUnix(5) === 9);
		console.log(a.convert.manyToOne.atomicToUnix(6) === 9);
		console.log(a.convert.manyToOne.atomicToUnix(7) === 10);
		// no way to get 11
		console.log(a.convert.manyToOne.atomicToUnix(8) === 12);
		console.log(a.convert.manyToOne.atomicToUnix(9) === 13);
	}

	{
		// convert.oneToOne.atomicToUnix
		try {
			a.convert.oneToOne.atomicToUnix(2);
			console.log(false);
		} catch(e) {
			console.log(true);
		}
		console.log(a.convert.oneToOne.atomicToUnix(3) === 7);
		console.log(a.convert.oneToOne.atomicToUnix(4) === 8);
		try {
			a.convert.oneToOne.atomicToUnix(5);
			console.log(false);
		} catch(e) {
			console.log(true);
		}
		console.log(a.convert.oneToOne.atomicToUnix(6) === 9);
		console.log(a.convert.oneToOne.atomicToUnix(7) === 10);
		// no way to get 11
		console.log(a.convert.oneToOne.atomicToUnix(9) === 13);
	}

	{
		// convert.manyToMany.unixToAtomic
		try {
			a.convert.manyToMany.unixToAtomic(6);
			console.log(false);
		} catch(e) {
			console.log(true);
		}
		console.log(a.convert.manyToMany.unixToAtomic(7).length === 1);
		console.log(a.convert.manyToMany.unixToAtomic(7)[0] === 3);
		console.log(a.convert.manyToMany.unixToAtomic(8).length === 1);
		console.log(a.convert.manyToMany.unixToAtomic(8)[0] === 4);
		console.log(a.convert.manyToMany.unixToAtomic(9).length === 2);
		console.log(a.convert.manyToMany.unixToAtomic(9)[0] === 5);
		console.log(a.convert.manyToMany.unixToAtomic(9)[1] === 6);
		console.log(a.convert.manyToMany.unixToAtomic(10).length === 1);
		console.log(a.convert.manyToMany.unixToAtomic(10)[0] === 7);
		console.log(a.convert.manyToMany.unixToAtomic(11).length === 1);
		console.log(a.convert.manyToMany.unixToAtomic(11)[0] === 8);
		console.log(a.convert.manyToMany.unixToAtomic(12).length === 1);
		console.log(a.convert.manyToMany.unixToAtomic(12)[0] === 8);
		console.log(a.convert.manyToMany.unixToAtomic(13).length === 1);
		console.log(a.convert.manyToMany.unixToAtomic(13)[0] === 9);
	}

	{
		// convert.manyToOne.unixToAtomic
		try {
			a.convert.manyToOne.unixToAtomic(6);
			console.log(false);
		} catch(e) {
			console.log(true);
		}
		console.log(a.convert.manyToOne.unixToAtomic(7) === 3);
		console.log(a.convert.manyToOne.unixToAtomic(8) === 4);
		// No way to get 5
		console.log(a.convert.manyToOne.unixToAtomic(9) === 6);
		console.log(a.convert.manyToOne.unixToAtomic(10) === 7);
		console.log(a.convert.manyToOne.unixToAtomic(11) === 8);
		console.log(a.convert.manyToOne.unixToAtomic(12) === 8);
		console.log(a.convert.manyToOne.unixToAtomic(13) === 9);
	}

	{
		// convert.oneToOne.unixToAtomic
		try {
			a.convert.oneToOne.unixToAtomic(6);
			console.log(false);
		} catch(e) {
			console.log(true);
		}
		console.log(a.convert.oneToOne.unixToAtomic(7) === 3);
		console.log(a.convert.oneToOne.unixToAtomic(8) === 4);
		// No way to get 5
		console.log(a.convert.oneToOne.unixToAtomic(9) === 6);
		console.log(a.convert.oneToOne.unixToAtomic(10) === 7);
		try {
			a.convert.oneToOne.unixToAtomic(11) === 8;
		} catch(e) {
			console.log(true);
		}
		console.log(a.convert.oneToOne.unixToAtomic(12) === 8);
		console.log(a.convert.oneToOne.unixToAtomic(13) === 9);
	}
}

{
	// Weird example with two removed leap seconds in succession
	try {
		build([
			{atomic: 0, offset:  0},
			{atomic: 3, offset: -1},
			{atomic: 3, offset: -1}
		]);
	} catch(e) {
		console.log(true);
	}

	// Bizarre example where the first offset sets Unix back before the beginning of TAI
	try {
		build([
			{atomic: 0, offset:  0},
			{atomic: 3, offset: -5}
		]);
	} catch(e) {
		console.log(true);
	}
}

// TODO: what if the first thing that happens is that we insert 5 leap seconds?

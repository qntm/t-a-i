"use strict";

var tai = require("./../src/t-a-i.js");

var JANUARY = 0;
var OCTOBER = 9;
var DECEMBER = 11;

{
	// TAI->Unix conversions

	// The earliest instant in TAI
	try {
		tai.convert.manyToMany.atomicToUnix(Date.UTC(1972, JANUARY, 1, 0, 0,  9, 999));
		console.log(false);
	} catch(e) {
		console.log(true);
	}
	try {
		tai.convert.manyToOne.atomicToUnix(Date.UTC(1972, JANUARY, 1, 0, 0,  9, 999));
		console.log(false);
	} catch(e) {
		console.log(true);
	}
	console.log(tai.convert.manyToMany.atomicToUnix(Date.UTC(1972, JANUARY, 1, 0, 0, 10,   0)).length === 1);
	console.log(tai.convert.manyToMany.atomicToUnix(Date.UTC(1972, JANUARY, 1, 0, 0, 10,   0))[0] === Date.UTC(1972, JANUARY, 1, 0, 0, 0, 0));
	console.log(tai.convert.manyToMany.atomicToUnix(Date.UTC(1972, JANUARY, 1, 0, 0, 10,   1)).length === 1);
	console.log(tai.convert.manyToMany.atomicToUnix(Date.UTC(1972, JANUARY, 1, 0, 0, 10,   1))[0] === Date.UTC(1972, JANUARY, 1, 0, 0, 0, 1));
	console.log(tai.convert.manyToOne .atomicToUnix(Date.UTC(1972, JANUARY, 1, 0, 0, 10,   2))    === Date.UTC(1972, JANUARY, 1, 0, 0, 0, 2));
	console.log(tai                   .atomicToUnix(Date.UTC(1972, JANUARY, 1, 0, 0, 10,   2))    === Date.UTC(1972, JANUARY, 1, 0, 0, 0, 2));
	// etc.

	// A typical leap second from the past, note repetition
	console.log(tai.convert.manyToOne.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 29, 750)) === Date.UTC(1998, DECEMBER, 31, 23, 59, 58, 750));
	console.log(tai.convert.manyToOne.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 30,   0)) === Date.UTC(1998, DECEMBER, 31, 23, 59, 59,   0));
	console.log(tai.convert.manyToOne.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 30, 250)) === Date.UTC(1998, DECEMBER, 31, 23, 59, 59, 250));
	console.log(tai.convert.manyToOne.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 30, 500)) === Date.UTC(1998, DECEMBER, 31, 23, 59, 59, 500));
	console.log(tai.convert.manyToOne.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 30, 750)) === Date.UTC(1998, DECEMBER, 31, 23, 59, 59, 750));
	console.log(tai.convert.manyToOne.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 31,   0)) === Date.UTC(1999, JANUARY ,  1,  0,  0,  0,   0));
	console.log(tai.convert.manyToOne.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 31, 250)) === Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 250));
	console.log(tai.convert.manyToOne.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 31, 500)) === Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 500));
	console.log(tai.convert.manyToOne.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 31, 750)) === Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 750));
	console.log(tai.convert.manyToOne.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 32,   0)) === Date.UTC(1999, JANUARY ,  1,  0,  0,  0,   0)); // repetition
	console.log(tai.convert.manyToOne.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 32, 250)) === Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 250)); // repetition
	console.log(tai.convert.manyToOne.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 32, 500)) === Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 500)); // repetition
	console.log(tai.convert.manyToOne.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 32, 750)) === Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 750)); // repetition
	console.log(tai.convert.manyToOne.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 33,   0)) === Date.UTC(1999, JANUARY ,  1,  0,  0,  1,   0));
	console.log(tai.convert.manyToOne.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 33, 250)) === Date.UTC(1999, JANUARY ,  1,  0,  0,  1, 250));

	// Now-ish
	console.log(tai.convert.manyToOne.atomicToUnix(Date.UTC(2016, OCTOBER, 27, 20, 5, 50, 678)) === Date.UTC(2016, OCTOBER, 27, 20, 5, 14, 678));
}

{
	// Unix->TAI conversions
	// The earliest instant in TAI
	try {
		tai.convert.manyToMany.unixToAtomic(Date.UTC(1971, DECEMBER, 31, 23, 59, 59, 999));
		console.log(false);
	} catch(e) {
		console.log(true);
	}
	try {
		tai.convert.manyToOne.unixToAtomic(Date.UTC(1971, DECEMBER, 31, 23, 59, 59, 999));
		console.log(false);
	} catch(e) {
		console.log(true);
	}
	console.log(tai.convert.manyToMany.unixToAtomic(Date.UTC(1972, JANUARY, 1, 0, 0, 0,   0)).length === 1);
	console.log(tai.convert.manyToMany.unixToAtomic(Date.UTC(1972, JANUARY, 1, 0, 0, 0,   0))[0] === Date.UTC(1972, JANUARY, 1, 0, 0, 10, 0));
	console.log(tai.convert.manyToMany.unixToAtomic(Date.UTC(1972, JANUARY, 1, 0, 0, 0,   1)).length === 1);
	console.log(tai.convert.manyToMany.unixToAtomic(Date.UTC(1972, JANUARY, 1, 0, 0, 0,   1))[0] === Date.UTC(1972, JANUARY, 1, 0, 0, 10, 1));
	console.log(tai.convert.manyToOne .unixToAtomic(Date.UTC(1972, JANUARY, 1, 0, 0, 0,   2))    === Date.UTC(1972, JANUARY, 1, 0, 0, 10, 2));
	console.log(tai                   .unixToAtomic(Date.UTC(1972, JANUARY, 1, 0, 0, 0,   2))    === Date.UTC(1972, JANUARY, 1, 0, 0, 10, 2));
	// etc.

	// A typical leap second from the past, note repetition
	console.log(tai.convert.manyToOne .unixToAtomic(Date.UTC(1998, DECEMBER, 31, 23, 59, 58, 750))    === Date.UTC(1999, JANUARY, 1, 0, 0, 29, 750));
	console.log(tai.convert.manyToOne .unixToAtomic(Date.UTC(1998, DECEMBER, 31, 23, 59, 59,   0))    === Date.UTC(1999, JANUARY, 1, 0, 0, 30,   0));
	console.log(tai.convert.manyToOne .unixToAtomic(Date.UTC(1998, DECEMBER, 31, 23, 59, 59, 250))    === Date.UTC(1999, JANUARY, 1, 0, 0, 30, 250));
	console.log(tai.convert.manyToOne .unixToAtomic(Date.UTC(1998, DECEMBER, 31, 23, 59, 59, 500))    === Date.UTC(1999, JANUARY, 1, 0, 0, 30, 500));

	console.log(tai.convert.manyToMany.unixToAtomic(Date.UTC(1998, DECEMBER, 31, 23, 59, 59, 750)).length === 1);
	console.log(tai.convert.manyToMany.unixToAtomic(Date.UTC(1998, DECEMBER, 31, 23, 59, 59, 750))[0] === Date.UTC(1999, JANUARY, 1, 0, 0, 30, 750));
	console.log(tai.convert.manyToOne .unixToAtomic(Date.UTC(1998, DECEMBER, 31, 23, 59, 59, 750))    === Date.UTC(1999, JANUARY, 1, 0, 0, 30, 750));

	console.log(tai.convert.manyToMany.unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  0,   0)).length === 2);
	console.log(tai.convert.manyToMany.unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  0,   0))[0] === Date.UTC(1999, JANUARY, 1, 0, 0, 31,   0));
	console.log(tai.convert.manyToMany.unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  0,   0))[1] === Date.UTC(1999, JANUARY, 1, 0, 0, 32,   0));
	console.log(tai.convert.manyToOne .unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  0,   0))    === Date.UTC(1999, JANUARY, 1, 0, 0, 32,   0));

	console.log(tai.convert.manyToMany.unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 250)).length === 2);
	console.log(tai.convert.manyToMany.unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 250))[0] === Date.UTC(1999, JANUARY, 1, 0, 0, 31, 250));
	console.log(tai.convert.manyToMany.unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 250))[1] === Date.UTC(1999, JANUARY, 1, 0, 0, 32, 250));
	console.log(tai.convert.manyToOne .unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 250))    === Date.UTC(1999, JANUARY, 1, 0, 0, 32, 250));

	console.log(tai.convert.manyToMany.unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 500)).length === 2);
	console.log(tai.convert.manyToMany.unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 500))[0] === Date.UTC(1999, JANUARY, 1, 0, 0, 31, 500));
	console.log(tai.convert.manyToMany.unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 500))[1] === Date.UTC(1999, JANUARY, 1, 0, 0, 32, 500));
	console.log(tai.convert.manyToOne .unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 500))    === Date.UTC(1999, JANUARY, 1, 0, 0, 32, 500));

	console.log(tai.convert.manyToMany.unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 750)).length === 2);
	console.log(tai.convert.manyToMany.unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 750))[0] === Date.UTC(1999, JANUARY, 1, 0, 0, 31, 750));
	console.log(tai.convert.manyToMany.unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 750))[1] === Date.UTC(1999, JANUARY, 1, 0, 0, 32, 750));
	console.log(tai.convert.manyToOne .unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 750))    === Date.UTC(1999, JANUARY, 1, 0, 0, 32, 750));

	console.log(tai.convert.manyToMany.unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  1,   0)).length === 1);
	console.log(tai.convert.manyToMany.unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  1,   0))[0] === Date.UTC(1999, JANUARY, 1, 0, 0, 33,   0));
	console.log(tai.convert.manyToOne .unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  1,   0))    === Date.UTC(1999, JANUARY, 1, 0, 0, 33,   0));
	console.log(tai.convert.manyToOne .unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  1, 250))    === Date.UTC(1999, JANUARY, 1, 0, 0, 33, 250));

	// Now-ish
	console.log(tai.convert.manyToOne.unixToAtomic(Date.UTC(2016, OCTOBER, 27, 20, 5, 14, 678)) === Date.UTC(2016, OCTOBER, 27, 20, 5, 50, 678));
}

{
	// Demo
	console.log(tai.unixToAtomic(915148799000) === 915148830000);
	console.log(tai.unixToAtomic(Date.UTC(1998, DECEMBER, 31, 23, 59, 59)) === Date.UTC(1999, JANUARY, 1, 0, 0, 30));
	console.log(tai.atomicToUnix(915148830000) === 915148799000);
	console.log(tai.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 30)) === Date.UTC(1998, DECEMBER, 31, 23, 59, 59));
	console.log(tai.convert.manyToMany.unixToAtomic(915148800000).length === 2);
	console.log(tai.convert.manyToMany.unixToAtomic(915148800000)[0] === 915148831000);
	console.log(tai.convert.manyToMany.unixToAtomic(915148800000)[1] === 915148832000);
	console.log(tai.convert.manyToMany.atomicToUnix(915148831000).length === 1);
	console.log(tai.convert.manyToMany.atomicToUnix(915148831000)[0] === 915148800000);
	console.log(tai.convert.manyToMany.atomicToUnix(915148832000).length === 1);
	console.log(tai.convert.manyToMany.atomicToUnix(915148832000)[0] === 915148800000);
	try {
		tai.convert.oneToOne.atomicToUnix(915148831000);
		console.log(false);
	} catch(e) {
		console.log(true);
	}

	console.log(tai.leapSeconds.length === 28);
}

// TODO: what if the first thing that happens is that we insert 5 leap seconds?

"use strict";

var tai = require("./../src/t-a-i.js");

var JANUARY   =  0;
var FEBRUARY  =  1;
var JULY      =  6;
var AUGUST    =  7;
var SEPTEMBER =  8;
var OCTOBER   =  9;
var DECEMBER  = 11;

{
	// TAI->Unix conversions

	// The NEW earliest instant in TAI
	try {
		tai.atomicToUnix(Date.UTC(1961, JANUARY, 1, 0, 0, 1, 422));
		console.log(false);
	} catch(e) {
		console.log(true);
	}
	try {
		tai.atomicToUnix(Date.UTC(1961, JANUARY, 1, 0, 0, 1, 422) + 0.818);
		console.log(false);
	} catch(e) {
		console.log(true);
	}
	try {
		tai.atomicToUnix(-283996798577.182); // same
		console.log(false);
	} catch(e) {
		console.log(true);
	}

	// This is the earliest 64-bit float number of TAI milliseconds which represents a legal
	// TAI time, coming just slightly after the beginning of TAI.
	console.log(tai.atomicToUnix(-283996798577.18195) > -283996800000);
	console.log(tai.atomicToUnix(-283996798577.18195) === -283996799999.99994);

	// Oog, floating point
	console.log(Math.round(tai.convert.oneToMany.atomicToUnix(Date.UTC(1961, JANUARY, 1, 0, 0, 1, 423))) === Date.UTC(1961, JANUARY, 1, 0, 0, 0, 0));
	console.log(tai.convert.oneToMany.atomicToUnix(Date.UTC(1972, JANUARY, 1, 0, 0, 9, 999)) === 63072000106.757996);
	console.log(tai.convert.oneToMany.atomicToUnix(Date.UTC(1972, JANUARY, 1, 0, 0, 9, 999)) === Date.UTC(1972, JANUARY, 1, 0, 0, 0, 106) + 0.757996);

	// After this point in time, conversions become far simpler and always integer numbers of milliseconds
	console.log(tai.convert.oneToMany.atomicToUnix(Date.UTC(1972, JANUARY, 1, 0, 0, 10, 0)) === Date.UTC(1972, JANUARY, 1, 0, 0, 0, 0));
	console.log(tai.convert.oneToMany.atomicToUnix(Date.UTC(1972, JANUARY, 1, 0, 0, 10, 1)) === Date.UTC(1972, JANUARY, 1, 0, 0, 0, 1));
	console.log(tai.convert.oneToMany.atomicToUnix(Date.UTC(1972, JANUARY, 1, 0, 0, 10, 2)) === Date.UTC(1972, JANUARY, 1, 0, 0, 0, 2));

	console.log(tai.convert.oneToOne .atomicToUnix(Date.UTC(1972, JANUARY, 1, 0, 0, 10, 0)) === Date.UTC(1972, JANUARY, 1, 0, 0, 0, 0));
	console.log(tai.convert.oneToOne .atomicToUnix(Date.UTC(1972, JANUARY, 1, 0, 0, 10, 1)) === Date.UTC(1972, JANUARY, 1, 0, 0, 0, 1));
	console.log(tai.convert.oneToOne .atomicToUnix(Date.UTC(1972, JANUARY, 1, 0, 0, 10, 2)) === Date.UTC(1972, JANUARY, 1, 0, 0, 0, 2));

	console.log(tai.atomicToUnix(Date.UTC(1972, JANUARY, 1, 0, 0, 10, 0)) === Date.UTC(1972, JANUARY, 1, 0, 0, 0, 0));
	console.log(tai.atomicToUnix(Date.UTC(1972, JANUARY, 1, 0, 0, 10, 1)) === Date.UTC(1972, JANUARY, 1, 0, 0, 0, 1));
	console.log(tai.atomicToUnix(Date.UTC(1972, JANUARY, 1, 0, 0, 10, 2)) === Date.UTC(1972, JANUARY, 1, 0, 0, 0, 2));
	// etc.

	// A typical leap second from the past, note repetition
	console.log(tai.convert.oneToMany.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 29, 750)) === Date.UTC(1998, DECEMBER, 31, 23, 59, 58, 750));
	console.log(tai.convert.oneToMany.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 30,   0)) === Date.UTC(1998, DECEMBER, 31, 23, 59, 59,   0));
	console.log(tai.convert.oneToMany.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 30, 250)) === Date.UTC(1998, DECEMBER, 31, 23, 59, 59, 250));
	console.log(tai.convert.oneToMany.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 30, 500)) === Date.UTC(1998, DECEMBER, 31, 23, 59, 59, 500));
	console.log(tai.convert.oneToMany.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 30, 750)) === Date.UTC(1998, DECEMBER, 31, 23, 59, 59, 750));
	console.log(tai.convert.oneToMany.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 31,   0)) === Date.UTC(1999, JANUARY ,  1,  0,  0,  0,   0));
	console.log(tai.convert.oneToMany.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 31, 250)) === Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 250));
	console.log(tai.convert.oneToMany.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 31, 500)) === Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 500));
	console.log(tai.convert.oneToMany.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 31, 750)) === Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 750));
	console.log(tai.convert.oneToMany.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 32,   0)) === Date.UTC(1999, JANUARY ,  1,  0,  0,  0,   0)); // repetition
	console.log(tai.convert.oneToMany.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 32, 250)) === Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 250)); // repetition
	console.log(tai.convert.oneToMany.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 32, 500)) === Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 500)); // repetition
	console.log(tai.convert.oneToMany.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 32, 750)) === Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 750)); // repetition
	console.log(tai.convert.oneToMany.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 33,   0)) === Date.UTC(1999, JANUARY ,  1,  0,  0,  1,   0));
	console.log(tai.convert.oneToMany.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 33, 250)) === Date.UTC(1999, JANUARY ,  1,  0,  0,  1, 250));

	// Now-ish
	console.log(tai.convert.oneToMany.atomicToUnix(Date.UTC(2016, OCTOBER, 27, 20, 5, 50, 678)) === Date.UTC(2016, OCTOBER, 27, 20, 5, 14, 678));
}

{
	// Unix->TAI conversions
	// The NEW earliest instant in TAI
	try {
		console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1960, DECEMBER, 31, 23, 59, 59, 999)));
		console.log(false);
	} catch(e) {
		console.log(true);
	}

	// Again with the icky floating point comparisons. Fun fact! There is about 105 leap milliseconds here!
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1972, JANUARY, 1, 0, 0, 0, 0)).length === 2);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1972, JANUARY, 1, 0, 0, 0, 0))[0] === Date.UTC(1972, JANUARY, 1, 0, 0,  9, 892) + 0.242004);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1972, JANUARY, 1, 0, 0, 0, 0))[1] === Date.UTC(1972, JANUARY, 1, 0, 0, 10, 0));
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1972, JANUARY, 1, 0, 0, 0, 1)).length === 2);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1972, JANUARY, 1, 0, 0, 0, 1))[1] === Date.UTC(1972, JANUARY, 1, 0, 0, 10, 1));
	console.log(tai.convert.oneToOne .unixToAtomic(Date.UTC(1972, JANUARY, 1, 0, 0, 0, 2))    === Date.UTC(1972, JANUARY, 1, 0, 0, 10, 2));
	console.log(tai                  .unixToAtomic(Date.UTC(1972, JANUARY, 1, 0, 0, 0, 2))    === Date.UTC(1972, JANUARY, 1, 0, 0, 10, 2));
	// etc.

	// A typical leap second from the past, note repetition
	console.log(tai.convert.oneToOne .unixToAtomic(Date.UTC(1998, DECEMBER, 31, 23, 59, 58, 750))    === Date.UTC(1999, JANUARY, 1, 0, 0, 29, 750));
	console.log(tai.convert.oneToOne .unixToAtomic(Date.UTC(1998, DECEMBER, 31, 23, 59, 59,   0))    === Date.UTC(1999, JANUARY, 1, 0, 0, 30,   0));
	console.log(tai.convert.oneToOne .unixToAtomic(Date.UTC(1998, DECEMBER, 31, 23, 59, 59, 250))    === Date.UTC(1999, JANUARY, 1, 0, 0, 30, 250));
	console.log(tai.convert.oneToOne .unixToAtomic(Date.UTC(1998, DECEMBER, 31, 23, 59, 59, 500))    === Date.UTC(1999, JANUARY, 1, 0, 0, 30, 500));

	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1998, DECEMBER, 31, 23, 59, 59, 750)).length === 1);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1998, DECEMBER, 31, 23, 59, 59, 750))[0] === Date.UTC(1999, JANUARY, 1, 0, 0, 30, 750));
	console.log(tai.convert.oneToOne .unixToAtomic(Date.UTC(1998, DECEMBER, 31, 23, 59, 59, 750))    === Date.UTC(1999, JANUARY, 1, 0, 0, 30, 750));

	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  0,   0)).length === 2);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  0,   0))[0] === Date.UTC(1999, JANUARY, 1, 0, 0, 31,   0));
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  0,   0))[1] === Date.UTC(1999, JANUARY, 1, 0, 0, 32,   0));
	console.log(tai.convert.oneToOne .unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  0,   0))    === Date.UTC(1999, JANUARY, 1, 0, 0, 32,   0));

	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 250)).length === 2);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 250))[0] === Date.UTC(1999, JANUARY, 1, 0, 0, 31, 250));
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 250))[1] === Date.UTC(1999, JANUARY, 1, 0, 0, 32, 250));
	console.log(tai.convert.oneToOne .unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 250))    === Date.UTC(1999, JANUARY, 1, 0, 0, 32, 250));

	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 500)).length === 2);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 500))[0] === Date.UTC(1999, JANUARY, 1, 0, 0, 31, 500));
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 500))[1] === Date.UTC(1999, JANUARY, 1, 0, 0, 32, 500));
	console.log(tai.convert.oneToOne .unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 500))    === Date.UTC(1999, JANUARY, 1, 0, 0, 32, 500));

	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 750)).length === 2);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 750))[0] === Date.UTC(1999, JANUARY, 1, 0, 0, 31, 750));
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 750))[1] === Date.UTC(1999, JANUARY, 1, 0, 0, 32, 750));
	console.log(tai.convert.oneToOne .unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  0, 750))    === Date.UTC(1999, JANUARY, 1, 0, 0, 32, 750));

	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  1,   0)).length === 1);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  1,   0))[0] === Date.UTC(1999, JANUARY, 1, 0, 0, 33,   0));
	console.log(tai.convert.oneToOne .unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  1,   0))    === Date.UTC(1999, JANUARY, 1, 0, 0, 33,   0));
	console.log(tai.convert.oneToOne .unixToAtomic(Date.UTC(1999, JANUARY ,  1,  0,  0,  1, 250))    === Date.UTC(1999, JANUARY, 1, 0, 0, 33, 250));

	// Now-ish
	console.log(tai.convert.oneToOne .unixToAtomic(Date.UTC(2016, OCTOBER, 27, 20, 5, 14, 678)) === Date.UTC(2016, OCTOBER, 27, 20, 5, 50, 678));
}

{
	// Demo
	console.log(tai.unixToAtomic(915148799000) === 915148830000);
	console.log(tai.unixToAtomic(Date.UTC(1998, DECEMBER, 31, 23, 59, 59)) === Date.UTC(1999, JANUARY, 1, 0, 0, 30));
	console.log(tai.atomicToUnix(915148830000) === 915148799000);
	console.log(tai.atomicToUnix(Date.UTC(1999, JANUARY, 1, 0, 0, 30)) === Date.UTC(1998, DECEMBER, 31, 23, 59, 59));
	console.log(tai.convert.oneToMany.unixToAtomic(915148800000).length === 2);
	console.log(tai.convert.oneToMany.unixToAtomic(915148800000)[0] === 915148831000);
	console.log(tai.convert.oneToMany.unixToAtomic(915148800000)[1] === 915148832000);
	console.log(tai.convert.oneToMany.atomicToUnix(915148831000) === 915148800000);
	console.log(tai.convert.oneToMany.atomicToUnix(915148832000) === 915148800000);
	try {
		tai.convert.oneToOne.atomicToUnix(915148831000);
		console.log(false);
	} catch(e) {
		console.log(true);
	}

	console.log(tai.leapSeconds.length === 41);
}

// TODO: what if the first thing that happens is that we insert 5 leap seconds?

{
	// Crazy pre-1972 nonsense
	console.log(Math.abs(tai.unixToAtomic(Date.UTC(1962, JANUARY, 1, 0, 0, 0)) - (Date.UTC(1962, JANUARY, 1, 0, 0, 1, 845) + 0.858)) < 0.0001);

	// Oh look, an inserted leap tenth of a second!
	// The period between 1965-09-01 00:00:00 and 00:00:00.100 UTC happened twice!
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1965, SEPTEMBER, 1, 0, 0, 0, 50)).length === 2);
	console.log(Math.abs(tai.convert.oneToMany.unixToAtomic(Date.UTC(1965, SEPTEMBER, 1, 0, 0, 0, 50))[0] - (Date.UTC(1965, SEPTEMBER, 1, 0, 0, 4, 105) + 0.058)) < 0.0001);
	console.log(Math.abs(tai.convert.oneToMany.unixToAtomic(Date.UTC(1965, SEPTEMBER, 1, 0, 0, 0, 50))[1] - (Date.UTC(1965, SEPTEMBER, 1, 0, 0, 4, 205) + 0.058)) < 0.0001);

	// Hey, what! A removed leap twentieth of a second???
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1961, JULY  , 31, 23, 59, 59, 949)).length === 1);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1961, JULY  , 31, 23, 59, 59, 950)).length === 0);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1961, JULY  , 31, 23, 59, 59, 999)).length === 0);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1961, AUGUST,  1,  0,  0,  0,   0)).length === 1);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1961, AUGUST,  1,  0,  0,  0,   1)).length === 1);
	console.log(Math.abs(tai.convert.oneToMany.atomicToUnix(Date.UTC(1961, AUGUST,  1,  0,  0,  1, 647) + 0.570) - Date.UTC(1961, AUGUST, 1, 0, 0, 0, 0)) < 0.0001);
}

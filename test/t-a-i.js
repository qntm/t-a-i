"use strict";

var tai = require("./../src/t-a-i.js");

var JANUARY   =  0;
var FEBRUARY  =  1;
var MARCH     =  2;
var APRIL     =  3;
var JULY      =  6;
var AUGUST    =  7;
var SEPTEMBER =  8;
var OCTOBER   =  9;
var NOVEMBER  = 10;
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
		console.log(tai.atomicToUnix(-283996798577.182)); // same
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

{
	// Crazy pre-1972 nonsense
	console.log(Math.abs(tai.unixToAtomic(Date.UTC(1962, JANUARY, 1, 0, 0, 0)) - (Date.UTC(1962, JANUARY, 1, 0, 0, 1, 845) + 0.858)) < 0.0001);

	// Oh look, an inserted leap tenth of a second!
	// The period between 1965-09-01 00:00:00 and 00:00:00.100 UTC happened twice!
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1965, SEPTEMBER, 1, 0, 0, 0, 50)).length === 2);
	console.log(Math.abs(tai.convert.oneToMany.unixToAtomic(Date.UTC(1965, SEPTEMBER, 1, 0, 0, 0, 50))[0] - (Date.UTC(1965, SEPTEMBER, 1, 0, 0, 4, 105) + 0.058)) < 0.0001);
	console.log(Math.abs(tai.convert.oneToMany.unixToAtomic(Date.UTC(1965, SEPTEMBER, 1, 0, 0, 0, 50))[1] - (Date.UTC(1965, SEPTEMBER, 1, 0, 0, 4, 205) + 0.058)) < 0.0001);

	// Hey, what! A removed leap twentieth of a second???
	// Well, technically, that's 1/20th of a TAI second, which is SLIGHTLY LESS than 1/20th of a UTC second
	// Which means that 23:59:59.950 UTC *does* actually exist...
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1961, JULY  , 31, 23, 59, 59, 949)).length === 1);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1961, JULY  , 31, 23, 59, 59, 950)).length === 1);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1961, JULY  , 31, 23, 59, 59, 951)).length === 0);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1961, JULY  , 31, 23, 59, 59, 999)).length === 0);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1961, AUGUST,  1,  0,  0,  0,   0)).length === 1);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1961, AUGUST,  1,  0,  0,  0,   1)).length === 1);
	console.log(Math.abs(tai.convert.oneToMany.atomicToUnix(Date.UTC(1961, AUGUST,  1,  0,  0,  1, 647) + 0.570) - Date.UTC(1961, AUGUST, 1, 0, 0, 0, 0)) < 0.0001);

	// Let's check out some boundaries where the relationship between TAI and UTC changed
	// 1 August 1961: 0.05 TAI seconds removed
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1961, JULY     , 31, 23, 59, 59, 950)).length === 1);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1961, JULY     , 31, 23, 59, 59, 951)).length === 0);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1961, JULY     , 31, 23, 59, 59, 999)).length === 0);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1961, AUGUST   ,  1,  0,  0,  0,   0)).length === 1);

	// 1 January 1962: Perfect continuity (although the drift rate changed)
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1961, DECEMBER , 31, 23, 59, 59, 999)).length === 1);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1962, JANUARY  ,  1,  0,  0,  0,   0)).length === 1);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1962, JANUARY  ,  1,  0,  0,  0,   1)).length === 1);

	// 1 November 1963: 0.1 TAI seconds inserted
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1963, OCTOBER  , 30, 23, 59, 59, 999)).length === 1);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1963, NOVEMBER ,  1,  0,  0,  0,   0)).length === 2);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1963, NOVEMBER ,  1,  0,  0,  0,  99)).length === 2);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1963, NOVEMBER ,  1,  0,  0,  0, 100)).length === 1);

	// 1 January 1964: Perfect continuity (drift rate changes)
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1963, DECEMBER , 31, 23, 59, 59, 999)).length === 1);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1964, JANUARY  ,  1,  0,  0,  0,   0)).length === 1);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1964, JANUARY  ,  1,  0,  0,  0,   1)).length === 1);

	// 1 April 1964: 0.1 TAI seconds inserted
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1964, MARCH    , 31, 23, 59, 59, 999)).length === 1);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1964, APRIL    ,  1,  0,  0,  0,   0)).length === 2);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1964, APRIL    ,  1,  0,  0,  0,  99)).length === 2);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1964, APRIL    ,  1,  0,  0,  0, 100)).length === 1);

	// etc. (various occasions when 0.1 TAI seconds were inserted)
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1964, SEPTEMBER,  1,  0,  0,  0,  99)).length === 2);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1965, JANUARY  ,  1,  0,  0,  0,  99)).length === 2);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1965, MARCH    ,  1,  0,  0,  0,  99)).length === 2);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1965, JULY     ,  1,  0,  0,  0,  99)).length === 2);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1965, SEPTEMBER,  1,  0,  0,  0,  99)).length === 2);

	// 1 January 1966: Perfect continuity (drift rate changes)
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1965, DECEMBER , 31, 23, 59, 59, 999)).length === 1);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1966, JANUARY  ,  1,  0,  0,  0,   0)).length === 1);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1966, JANUARY  ,  1,  0,  0,  0,   1)).length === 1);

	// 1 February 1968: 0.1 TAI seconds removed
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1968, JANUARY  , 31, 23, 59, 59, 899)).length === 1);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1968, JANUARY  , 31, 23, 59, 59, 900)).length === 1);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1968, JANUARY  , 31, 23, 59, 59, 901)).length === 0);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1968, JANUARY  , 31, 23, 59, 59, 999)).length === 0);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1968, FEBRUARY ,  1,  0,  0,  0,   0)).length === 1);

	// 1 January 1972: 0.107758 TAI seconds inserted
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1971, DECEMBER , 31, 23, 59, 59, 999)).length === 1);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1972, JANUARY  ,  1,  0,  0,  0,   0)).length === 2);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1972, JANUARY  ,  1,  0,  0,  0, 107)).length === 2);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1972, JANUARY  ,  1,  0,  0,  0, 108)).length === 1);

	console.log(tai.convert.oneToMany.unixToAtomic(-265680000049.99997).length === 0); // Removed time
	console.log(tai.convert.oneToMany.unixToAtomic(-252460800000      ).length === 1);
	console.log(tai.convert.oneToMany.unixToAtomic(-194659199900      ).length === 1);
	console.log(tai.convert.oneToMany.unixToAtomic(-189388800000      ).length === 1);
	console.log(tai.convert.oneToMany.unixToAtomic(-181526399900      ).length === 1);
	console.log(tai.convert.oneToMany.unixToAtomic(-168307199900      ).length === 1);
	console.log(tai.convert.oneToMany.unixToAtomic(-157766399900      ).length === 1);
	console.log(tai.convert.oneToMany.unixToAtomic(-152668799900      ).length === 1);
	console.log(tai.convert.oneToMany.unixToAtomic(-142127999900      ).length === 1);
	console.log(tai.convert.oneToMany.unixToAtomic(-136771199900      ).length === 1);
	console.log(tai.convert.oneToMany.unixToAtomic(-126230400000      ).length === 1);
	console.log(tai.convert.oneToMany.unixToAtomic(- 60480000099.99999).length === 0); // Removed time
	console.log(tai.convert.oneToMany.unixToAtomic(  63072000107.758  ).length === 1);

	console.log(tai.convert.oneToMany.unixToAtomic(-60480000100).length === 1);
	console.log(tai.convert.oneToMany.unixToAtomic(Date.UTC(1968, 0, 31, 23, 59, 59, 900)).length === 1);
}

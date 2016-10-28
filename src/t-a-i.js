"use strict";

var build = require("./build.js");

// JavaScript months are 0-indexed so I do this to keep my head straight.
var JANUARY = 0;
var JULY = 6;

/**
	International Atomic Time incoming!
*/
module.exports = build(
	// Earliest moment in Unix time where TAI is meaningful.
	// If this were a leap second we'd have PROBLEMS
	Date.UTC(1972, JANUARY, 1, 0, 0, 0, 0),

	// Initial offset of TAI from Unix time, in milliseconds
	// TAI - Unix
	10 * 1000,

	// List of leap seconds, expressed as instants in Unix time where
	// the offset between TAI and Unix time changed, and the number of
	// milliseconds by which the offset changed.
	[
		{unix: Date.UTC(1972, JULY   , 1, 0, 0, 1), offset: +1000}, // TAI is now 11 seconds "ahead" of Unix
		{unix: Date.UTC(1973, JANUARY, 1, 0, 0, 1), offset: +1000}, // 12 seconds
		{unix: Date.UTC(1974, JANUARY, 1, 0, 0, 1), offset: +1000}, // 13
		{unix: Date.UTC(1975, JANUARY, 1, 0, 0, 1), offset: +1000}, // 14
		{unix: Date.UTC(1976, JANUARY, 1, 0, 0, 1), offset: +1000}, // 15
		{unix: Date.UTC(1977, JANUARY, 1, 0, 0, 1), offset: +1000}, // 16
		{unix: Date.UTC(1978, JANUARY, 1, 0, 0, 1), offset: +1000}, // 17
		{unix: Date.UTC(1979, JANUARY, 1, 0, 0, 1), offset: +1000}, // 18
		{unix: Date.UTC(1980, JANUARY, 1, 0, 0, 1), offset: +1000}, // 19
		{unix: Date.UTC(1981, JULY   , 1, 0, 0, 1), offset: +1000}, // 20
		{unix: Date.UTC(1982, JULY   , 1, 0, 0, 1), offset: +1000}, // 21
		{unix: Date.UTC(1983, JULY   , 1, 0, 0, 1), offset: +1000}, // 22
		{unix: Date.UTC(1985, JULY   , 1, 0, 0, 1), offset: +1000}, // 23
		{unix: Date.UTC(1988, JANUARY, 1, 0, 0, 1), offset: +1000}, // 24
		{unix: Date.UTC(1990, JANUARY, 1, 0, 0, 1), offset: +1000}, // 25
		{unix: Date.UTC(1991, JANUARY, 1, 0, 0, 1), offset: +1000}, // 26
		{unix: Date.UTC(1992, JULY   , 1, 0, 0, 1), offset: +1000}, // 27
		{unix: Date.UTC(1993, JULY   , 1, 0, 0, 1), offset: +1000}, // 28
		{unix: Date.UTC(1994, JULY   , 1, 0, 0, 1), offset: +1000}, // 29
		{unix: Date.UTC(1996, JANUARY, 1, 0, 0, 1), offset: +1000}, // 30
		{unix: Date.UTC(1997, JULY   , 1, 0, 0, 1), offset: +1000}, // 31
		{unix: Date.UTC(1999, JANUARY, 1, 0, 0, 1), offset: +1000}, // 32
		{unix: Date.UTC(2006, JANUARY, 1, 0, 0, 1), offset: +1000}, // 33
		{unix: Date.UTC(2009, JANUARY, 1, 0, 0, 1), offset: +1000}, // 34
		{unix: Date.UTC(2012, JULY   , 1, 0, 0, 1), offset: +1000}, // 35
		{unix: Date.UTC(2015, JULY   , 1, 0, 0, 1), offset: +1000}, // 36
		{unix: Date.UTC(2017, JANUARY, 1, 0, 0, 1), offset: +1000}  // 37
	]
);

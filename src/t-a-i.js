"use strict";

var build = require("./build.js");

// JavaScript months are 0-indexed so I do this to keep my head straight.
var JANUARY = 0;
var JULY = 6;

/**
	International Atomic Time incoming!
*/
module.exports = build(
	// Earliest meaningful moment TAI, expressed in TAI milliseconds.
	Date.UTC(1972, JANUARY, 1, 0, 0, 10, 0),

	// Initial offset of TAI from Unix time, in milliseconds
	// TAI - Unix
	10 * 1000,

	// List of leap seconds, expressed as instants in TAI when
	// the offset between TAI and Unix time changed, and the number of
	// milliseconds by which the offset changed.
	[
		{atomic: Date.UTC(1972, JULY   , 1, 0, 0, 11), offset: +1000}, // TAI is now 11 seconds "ahead" of Unix
		{atomic: Date.UTC(1973, JANUARY, 1, 0, 0, 12), offset: +1000}, // 12 seconds
		{atomic: Date.UTC(1974, JANUARY, 1, 0, 0, 13), offset: +1000}, // 13
		{atomic: Date.UTC(1975, JANUARY, 1, 0, 0, 14), offset: +1000}, // 14
		{atomic: Date.UTC(1976, JANUARY, 1, 0, 0, 15), offset: +1000}, // 15
		{atomic: Date.UTC(1977, JANUARY, 1, 0, 0, 16), offset: +1000}, // 16
		{atomic: Date.UTC(1978, JANUARY, 1, 0, 0, 17), offset: +1000}, // 17
		{atomic: Date.UTC(1979, JANUARY, 1, 0, 0, 18), offset: +1000}, // 18
		{atomic: Date.UTC(1980, JANUARY, 1, 0, 0, 19), offset: +1000}, // 19
		{atomic: Date.UTC(1981, JULY   , 1, 0, 0, 20), offset: +1000}, // 20
		{atomic: Date.UTC(1982, JULY   , 1, 0, 0, 21), offset: +1000}, // 21
		{atomic: Date.UTC(1983, JULY   , 1, 0, 0, 22), offset: +1000}, // 22
		{atomic: Date.UTC(1985, JULY   , 1, 0, 0, 23), offset: +1000}, // 23
		{atomic: Date.UTC(1988, JANUARY, 1, 0, 0, 24), offset: +1000}, // 24
		{atomic: Date.UTC(1990, JANUARY, 1, 0, 0, 25), offset: +1000}, // 25
		{atomic: Date.UTC(1991, JANUARY, 1, 0, 0, 26), offset: +1000}, // 26
		{atomic: Date.UTC(1992, JULY   , 1, 0, 0, 27), offset: +1000}, // 27
		{atomic: Date.UTC(1993, JULY   , 1, 0, 0, 28), offset: +1000}, // 28
		{atomic: Date.UTC(1994, JULY   , 1, 0, 0, 29), offset: +1000}, // 29
		{atomic: Date.UTC(1996, JANUARY, 1, 0, 0, 30), offset: +1000}, // 30
		{atomic: Date.UTC(1997, JULY   , 1, 0, 0, 31), offset: +1000}, // 31
		{atomic: Date.UTC(1999, JANUARY, 1, 0, 0, 32), offset: +1000}, // 32
		{atomic: Date.UTC(2006, JANUARY, 1, 0, 0, 33), offset: +1000}, // 33
		{atomic: Date.UTC(2009, JANUARY, 1, 0, 0, 34), offset: +1000}, // 34
		{atomic: Date.UTC(2012, JULY   , 1, 0, 0, 35), offset: +1000}, // 35
		{atomic: Date.UTC(2015, JULY   , 1, 0, 0, 36), offset: +1000}, // 36
		{atomic: Date.UTC(2017, JANUARY, 1, 0, 0, 37), offset: +1000}  // 37
	]
);

module.exports.build = build;

"use strict";

var build = require("./build.js");

// JavaScript months are 0-indexed so I do this to keep my head straight.
var JANUARY = 0;
var JULY = 6;

/**
	International Atomic Time incoming!
*/
module.exports = build(
	// List of leap seconds, expressed as instants in TAI when
	// the offset between TAI and Unix time changed, and the new offset
	// (TAI - Unix). The first of these is the beginning of TAI for our
	// purposes.
	[
		{atomic: Date.UTC(1972, JANUARY, 1, 0, 0, 10), offset: 10000},
		{atomic: Date.UTC(1972, JULY   , 1, 0, 0, 11), offset: 11000},
		{atomic: Date.UTC(1973, JANUARY, 1, 0, 0, 12), offset: 12000},
		{atomic: Date.UTC(1974, JANUARY, 1, 0, 0, 13), offset: 13000},
		{atomic: Date.UTC(1975, JANUARY, 1, 0, 0, 14), offset: 14000},
		{atomic: Date.UTC(1976, JANUARY, 1, 0, 0, 15), offset: 15000},
		{atomic: Date.UTC(1977, JANUARY, 1, 0, 0, 16), offset: 16000},
		{atomic: Date.UTC(1978, JANUARY, 1, 0, 0, 17), offset: 17000},
		{atomic: Date.UTC(1979, JANUARY, 1, 0, 0, 18), offset: 18000},
		{atomic: Date.UTC(1980, JANUARY, 1, 0, 0, 19), offset: 19000},
		{atomic: Date.UTC(1981, JULY   , 1, 0, 0, 20), offset: 20000},
		{atomic: Date.UTC(1982, JULY   , 1, 0, 0, 21), offset: 21000},
		{atomic: Date.UTC(1983, JULY   , 1, 0, 0, 22), offset: 22000},
		{atomic: Date.UTC(1985, JULY   , 1, 0, 0, 23), offset: 23000},
		{atomic: Date.UTC(1988, JANUARY, 1, 0, 0, 24), offset: 24000},
		{atomic: Date.UTC(1990, JANUARY, 1, 0, 0, 25), offset: 25000},
		{atomic: Date.UTC(1991, JANUARY, 1, 0, 0, 26), offset: 26000},
		{atomic: Date.UTC(1992, JULY   , 1, 0, 0, 27), offset: 27000},
		{atomic: Date.UTC(1993, JULY   , 1, 0, 0, 28), offset: 28000},
		{atomic: Date.UTC(1994, JULY   , 1, 0, 0, 29), offset: 29000},
		{atomic: Date.UTC(1996, JANUARY, 1, 0, 0, 30), offset: 30000},
		{atomic: Date.UTC(1997, JULY   , 1, 0, 0, 31), offset: 31000},
		{atomic: Date.UTC(1999, JANUARY, 1, 0, 0, 32), offset: 32000},
		{atomic: Date.UTC(2006, JANUARY, 1, 0, 0, 33), offset: 33000},
		{atomic: Date.UTC(2009, JANUARY, 1, 0, 0, 34), offset: 34000},
		{atomic: Date.UTC(2012, JULY   , 1, 0, 0, 35), offset: 35000},
		{atomic: Date.UTC(2015, JULY   , 1, 0, 0, 36), offset: 36000},
		{atomic: Date.UTC(2017, JANUARY, 1, 0, 0, 37), offset: 37000}
	]
);

module.exports.build = build;

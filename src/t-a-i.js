"use strict";

var build = require("./build.js");

// JavaScript months are 0-indexed so I do this to keep my head straight.
var JANUARY   =  0;
var FEBRUARY  =  1;
var MARCH     =  2;
var APRIL     =  3;
var JULY      =  6;
var AUGUST    =  7;
var SEPTEMBER =  8;
var NOVEMBER  = 10;
var DECEMBER  = 11;

/**
	International Atomic Time incoming!
*/
module.exports = build([
	/*
		Data from IERS/USNO, after a one-time calculation to put it in the format I needed.
		For each of these data points, `atomic` indicates the TAI time when modifications
		were applied to the relationship between UTC and TAI. `offset` and `driftRate`
		provide a linear relationship between TAI and UTC starting from that moment:

		TAI - UTC = AX + B, where:
			A is the `driftRate` in TAI milliseconds per UTC day,
			X is the number of number of UTC days since the Unix epoch, 1970-01-01 00:00:00 UTC
			B was the `offset` in milliseconds between TAI and UTC at that time.

		Note that just because the X starts at the Unix epoch does NOT indicate that the 
		linear relationship extends forward or backward to that instant; it begins at `atomic`
		and ends at the beginning of the next period.
	*/
	{atomic: Date.UTC(1961, JANUARY  , 1, 0, 0,  1, 422) + 0.818000, offset:  5682.770000, driftRate: 1.296000},
	{atomic: Date.UTC(1961, AUGUST   , 1, 0, 0,  1, 647) + 0.570000, offset:  5632.770000, driftRate: 1.296000},
	{atomic: Date.UTC(1962, JANUARY  , 1, 0, 0,  1, 845) + 0.858000, offset:  5127.848400, driftRate: 1.123200},
	{atomic: Date.UTC(1963, NOVEMBER , 1, 0, 0,  2, 697) + 0.278800, offset:  5227.848400, driftRate: 1.123200},
	{atomic: Date.UTC(1964, JANUARY  , 1, 0, 0,  2, 765) + 0.794000, offset:  5606.626000, driftRate: 1.296000},
	{atomic: Date.UTC(1964, APRIL    , 1, 0, 0,  2, 983) + 0.730000, offset:  5706.626000, driftRate: 1.296000},
	{atomic: Date.UTC(1964, SEPTEMBER, 1, 0, 0,  3, 282) + 0.018000, offset:  5806.626000, driftRate: 1.296000},
	{atomic: Date.UTC(1965, JANUARY  , 1, 0, 0,  3, 540) + 0.130000, offset:  5906.626000, driftRate: 1.296000},
	{atomic: Date.UTC(1965, MARCH    , 1, 0, 0,  3, 716) + 0.594000, offset:  6006.626000, driftRate: 1.296000},
	{atomic: Date.UTC(1965, JULY     , 1, 0, 0,  3, 974) + 0.706000, offset:  6106.626000, driftRate: 1.296000},
	{atomic: Date.UTC(1965, SEPTEMBER, 1, 0, 0,  4, 155) + 0.058000, offset:  6206.626000, driftRate: 1.296000},
	{atomic: Date.UTC(1966, JANUARY  , 1, 0, 0,  4, 313) + 0.170000, offset:  8100.082000, driftRate: 2.592000},
	{atomic: Date.UTC(1968, FEBRUARY , 1, 0, 0,  6, 185) + 0.682000, offset:  8000.082000, driftRate: 2.592000},

	// From this point onwards UTC and TAI seconds are precisely the same length, yielding a
	// drift rate of zero.
	{atomic: Date.UTC(1972, JANUARY  , 1, 0, 0, 10,   0) + 0.000000, offset: 10000.000000, driftRate: 0.000000},
	{atomic: Date.UTC(1972, JULY     , 1, 0, 0, 11,   0) + 0.000000, offset: 11000.000000, driftRate: 0.000000},
	{atomic: Date.UTC(1973, JANUARY  , 1, 0, 0, 12,   0) + 0.000000, offset: 12000.000000, driftRate: 0.000000},
	{atomic: Date.UTC(1974, JANUARY  , 1, 0, 0, 13,   0) + 0.000000, offset: 13000.000000, driftRate: 0.000000},
	{atomic: Date.UTC(1975, JANUARY  , 1, 0, 0, 14,   0) + 0.000000, offset: 14000.000000, driftRate: 0.000000},
	{atomic: Date.UTC(1976, JANUARY  , 1, 0, 0, 15,   0) + 0.000000, offset: 15000.000000, driftRate: 0.000000},
	{atomic: Date.UTC(1977, JANUARY  , 1, 0, 0, 16,   0) + 0.000000, offset: 16000.000000, driftRate: 0.000000},
	{atomic: Date.UTC(1978, JANUARY  , 1, 0, 0, 17,   0) + 0.000000, offset: 17000.000000, driftRate: 0.000000},
	{atomic: Date.UTC(1979, JANUARY  , 1, 0, 0, 18,   0) + 0.000000, offset: 18000.000000, driftRate: 0.000000},
	{atomic: Date.UTC(1980, JANUARY  , 1, 0, 0, 19,   0) + 0.000000, offset: 19000.000000, driftRate: 0.000000},
	{atomic: Date.UTC(1981, JULY     , 1, 0, 0, 20,   0) + 0.000000, offset: 20000.000000, driftRate: 0.000000},
	{atomic: Date.UTC(1982, JULY     , 1, 0, 0, 21,   0) + 0.000000, offset: 21000.000000, driftRate: 0.000000},
	{atomic: Date.UTC(1983, JULY     , 1, 0, 0, 22,   0) + 0.000000, offset: 22000.000000, driftRate: 0.000000},
	{atomic: Date.UTC(1985, JULY     , 1, 0, 0, 23,   0) + 0.000000, offset: 23000.000000, driftRate: 0.000000},
	{atomic: Date.UTC(1988, JANUARY  , 1, 0, 0, 24,   0) + 0.000000, offset: 24000.000000, driftRate: 0.000000},
	{atomic: Date.UTC(1990, JANUARY  , 1, 0, 0, 25,   0) + 0.000000, offset: 25000.000000, driftRate: 0.000000},
	{atomic: Date.UTC(1991, JANUARY  , 1, 0, 0, 26,   0) + 0.000000, offset: 26000.000000, driftRate: 0.000000},
	{atomic: Date.UTC(1992, JULY     , 1, 0, 0, 27,   0) + 0.000000, offset: 27000.000000, driftRate: 0.000000},
	{atomic: Date.UTC(1993, JULY     , 1, 0, 0, 28,   0) + 0.000000, offset: 28000.000000, driftRate: 0.000000},
	{atomic: Date.UTC(1994, JULY     , 1, 0, 0, 29,   0) + 0.000000, offset: 29000.000000, driftRate: 0.000000},
	{atomic: Date.UTC(1996, JANUARY  , 1, 0, 0, 30,   0) + 0.000000, offset: 30000.000000, driftRate: 0.000000},
	{atomic: Date.UTC(1997, JULY     , 1, 0, 0, 31,   0) + 0.000000, offset: 31000.000000, driftRate: 0.000000},
	{atomic: Date.UTC(1999, JANUARY  , 1, 0, 0, 32,   0) + 0.000000, offset: 32000.000000, driftRate: 0.000000},
	{atomic: Date.UTC(2006, JANUARY  , 1, 0, 0, 33,   0) + 0.000000, offset: 33000.000000, driftRate: 0.000000},
	{atomic: Date.UTC(2009, JANUARY  , 1, 0, 0, 34,   0) + 0.000000, offset: 34000.000000, driftRate: 0.000000},
	{atomic: Date.UTC(2012, JULY     , 1, 0, 0, 35,   0) + 0.000000, offset: 35000.000000, driftRate: 0.000000},
	{atomic: Date.UTC(2015, JULY     , 1, 0, 0, 36,   0) + 0.000000, offset: 36000.000000, driftRate: 0.000000},
	{atomic: Date.UTC(2017, JANUARY  , 1, 0, 0, 37,   0) + 0.000000, offset: 37000.000000, driftRate: 0.000000}
]);

module.exports.build = build;

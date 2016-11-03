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
			A is the `driftRate` in TAI milliseconds per UTC millisecond (or days per day),
			X is the number of number of UTC days since the Unix epoch, 1970-01-01 00:00:00 UTC
			B was the `offset` in milliseconds between TAI and UTC at that time.

		Note that just because the X starts at the Unix epoch does NOT indicate that the 
		linear relationship extends forward or backward to that instant; it begins at `atomic`
		and ends at the beginning of the next period.

		Since `atomic` is a 64-bit float, it cannot exactly represent the beginning of any
		period prior to 1972. Instead we use the *next lowest float*, which is not always the
		closest float.

		Ordinarily we would use a calculation to determine `unixStart` but since this yields
		very slight floating point errors it is safer to give this explicitly.
	*/
	{atomic: /* 1961-01-01 00:00:01.422818000 */ - 283996798577.18195, unixStart: /* 1961-01-01 00:00:00 */ - 283996800000, offset:  5682.770000, driftRate: 0.000000015},
	{atomic: /* 1961-08-01 00:00:01.647570000 */ - 265679998352.43   , unixStart: /* 1961-08-01 00:00:00 */ - 265680000000, offset:  5632.770000, driftRate: 0.000000015},
	{atomic: /* 1962-01-01 00:00:01.845858000 */ - 252460798154.142  , unixStart: /* 1962-01-01 00:00:00 */ - 252460800000, offset:  5127.848400, driftRate: 0.000000013},
	{atomic: /* 1963-11-01 00:00:02.697278800 */ - 194659197302.7212 , unixStart: /* 1963-11-01 00:00:00 */ - 194659200000, offset:  5227.848400, driftRate: 0.000000013},
	{atomic: /* 1964-01-01 00:00:02.765794000 */ - 189388797234.206  , unixStart: /* 1964-01-01 00:00:00 */ - 189388800000, offset:  5606.626000, driftRate: 0.000000015},
	{atomic: /* 1964-04-01 00:00:02.983730000 */ - 181526397016.27   , unixStart: /* 1964-04-01 00:00:00 */ - 181526400000, offset:  5706.626000, driftRate: 0.000000015},
	{atomic: /* 1964-09-01 00:00:03.282018000 */ - 168307196717.982  , unixStart: /* 1964-09-01 00:00:00 */ - 168307200000, offset:  5806.626000, driftRate: 0.000000015},
	{atomic: /* 1965-01-01 00:00:03.540130000 */ - 157766396459.87   , unixStart: /* 1965-01-01 00:00:00 */ - 157766400000, offset:  5906.626000, driftRate: 0.000000015},
	{atomic: /* 1965-03-01 00:00:03.716594000 */ - 152668796283.40598, unixStart: /* 1965-03-01 00:00:00 */ - 152668800000, offset:  6006.626000, driftRate: 0.000000015},
	{atomic: /* 1965-07-01 00:00:03.974706000 */ - 142127996025.29398, unixStart: /* 1965-07-01 00:00:00 */ - 142128000000, offset:  6106.626000, driftRate: 0.000000015},
	{atomic: /* 1965-09-01 00:00:04.155058000 */ - 136771195844.94199, unixStart: /* 1965-09-01 00:00:00 */ - 136771200000, offset:  6206.626000, driftRate: 0.000000015},
	{atomic: /* 1966-01-01 00:00:04.313170000 */ - 126230395686.82999, unixStart: /* 1966-01-01 00:00:00 */ - 126230400000, offset:  8100.082000, driftRate: 0.000000030},
	{atomic: /* 1968-02-01 00:00:06.185682000 */ -  60479993814.31799, unixStart: /* 1968-02-01 00:00:00 */ -  60480000000, offset:  8000.082000, driftRate: 0.000000030},

	// From this point onwards UTC and TAI seconds are precisely the same length, yielding a
	// drift rate of zero.
	{atomic: /* 1972-01-01 00:00:10.000000000 */    63072010000      , unixStart: /* 1972-01-01 00:00:00 */    63072000000, offset: 10000.000000, driftRate: 0.0000000000},
	{atomic: /* 1972-07-01 00:00:11.000000000 */    78796811000      , unixStart: /* 1972-07-01 00:00:00 */    78796800000, offset: 11000.000000, driftRate: 0.0000000000},
	{atomic: /* 1973-01-01 00:00:12.000000000 */    94694412000      , unixStart: /* 1973-01-01 00:00:00 */    94694400000, offset: 12000.000000, driftRate: 0.0000000000},
	{atomic: /* 1974-01-01 00:00:13.000000000 */   126230413000      , unixStart: /* 1974-01-01 00:00:00 */   126230400000, offset: 13000.000000, driftRate: 0.0000000000},
	{atomic: /* 1975-01-01 00:00:14.000000000 */   157766414000      , unixStart: /* 1975-01-01 00:00:00 */   157766400000, offset: 14000.000000, driftRate: 0.0000000000},
	{atomic: /* 1976-01-01 00:00:15.000000000 */   189302415000      , unixStart: /* 1976-01-01 00:00:00 */   189302400000, offset: 15000.000000, driftRate: 0.0000000000},
	{atomic: /* 1977-01-01 00:00:16.000000000 */   220924816000      , unixStart: /* 1977-01-01 00:00:00 */   220924800000, offset: 16000.000000, driftRate: 0.0000000000},
	{atomic: /* 1978-01-01 00:00:17.000000000 */   252460817000      , unixStart: /* 1978-01-01 00:00:00 */   252460800000, offset: 17000.000000, driftRate: 0.0000000000},
	{atomic: /* 1979-01-01 00:00:18.000000000 */   283996818000      , unixStart: /* 1979-01-01 00:00:00 */   283996800000, offset: 18000.000000, driftRate: 0.0000000000},
	{atomic: /* 1980-01-01 00:00:19.000000000 */   315532819000      , unixStart: /* 1980-01-01 00:00:00 */   315532800000, offset: 19000.000000, driftRate: 0.0000000000},
	{atomic: /* 1981-07-01 00:00:20.000000000 */   362793620000      , unixStart: /* 1981-07-01 00:00:00 */   362793600000, offset: 20000.000000, driftRate: 0.0000000000},
	{atomic: /* 1982-07-01 00:00:21.000000000 */   394329621000      , unixStart: /* 1982-07-01 00:00:00 */   394329600000, offset: 21000.000000, driftRate: 0.0000000000},
	{atomic: /* 1983-07-01 00:00:22.000000000 */   425865622000      , unixStart: /* 1983-07-01 00:00:00 */   425865600000, offset: 22000.000000, driftRate: 0.0000000000},
	{atomic: /* 1985-07-01 00:00:23.000000000 */   489024023000      , unixStart: /* 1985-07-01 00:00:00 */   489024000000, offset: 23000.000000, driftRate: 0.0000000000},
	{atomic: /* 1988-01-01 00:00:24.000000000 */   567993624000      , unixStart: /* 1988-01-01 00:00:00 */   567993600000, offset: 24000.000000, driftRate: 0.0000000000},
	{atomic: /* 1990-01-01 00:00:25.000000000 */   631152025000      , unixStart: /* 1990-01-01 00:00:00 */   631152000000, offset: 25000.000000, driftRate: 0.0000000000},
	{atomic: /* 1991-01-01 00:00:26.000000000 */   662688026000      , unixStart: /* 1991-01-01 00:00:00 */   662688000000, offset: 26000.000000, driftRate: 0.0000000000},
	{atomic: /* 1992-07-01 00:00:27.000000000 */   709948827000      , unixStart: /* 1992-07-01 00:00:00 */   709948800000, offset: 27000.000000, driftRate: 0.0000000000},
	{atomic: /* 1993-07-01 00:00:28.000000000 */   741484828000      , unixStart: /* 1993-07-01 00:00:00 */   741484800000, offset: 28000.000000, driftRate: 0.0000000000},
	{atomic: /* 1994-07-01 00:00:29.000000000 */   773020829000      , unixStart: /* 1994-07-01 00:00:00 */   773020800000, offset: 29000.000000, driftRate: 0.0000000000},
	{atomic: /* 1996-01-01 00:00:30.000000000 */   820454430000      , unixStart: /* 1996-01-01 00:00:00 */   820454400000, offset: 30000.000000, driftRate: 0.0000000000},
	{atomic: /* 1997-07-01 00:00:31.000000000 */   867715231000      , unixStart: /* 1997-07-01 00:00:00 */   867715200000, offset: 31000.000000, driftRate: 0.0000000000},
	{atomic: /* 1999-01-01 00:00:32.000000000 */   915148832000      , unixStart: /* 1999-01-01 00:00:00 */   915148800000, offset: 32000.000000, driftRate: 0.0000000000},
	{atomic: /* 2006-01-01 00:00:33.000000000 */  1136073633000      , unixStart: /* 2006-01-01 00:00:00 */  1136073600000, offset: 33000.000000, driftRate: 0.0000000000},
	{atomic: /* 2009-01-01 00:00:34.000000000 */  1230768034000      , unixStart: /* 2009-01-01 00:00:00 */  1230768000000, offset: 34000.000000, driftRate: 0.0000000000},
	{atomic: /* 2012-07-01 00:00:35.000000000 */  1341100835000      , unixStart: /* 2012-07-01 00:00:00 */  1341100800000, offset: 35000.000000, driftRate: 0.0000000000},
	{atomic: /* 2015-07-01 00:00:36.000000000 */  1435708836000      , unixStart: /* 2015-07-01 00:00:00 */  1435708800000, offset: 36000.000000, driftRate: 0.0000000000},
	{atomic: /* 2017-01-01 00:00:37.000000000 */  1483228837000      , unixStart: /* 2017-01-01 00:00:00 */  1483228800000, offset: 37000.000000, driftRate: 0.0000000000}
]);

module.exports.build = build;

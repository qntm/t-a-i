/**
  International Atomic Time incoming!
*/

'use strict'

const build = require('./build.js')

module.exports = build([
  /*
    Data from IERS/USNO, after a one-time calculation to put it in the format I needed.
    For each of these data points, `atomic` indicates the TAI time when modifications
    were applied to the relationship between UTC and TAI. `offset` and `driftRate`
    provide a linear relationship between TAI and UTC starting from that moment:

    TAI - UTC = AX + B, where:
      A is the `driftRate` in TAI milliseconds per UTC millisecond (or days per day),
      X is the number of number of UTC milliseconds since the Unix epoch, 1970-01-01 00:00:00 UTC
      B was the `offset` in milliseconds between TAI and UTC at that time.

    Note that just because the X starts at the Unix epoch does NOT indicate that the
    linear relationship extends forward or backward to that instant; it begins at `atomic`
    and ends at the beginning of the next period.

    Ranges should be considered inclusive-exclusive. Since `atomic` is a 64-bit float, it
    cannot exactly represent the beginning of any period prior to 1972. Instead we use the
    smallest float which is a member of this period.

    The same is true of `unixStart` and `unixEnd`. Ordinarily we would use a calculation
    to determine `unixStart` and `unixEnd`, but since this yields very slight floating
    point errors it is safer to give these explicitly. `unixStart` is the smallest Unix time
    which is a member of the block. `unixEnd` is the smallest Unix time which is AFTER the end
    of it.
  */
  {atomic: /* 1961-01-01 00:00:01.422818  = -283996798577.1820 */ -283996798577.18194580078125, unixStart: /* 1961-01-01 00:00:00 */ -283996800000, unixEnd: /* 1961-07-31 23:59:59.950000749999988750000168749997468750038    */ -265680000049.999969482421875, offset: 5682.77, driftRate: 0.000000015},
  {atomic: /* 1961-08-01 00:00:01.64757   = -265679998352.4300 */ -265679998352.42999267578125, unixStart: /* 1961-08-01 00:00:00 */ -265680000000, unixEnd: /* 1962-01-01 00:00:00                                            */ -252460800000, offset: 5632.77, driftRate: 0.000000015},
  {atomic: /* 1962-01-01 00:00:01.845858  = -252460798154.1420 */ -252460798154.141998291015625, unixStart: /* 1962-01-01 00:00:00 */ -252460800000, unixEnd: /* 1963-11-01 00:00:00.09999999870000001689999978030000285609996  */ -194659199900, offset: 5127.8484, driftRate: 0.000000013},
  {atomic: /* 1963-11-01 00:00:02.6972788 = -194659197302.7212 */ -194659197302.72119140625, unixStart: /* 1963-11-01 00:00:00 */ -194659200000, unixEnd: /* 1964-01-01 00:00:00                                            */ -189388800000, offset: 5227.8484, driftRate: 0.000000013},
  {atomic: /* 1964-01-01 00:00:02.765794  = -189388797234.2060 */ -189388797234.20599365234375, unixStart: /* 1964-01-01 00:00:00 */ -189388800000, unixEnd: /* 1964-04-01 00:00:00.099999998500000022499999662500005062499924 */ -181526399900, offset: 5606.626, driftRate: 0.000000015},
  {atomic: /* 1964-04-01 00:00:02.98373   = -181526397016.2700 */ -181526397016.269989013671875, unixStart: /* 1964-04-01 00:00:00 */ -181526400000, unixEnd: /* 1964-09-01 00:00:00.099999998500000022499999662500005062499924 */ -168307199900, offset: 5706.626, driftRate: 0.000000015},
  {atomic: /* 1964-09-01 00:00:03.282018  = -168307196717.9820 */ -168307196717.98199462890625, unixStart: /* 1964-09-01 00:00:00 */ -168307200000, unixEnd: /* 1965-01-01 00:00:00.099999998500000022499999662500005062499924 */ -157766399900, offset: 5806.626, driftRate: 0.000000015},
  {atomic: /* 1965-01-01 00:00:03.54013   = -157766396459.8700 */ -157766396459.8699951171875, unixStart: /* 1965-01-01 00:00:00 */ -157766400000, unixEnd: /* 1965-03-01 00:00:00.099999998500000022499999662500005062499924 */ -152668799900, offset: 5906.626, driftRate: 0.000000015},
  {atomic: /* 1965-03-01 00:00:03.716594  = -152668796283.4060 */ -152668796283.405975341796875, unixStart: /* 1965-03-01 00:00:00 */ -152668800000, unixEnd: /* 1965-07-01 00:00:00.099999998500000022499999662500005062499924 */ -142127999900, offset: 6006.626, driftRate: 0.000000015},
  {atomic: /* 1965-07-01 00:00:03.974706  = -142127996025.2940 */ -142127996025.293975830078125, unixStart: /* 1965-07-01 00:00:00 */ -142128000000, unixEnd: /* 1965-09-01 00:00:00.099999998500000022499999662500005062499924 */ -136771199900, offset: 6106.626, driftRate: 0.000000015},
  {atomic: /* 1965-09-01 00:00:04.155058  = -136771195844.9420 */ -136771195844.941986083984375, unixStart: /* 1965-09-01 00:00:00 */ -136771200000, unixEnd: /* 1966-01-01 00:00:00                                            */ -126230400000, offset: 6206.626, driftRate: 0.000000015},
  {atomic: /* 1966-01-01 00:00:04.31317   = -126230395686.8300 */ -126230395686.829986572265625, unixStart: /* 1966-01-01 00:00:00 */ -126230400000, unixEnd: /* 1968-01-31 23:59:59.90000000299999991000000269999991900000243  */ -60480000099.99999237060546875, offset: 8100.082, driftRate: 0.00000003},
  {atomic: /* 1968-02-01 00:00:06.185682  = - 60479993814.3180 */ -60479993814.3179931640625, unixStart: /* 1968-02-01 00:00:00 */ -60480000000, unixEnd: /* 1972-01-01 00:00:00.107757996767260096982197090534087283977381 */ 63072000107.75800323486328125, offset: 8000.082, driftRate: 0.00000003},

  // From this point onwards UTC and TAI seconds are precisely the same length, yielding a
  // drift rate of zero and neat precise integer calculations.
  {atomic: /* 1972-01-01 00:00:10 */   63072010000, offset: 10000},
  {atomic: /* 1972-07-01 00:00:11 */   78796811000, offset: 11000},
  {atomic: /* 1973-01-01 00:00:12 */   94694412000, offset: 12000},
  {atomic: /* 1974-01-01 00:00:13 */  126230413000, offset: 13000},
  {atomic: /* 1975-01-01 00:00:14 */  157766414000, offset: 14000},
  {atomic: /* 1976-01-01 00:00:15 */  189302415000, offset: 15000},
  {atomic: /* 1977-01-01 00:00:16 */  220924816000, offset: 16000},
  {atomic: /* 1978-01-01 00:00:17 */  252460817000, offset: 17000},
  {atomic: /* 1979-01-01 00:00:18 */  283996818000, offset: 18000},
  {atomic: /* 1980-01-01 00:00:19 */  315532819000, offset: 19000},
  {atomic: /* 1981-07-01 00:00:20 */  362793620000, offset: 20000},
  {atomic: /* 1982-07-01 00:00:21 */  394329621000, offset: 21000},
  {atomic: /* 1983-07-01 00:00:22 */  425865622000, offset: 22000},
  {atomic: /* 1985-07-01 00:00:23 */  489024023000, offset: 23000},
  {atomic: /* 1988-01-01 00:00:24 */  567993624000, offset: 24000},
  {atomic: /* 1990-01-01 00:00:25 */  631152025000, offset: 25000},
  {atomic: /* 1991-01-01 00:00:26 */  662688026000, offset: 26000},
  {atomic: /* 1992-07-01 00:00:27 */  709948827000, offset: 27000},
  {atomic: /* 1993-07-01 00:00:28 */  741484828000, offset: 28000},
  {atomic: /* 1994-07-01 00:00:29 */  773020829000, offset: 29000},
  {atomic: /* 1996-01-01 00:00:30 */  820454430000, offset: 30000},
  {atomic: /* 1997-07-01 00:00:31 */  867715231000, offset: 31000},
  {atomic: /* 1999-01-01 00:00:32 */  915148832000, offset: 32000},
  {atomic: /* 2006-01-01 00:00:33 */ 1136073633000, offset: 33000},
  {atomic: /* 2009-01-01 00:00:34 */ 1230768034000, offset: 34000},
  {atomic: /* 2012-07-01 00:00:35 */ 1341100835000, offset: 35000},
  {atomic: /* 2015-07-01 00:00:36 */ 1435708836000, offset: 36000},
  {atomic: /* 2017-01-01 00:00:37 */ 1483228837000, offset: 37000}
])

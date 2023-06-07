// Data from IERS/USNO.
// <http://hpiers.obspm.fr/eop-pc/earthor/utc/TAI-UTC_tab.html>
// <ftp://maia.usno.navy.mil/ser7/tai-utc.dat>

const JAN = 0
const FEB = 1
const MAR = 2
const APR = 3
const JUL = 6
const AUG = 7
const SEP = 8
const NOV = 10
const DEC = 11

// First column: Unix millisecond count when this relationship became effective
// Second column: TAI minus UTC in TAI seconds as of the root point
// Third column: "root" point in UTC days since MJD epoch, defaults to 0
// Fourth column: Drift rate in TAI seconds per UTC day, defaults to 0

export const taiData = [
  [Date.UTC(1961, JAN, 1), 1.422_818_0, 37_300, 0.001_296],
  [Date.UTC(1961, AUG, 1), 1.372_818_0, 37_300, 0.001_296], // 0.05 TAI seconds removed from UTC
  [Date.UTC(1962, JAN, 1), 1.845_858_0, 37_665, 0.001_123_2], // drift rate reduced, no discontinuity
  [Date.UTC(1963, NOV, 1), 1.945_858_0, 37_665, 0.001_123_2], // 0.1 TAI seconds added to UTC
  [Date.UTC(1964, JAN, 1), 3.240_130_0, 38_761, 0.001_296], // drift rate restored, no discontinuity
  [Date.UTC(1964, APR, 1), 3.340_130_0, 38_761, 0.001_296], // 0.1 TAI seconds added to UTC
  [Date.UTC(1964, SEP, 1), 3.440_130_0, 38_761, 0.001_296], // 0.1 TAI seconds added to UTC
  [Date.UTC(1965, JAN, 1), 3.540_130_0, 38_761, 0.001_296], // 0.1 TAI seconds added to UTC
  [Date.UTC(1965, MAR, 1), 3.640_130_0, 38_761, 0.001_296], // 0.1 TAI seconds added to UTC
  [Date.UTC(1965, JUL, 1), 3.740_130_0, 38_761, 0.001_296], // 0.1 TAI seconds added to UTC
  [Date.UTC(1965, SEP, 1), 3.840_130_0, 38_761, 0.001_296], // 0.1 TAI seconds added to UTC
  [Date.UTC(1966, JAN, 1), 4.313_170_0, 39_126, 0.002_592], // drift rate doubled, no discontinuity
  [Date.UTC(1968, FEB, 1), 4.213_170_0, 39_126, 0.002_592], // 0.1 TAI seconds removed from UTC
  [Date.UTC(1972, JAN, 1), 10], // 0.107_758 TAI seconds added to UTC, drift rate zeroed
  [Date.UTC(1972, JUL, 1), 11], // 1.0 seconds added to UTC
  [Date.UTC(1973, JAN, 1), 12], // etc.
  [Date.UTC(1974, JAN, 1), 13],
  [Date.UTC(1975, JAN, 1), 14],
  [Date.UTC(1976, JAN, 1), 15],
  [Date.UTC(1977, JAN, 1), 16],
  [Date.UTC(1978, JAN, 1), 17],
  [Date.UTC(1979, JAN, 1), 18],
  [Date.UTC(1980, JAN, 1), 19],
  [Date.UTC(1981, JUL, 1), 20],
  [Date.UTC(1982, JUL, 1), 21],
  [Date.UTC(1983, JUL, 1), 22],
  [Date.UTC(1985, JUL, 1), 23],
  [Date.UTC(1988, JAN, 1), 24],
  [Date.UTC(1990, JAN, 1), 25],
  [Date.UTC(1991, JAN, 1), 26],
  [Date.UTC(1992, JUL, 1), 27],
  [Date.UTC(1993, JUL, 1), 28],
  [Date.UTC(1994, JUL, 1), 29],
  [Date.UTC(1996, JAN, 1), 30],
  [Date.UTC(1997, JUL, 1), 31],
  [Date.UTC(1999, JAN, 1), 32],
  [Date.UTC(2006, JAN, 1), 33],
  [Date.UTC(2009, JAN, 1), 34],
  [Date.UTC(2012, JUL, 1), 35],
  [Date.UTC(2015, JUL, 1), 36],
  [Date.UTC(2017, JAN, 1), 37]
]

export const UNIX_START_MILLIS = taiData[0][0]

// Because we don't know whether or not a leap second will be inserted or removed at this time,
// the relationship between Unix time and TAI is unpredictable at or beyond this point.
// (This is the start of a possible smear.)
// Updating this value? Don't forget to update the README too!
export const UNIX_END_MILLIS = Date.UTC(2023, DEC, 31, 12, 0, 0, 0)

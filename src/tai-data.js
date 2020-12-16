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

// First column: Unix millisecond count when this relationship became effective
// Second column: TAI minus UTC in TAI picoseconds as of the root point
// Third column: "root" point in UTC days since MJD epoch, defaults to 0n
// Fourth column: Drift rate in TAI picoseconds per UTC day, defaults to 0n

module.exports = [
  [BigInt(Date.UTC(1961, JAN, 1)), 1_422_818_000_000n, 37_300n, 1_296_000_000n],
  [BigInt(Date.UTC(1961, AUG, 1)), 1_372_818_000_000n, 37_300n, 1_296_000_000n], // 0.05 TAI seconds removed from UTC
  [BigInt(Date.UTC(1962, JAN, 1)), 1_845_858_000_000n, 37_665n, 1_123_200_000n], // drift rate reduced, no discontinuity
  [BigInt(Date.UTC(1963, NOV, 1)), 1_945_858_000_000n, 37_665n, 1_123_200_000n], // 0.1 TAI seconds added to UTC
  [BigInt(Date.UTC(1964, JAN, 1)), 3_240_130_000_000n, 38_761n, 1_296_000_000n], // drift rate restored, no discontinuity
  [BigInt(Date.UTC(1964, APR, 1)), 3_340_130_000_000n, 38_761n, 1_296_000_000n], // 0.1 TAI seconds added to UTC
  [BigInt(Date.UTC(1964, SEP, 1)), 3_440_130_000_000n, 38_761n, 1_296_000_000n], // 0.1 TAI seconds added to UTC
  [BigInt(Date.UTC(1965, JAN, 1)), 3_540_130_000_000n, 38_761n, 1_296_000_000n], // 0.1 TAI seconds added to UTC
  [BigInt(Date.UTC(1965, MAR, 1)), 3_640_130_000_000n, 38_761n, 1_296_000_000n], // 0.1 TAI seconds added to UTC
  [BigInt(Date.UTC(1965, JUL, 1)), 3_740_130_000_000n, 38_761n, 1_296_000_000n], // 0.1 TAI seconds added to UTC
  [BigInt(Date.UTC(1965, SEP, 1)), 3_840_130_000_000n, 38_761n, 1_296_000_000n], // 0.1 TAI seconds added to UTC
  [BigInt(Date.UTC(1966, JAN, 1)), 4_313_170_000_000n, 39_126n, 2_592_000_000n], // drift rate doubled, no discontinuity
  [BigInt(Date.UTC(1968, FEB, 1)), 4_213_170_000_000n, 39_126n, 2_592_000_000n], // 0.1 TAI seconds removed from UTC
  [BigInt(Date.UTC(1972, JAN, 1)), 10_000_000_000_000n], // 0.107758 TAI seconds added to UTC, drift rate zeroed
  [BigInt(Date.UTC(1972, JUL, 1)), 11_000_000_000_000n], // 1.0 seconds added to UTC
  [BigInt(Date.UTC(1973, JAN, 1)), 12_000_000_000_000n], // etc.
  [BigInt(Date.UTC(1974, JAN, 1)), 13_000_000_000_000n],
  [BigInt(Date.UTC(1975, JAN, 1)), 14_000_000_000_000n],
  [BigInt(Date.UTC(1976, JAN, 1)), 15_000_000_000_000n],
  [BigInt(Date.UTC(1977, JAN, 1)), 16_000_000_000_000n],
  [BigInt(Date.UTC(1978, JAN, 1)), 17_000_000_000_000n],
  [BigInt(Date.UTC(1979, JAN, 1)), 18_000_000_000_000n],
  [BigInt(Date.UTC(1980, JAN, 1)), 19_000_000_000_000n],
  [BigInt(Date.UTC(1981, JUL, 1)), 20_000_000_000_000n],
  [BigInt(Date.UTC(1982, JUL, 1)), 21_000_000_000_000n],
  [BigInt(Date.UTC(1983, JUL, 1)), 22_000_000_000_000n],
  [BigInt(Date.UTC(1985, JUL, 1)), 23_000_000_000_000n],
  [BigInt(Date.UTC(1988, JAN, 1)), 24_000_000_000_000n],
  [BigInt(Date.UTC(1990, JAN, 1)), 25_000_000_000_000n],
  [BigInt(Date.UTC(1991, JAN, 1)), 26_000_000_000_000n],
  [BigInt(Date.UTC(1992, JUL, 1)), 27_000_000_000_000n],
  [BigInt(Date.UTC(1993, JUL, 1)), 28_000_000_000_000n],
  [BigInt(Date.UTC(1994, JUL, 1)), 29_000_000_000_000n],
  [BigInt(Date.UTC(1996, JAN, 1)), 30_000_000_000_000n],
  [BigInt(Date.UTC(1997, JUL, 1)), 31_000_000_000_000n],
  [BigInt(Date.UTC(1999, JAN, 1)), 32_000_000_000_000n],
  [BigInt(Date.UTC(2006, JAN, 1)), 33_000_000_000_000n],
  [BigInt(Date.UTC(2009, JAN, 1)), 34_000_000_000_000n],
  [BigInt(Date.UTC(2012, JUL, 1)), 35_000_000_000_000n],
  [BigInt(Date.UTC(2015, JUL, 1)), 36_000_000_000_000n],
  [BigInt(Date.UTC(2017, JAN, 1)), 37_000_000_000_000n]
]

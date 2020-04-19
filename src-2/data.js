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
// Third column: root point in UTC days since MJD epoch, defaults to 0n
// Fourth column: Drift rate in TAI picoseconds per UTC day, defaults to 0n

module.exports = [
  [BigInt(Date.UTC(1961, JAN, 1)), 1422818000000n, 37300n, 1296000000n],
  [BigInt(Date.UTC(1961, AUG, 1)), 1372818000000n, 37300n, 1296000000n],
  [BigInt(Date.UTC(1962, JAN, 1)), 1845858000000n, 37665n, 1123200000n],
  [BigInt(Date.UTC(1963, NOV, 1)), 1945858000000n, 37665n, 1123200000n],
  [BigInt(Date.UTC(1964, JAN, 1)), 3240130000000n, 38761n, 1296000000n],
  [BigInt(Date.UTC(1964, APR, 1)), 3340130000000n, 38761n, 1296000000n],
  [BigInt(Date.UTC(1964, SEP, 1)), 3440130000000n, 38761n, 1296000000n],
  [BigInt(Date.UTC(1965, JAN, 1)), 3540130000000n, 38761n, 1296000000n],
  [BigInt(Date.UTC(1965, MAR, 1)), 3640130000000n, 38761n, 1296000000n],
  [BigInt(Date.UTC(1965, JUL, 1)), 3740130000000n, 38761n, 1296000000n],
  [BigInt(Date.UTC(1965, SEP, 1)), 3840130000000n, 38761n, 1296000000n],
  [BigInt(Date.UTC(1966, JAN, 1)), 4313170000000n, 39126n, 2592000000n],
  [BigInt(Date.UTC(1968, FEB, 1)), 4213170000000n, 39126n, 2592000000n],
  [BigInt(Date.UTC(1972, JAN, 1)), 10000000000000n],
  [BigInt(Date.UTC(1972, JUL, 1)), 11000000000000n],
  [BigInt(Date.UTC(1973, JAN, 1)), 12000000000000n],
  [BigInt(Date.UTC(1974, JAN, 1)), 13000000000000n],
  [BigInt(Date.UTC(1975, JAN, 1)), 14000000000000n],
  [BigInt(Date.UTC(1976, JAN, 1)), 15000000000000n],
  [BigInt(Date.UTC(1977, JAN, 1)), 16000000000000n],
  [BigInt(Date.UTC(1978, JAN, 1)), 17000000000000n],
  [BigInt(Date.UTC(1979, JAN, 1)), 18000000000000n],
  [BigInt(Date.UTC(1980, JAN, 1)), 19000000000000n],
  [BigInt(Date.UTC(1981, JUL, 1)), 20000000000000n],
  [BigInt(Date.UTC(1982, JUL, 1)), 21000000000000n],
  [BigInt(Date.UTC(1983, JUL, 1)), 22000000000000n],
  [BigInt(Date.UTC(1985, JUL, 1)), 23000000000000n],
  [BigInt(Date.UTC(1988, JAN, 1)), 24000000000000n],
  [BigInt(Date.UTC(1990, JAN, 1)), 25000000000000n],
  [BigInt(Date.UTC(1991, JAN, 1)), 26000000000000n],
  [BigInt(Date.UTC(1992, JUL, 1)), 27000000000000n],
  [BigInt(Date.UTC(1993, JUL, 1)), 28000000000000n],
  [BigInt(Date.UTC(1994, JUL, 1)), 29000000000000n],
  [BigInt(Date.UTC(1996, JAN, 1)), 30000000000000n],
  [BigInt(Date.UTC(1997, JUL, 1)), 31000000000000n],
  [BigInt(Date.UTC(1999, JAN, 1)), 32000000000000n],
  [BigInt(Date.UTC(2006, JAN, 1)), 33000000000000n],
  [BigInt(Date.UTC(2009, JAN, 1)), 34000000000000n],
  [BigInt(Date.UTC(2012, JUL, 1)), 35000000000000n],
  [BigInt(Date.UTC(2015, JUL, 1)), 36000000000000n],
  [BigInt(Date.UTC(2017, JAN, 1)), 37000000000000n]
]

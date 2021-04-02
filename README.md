# t-a-i

Introduces [International Atomic Time (TAI)](https://en.wikipedia.org/wiki/International_Atomic_Time) milliseconds, and methods for converting these to and from conventional [Unix milliseconds](https://en.wikipedia.org/wiki/Unix_time).

**Unix time** tracks the number of elapsed UTC milliseconds since 1970-01-01 00:00:00 UTC, excluding [leap seconds](https://en.wikipedia.org/wiki/Leap_second). (Unix time can equally well be measured in seconds, but here we use milliseconds because this is how a JavaScript `Date` object works.)

Because Unix time ignores leap seconds, it is not generally possible to determine the *true* amount of elapsed time between any two Unix timestamps by simply subtracting one from the other. Equally, it is not safe to add a time interval to a Unix timestamp and expect to receive a new Unix timestamp which is separated from the first Unix timestamp by that interval. Results will be wrong by the number of leap seconds in the interval, which depends on when the interval started and ended.

**TAI milliseconds** tracks the number of elapsed TAI milliseconds since 1970-01-01 00:00:00 TAI. TAI does not have leap seconds. Using TAI, all of the above problems are easily solved as follows:

1. Convert your Unix milliseconds to TAI milliseconds.
2. Perform your arithmetic.
3. Convert the TAI results back to Unix time.

The relationship between TAI and UTC is well-defined as far back as 1 January 1961. Prior to 1 January 1972, the relationship was quite complex: TAI seconds were not the same length as UTC seconds; time was inserted in fractions of TAI seconds; time was sometimes removed; time was modified at the beginning of any month, not just January or July. `t-a-i` handles all of these conversions correctly and returns results accurate to the millisecond. `t-a-i` also provides methods for returning exact TAI picosecond counts, for cases where the TAI millisecond count would be inexact.

## Important note!

It is **strongly recommended** that you thoroughly unit test the behaviour of your code at leap second boundaries: before, during and after.

The nature of the relationship between Unix time and TAI means that conversions behave consistently for years on end, and then, during leap seconds, suddenly display very different behaviour, **sometimes throwing exceptions**. Not only that, leap seconds are commonly inserted on New Year's Eve, which is a very inopportune time to be dealing with this kind of bug!

At the time of writing,

* The most recent inserted leap second was at midnight UTC on 1 January 2017.
* The most recent removed time was 0.1 TAI seconds, removed at midnight UTC on 1 February 1968.

## Installation

```
npm install t-a-i
```

## Examples

Exactly how long was 1972?

```javascript
const tai = require("t-a-i")

const unixStart = Date.UTC(1972, 0, 1) // 63_072_000_000
const unixEnd   = Date.UTC(1973, 0, 1) // 94_694_400_000

console.log(unixEnd - unixStart)
// 31_622_400_000 milliseconds - wrong answer!

const atomicStart = tai.oneToOne.unixToAtomic(unixStart) // 63_072_010_000
const atomicEnd   = tai.oneToOne.unixToAtomic(unixEnd)   // 94_694_412_000

console.log(atomicEnd - atomicStart)
// 31_622_402_000 milliseconds - right, including two leap seconds!
```

What is the current offset between TAI and Unix time?

```javascript
const now = Date.now()
const offset = tai.oneToOne.unixToAtomic(now) - now

console.log(offset)
// 37_000 at the time of writing; TAI is 37 seconds ahead of Unix time
```

What was TAI, exactly, at the Unix epoch?

```javascript
tai.oneToOne.unixToAtomicPicos(0)
// 8_000_082_000_000n TAI picoseconds, i.e. 1970-01-01 00:00:08.000_082 TAI
```

Note! Use caution when constructing a `Date` object directly from a TAI millisecond count. A `Date` represents an instant in Unix time, not an instant in TAI, and the object's method names and method behaviours reflect this. Instead, consider using a [`TaiDate`](https://github.com/ferno/tai-date)!

## API

All methods throw exceptions if not passed an integer number of milliseconds.

Methods fail or return empty result sets if called with times before the beginning of TAI, which was, equivalently:

* 1961-01-01 00:00:00.000_000 UTC
* 1961-01-01 00:00:01.422_818 TAI
* -283_996_800_000.000 Unix time
* -283_996_798_577.182 TAI milliseconds

Note that for times prior to the beginning of 1972, TAI milliseconds and Unix milliseconds were not the same length.

### tai.oneToMany

These conversions treat the relationship between Unix and TAI as one-to-many. An instant in Unix time may correspond to 0, 1 or 2 instants in TAI. During an inserted leap second, Unix time **overruns, instantaneously backtracks, and repeats itself**.

#### tai.oneToMany.unixToAtomicPicos(unix: number): BigInt\[\]

Convert a number of Unix milliseconds to an array of possible TAI picosecond counts. Ordinarily, this array will have a single entry. If the Unix time falls during an inserted leap second, the array will have two entries. If the Unix time falls during a removed leap second, or prior to the beginning of TAI, the array will be empty.

```javascript
const unix = -157_766_399_910
// 1965-01-01 00:00:00.090 UTC

tai.oneToMany.unixToAtomicPicos(unix)
// [-157_766_396_469_869_998_650n, -157_766_396_369_869_998_650n]
// i.e. [1965-01-01 00:00:03.530_130_001_350 TAI, 1965-01-01 00:00:03.630_130_001_350 TAI]
```

#### tai.oneToMany.unixToAtomic(unix: number): number\[\]

As `tai.oneToMany.unixToAtomicPicos`, but return value is an array of integer TAI millisecond counts.

```javascript
const unix = 915_148_800_001
// 1999-01-01 00:00:00.001 UTC

tai.oneToMany.unixToAtomic(unix)
// [915_148_831_001, 915_148_832_001]
// i.e. [1999-01-01 00:00:31.001 TAI, 1999-01-01 00:00:32.001 TAI]
```

The conversion from picoseconds to milliseconds rounds fractional milliseconds towards negative infinity. Note that this rounding can result in values being omitted from the resulting array:

```javascript
const unix = -283_996_800_000
// i.e. 1961-01-01 00:00:00.000_000 UTC, the beginning of TAI

const atomicPicos = tai.oneToMany.unixToAtomicPicos(unix)
// [-283_996_798_577_182_000_000n]
// i.e. [1961-01-01 00:00:01.422_818 TAI]

const atomicMillis = tai.oneToMany.unixToAtomicMillis(unix)
// Returns an empty array [].
// The rounded TAI millisecond count would be -283_996_798_578,
// i.e. "1961-01-01 00:00:01.422_000 TAI", but that is before TAI began.
```

#### tai.oneToMany.atomicToUnix(atomic: number): number

Convert a number of TAI milliseconds to Unix milliseconds. Note that over the course of a leap second, two different instants in TAI may convert back to the same instant in Unix time.

```javascript
const atomic1 = 915_148_831_001 // 1999-01-01 00:00:31.001 TAI
const atomic2 = 915_148_832_001 // 1999-01-01 00:00:32.001 TAI

tai.oneToMany.atomicToUnix(atomic1)
// 915_148_800_001
// i.e. 1999-01-01 00:00:00.001 UTC

tai.oneToMany.atomicToUnix(atomic2)
// 915_148_800_001, same result
```

### tai.oneToOne

These conversions treat the relationship between Unix and TAI as one-to-one. An instant in Unix time corresponds to 1 instant in TAI. During an inserted leap second, Unix time **stalls for one second**.

#### tai.oneToOne.unixToAtomicPicos(unix: number): BigInt

Convert a number of Unix milliseconds to a number of TAI picoseconds. If the Unix time falls on a removed leap second, or prior to the beginning of TAI, we throw an exception.

```javascript
const unix = -157_766_399_910
// 1965-01-01 00:00:00.090 UTC

tai.oneToOne.unixToAtomicPicos(unix)
// -157_766_396_369_869_998_650n
// i.e. 1965-01-01 00:00:03.630_130_001_350 TAI
```

#### tai.oneToOne.unixToAtomic(unix: number): number

As `tai.oneToOne.unixToAtomicPicos`, but converts the picosecond count to milliseconds.

```javascript
const unix = 915_148_800_001
// 1999-01-01 00:00:00.001 UTC

tai.oneToOne.unixToAtomic(unix)
// 915_148_832_001
// i.e. 1999-01-01 00:00:32.001 TAI
```

Fractional milliseconds are rounded towards negative infinity. Note that this rounding can result in an exception being thrown:

```javascript
const unix = -283_996_800_000
// i.e. 1961-01-01 00:00:00.000_000 UTC, the beginning of TAI

const atomicPicos = tai.oneToOne.unixToAtomicPicos(unix)
// -283_996_798_577_182_000_000n
// i.e. 1961-01-01 00:00:01.422_818 TAI

const atomicMillis = tai.oneToMany.unixToAtomic(unix)
// Throws an exception.
// The rounded TAI millisecond count would be -283_996_798_578,
// i.e. "1961-01-01 00:00:01.422_000 TAI", which is before TAI began.
```

#### tai.oneToOne.atomicToUnix(atomic: number): number

Converts a number of TAI milliseconds back to Unix milliseconds. If the TAI time falls during the first part of an inserted leap second, we see that Unix time is stalled here.

```javascript
const atomic1 = 915_148_831_000 // 1999-01-01 00:00:31.000 TAI
const atomic2 = 915_148_831_001 // 1999-01-01 00:00:31.001 TAI
const atomic3 = 915_148_832_000 // 1999-01-01 00:00:32.000 TAI
const atomic4 = 915_148_832_001 // 1999-01-01 00:00:32.001 TAI

tai.oneToOne.atomicToUnix(atomic1)
tai.oneToOne.atomicToUnix(atomic2)
tai.oneToOne.atomicToUnix(atomic3)
// 915_148_800_000 in all cases
// i.e. 1999-01-01 00:00:00.000 UTC

tai.oneToOne.atomicToUnix(atomic4)
// 915_148_800_001
// i.e. 1999-01-01 00:00:00.001 UTC
```

## Background: TAI vs UTC vs Unix

The relationship between UTC and TAI starts at 00:00:00 UTC on 1 January 1961. The relationship has always been **[linear](https://en.wikipedia.org/wiki/Linear_function_(calculus))**, but the nature of the linear relationship has changed on various discrete occasions.

Raw data is provided by USNO (ftp://maia.usno.navy.mil/ser7/tai-utc.dat) or <a href="http://hpiers.obspm.fr/eop-pc/earthor/utc/TAI-UTC_tab.html">IERS</a>.

### 1961 to 1971 inclusive

When TAI was first defined:

```
1961 JAN  1 =JD 2437300.5  TAI-UTC=   1.4228180 S + (MJD - 37300.) X 0.001296 S
```

* `1961 JAN  1` (midnight) is the UTC time when this relationship became effective.
* `JD 2437300.5` is the [Julian date](https://en.wikipedia.org/wiki/Julian_day) when this relationship became effective. The Julian date is the number of UTC days elapsed since midday UTC on 24 November 4714 BCE (proleptic Gregorian calendar).
* `0.001296 S` is the *drift rate* between TAI and UTC in TAI seconds per UTC day. For each full UTC day which elapses, a full TAI day plus 0.001296 TAI seconds elapses, causing TAI to progressively pull ahead of UTC.
* `MJD` is the current Modified Julian date. The Modified Julian date is the Julian date minus 2_400_000.5, or equivalently the number of UTC days elapsed since midnight UTC on 17 November 1858.
* `37300.` is the Modified Julian date of some (essentially arbitrary) root point, in this case midnight UTC on 1 January 1961.
* So, `MJD - 37300.` is the number of UTC days since the root point.
* And `(MJD - 37300.) X 0.001296 S` is offset accrued since the root point, in TAI seconds.
* `1.4228180 S` is the absolute offset of TAI from UTC as of that root point, in TAI seconds.
* So, `1.4228180 S + (MJD - 37300.) X 0.001296 S` is the total offset between TAI and UTC in TAI seconds as of the current Modified Julian date.

From this we compute that initially, 1961-01-01 00:00:00.000_000 UTC was equal to 1961-01-01 00:00:01.422_818 TAI. After one (Modified) Julian day, TAI had pulled ahead by another 0.001_296 TAI seconds, so that 1961-01-02 00:00:00.000_000 UTC was equal to 1961-01-02 00:00:01.424_114 TAI.

This linear relationship was effective until the beginning of the next period (which we can compute as 1961-08-01 00:00:01.647_570 TAI), when the parameters were changed.

### Discontinuities

More often than not, changing the parameters of the linear relationship introduces a discontinuity between the current UTC time as of the end of one period and the current UTC time as of the beginning of the next period. This discontinuity causes UTC to apparently repeat itself or to skip time.

#### Example of inserted time

At 1965-01-01 00:00:03.540_130 TAI, the offset between TAI and UTC was increased by 0.1 TAI seconds, leaving all other parameters identical. At this instant, UTC jumped back 0.1 TAI seconds = 0.099_999_998_5... UTC seconds, from 1965-01-01 00:00:00.099_999_998_5... to 1965-01-01 00:00:00.000, and repeated that time. This means that e.g. 1965-01-01 00:00:00.05 UTC is ambiguous, and has two meanings in TAI.

Equivalently, we could say that the last minute of 1964 was 0.1 TAI seconds longer than normal, so UTC counted up as far as 1964-12-31 23:59:60.099_999_998_5... before advancing to 1965-01-01 00:00:00.000.

#### Example of removed time

At 1968-02-01 00:00:06.185_682 TAI, the offset between TAI and UTC was decreased by 0.1 TAI seconds, leaving all other parameters identical. At this instant, UTC jumped forward 0.1 TAI seconds = 0.099_999_997... UTC seconds, from 1968-01-31 23:59:59.900_000_002_9... to 1968-02-01 00:00:00.000, skipping the intervening time. This means that e.g. 1968-01-31 23:59:59:95 UTC never happened, and has no interpretation in TAI.

### 1972 onwards

Starting from midnight UTC on 1 January 1972, the relationship between TAI and UTC was simplified in several ways:

* A UTC second is the same length as a TAI second. The drift rate is fixed at 0. The relationship is no longer merely linear but constant. There is no real need to nominate a specific root point.
* The offset between TAI and UTC is always an integer number of seconds. It only ever changes by one full second at a time, referred to as a "leap second".
* The relationship only changes on 1 January or 1 July.

For example:

```
1972 JAN  1 =JD 2441317.5  TAI-UTC=  10.0       S + (MJD - 41317.) X 0.0      S
```

This indicates that 1972-01-01 00:00:00 UTC was 1972-01-01 00:00:10 TAI.

#### Example of inserted time

At 2015-07-01 00:00:36 TAI, the offset between TAI and UTC was increased by 1 second. At this instant, UTC jumped back 1 second from 2015-07-01 00:00:01 to 2015-07-01 00:00:00 and repeated that time. This means that e.g. 2015-07-01 00:00:00.5 UTC is ambiguous, and has two meanings in TAI: 2015-07-01 00:00:35.5 or 2015-07-01 00:00:36.5.

In fact, what we more normally say is that the last minute of June 2015 was 1 second longer than normal, so UTC counted up as far as 2015-06-30 23:59:60 before advancing to 2015-07-01 00:00:00.

#### Example of removed time

This has not happened since 1972, and is unlikely to ever happen.

### Unix time vs UTC

Unix time seems to be built around an assumption that UTC follows an idealised Gregorian calendar with no such discontinuities. Unix time counts the number of elapsed UTC milliseconds since the Unix epoch at, equivalently:

* 1970-01-01 00:00:00.000_000 UTC
* 1970-01-01 00:00:08.000_082 TAI
* 0.000 Unix time
* 8_000.082 TAI milliseconds

, not counting leap seconds. For example, 1999-01-01 00:00:00 UTC is 915_148_800_000 Unix milliseconds.

Unix time can be computed from any Gregorian calendar date and time using a relatively simple piece of arithmetic, and the reverse calculation is also simple. Unix time can be extended backwards to negative numbers.

Unix time therefore has the same issues as UTC when it comes to removed time; certain millisecond counts literally never happened. During inserted time, since Unix time is a simple real number, it can't express a time like "23:59:60", so it must overrun, then backtrack and repeat itself.

Ironically, TAI fits the description of an idealised Gregorian calendar much better. Applying the same arithmetic to a TAI date yields TAI time, which is the number of TAI milliseconds since 1970-01-01 00:00:00 TAI.

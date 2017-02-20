# t-a-i

Introduces [International Atomic Time (TAI)](https://en.wikipedia.org/wiki/International_Atomic_Time) milliseconds, and methods for converting these to and from conventional [Unix milliseconds](https://en.wikipedia.org/wiki/Unix_time).

**Unix time** tracks the number of elapsed UTC milliseconds since 1970-01-01 00:00:00 UTC, excluding [leap seconds](https://en.wikipedia.org/wiki/Leap_second). (Unix time can equally well be measured in seconds, but here we use milliseconds because this is how a JavaScript `Date` object works.)

Because Unix time ignores leap seconds, it is not generally possible to determine the *true* amount of elapsed time between any two Unix timestamps by simply subtracting one from the other. Equally, it is not safe to add or subtract time intervals to Unix timestamps and expect to receive a new Unix timestamp which is separated from the first Unix timestamp by that interval. Results will be wrong by the number of leap seconds in the interval, which depends on when the interval started and ended.

**TAI milliseconds** tracks the number of elapsed TAI milliseconds since 1970-01-01 00:00:00 TAI. TAI does not have leap seconds. All of the above problems are easily solved as follows:

1. Convert your Unix milliseconds to TAI milliseconds.
2. Perform your arithmetic.
3. Convert the TAI results back to Unix time.

The relationship between TAI and UTC is well-defined as far back as 1 January 1961. Prior to 1 January 1972, the relationship was quite complex: TAI seconds were not the same length as UTC seconds; time was inserted in fractions of TAI seconds; time was sometimes removed; time was modified at the beginning of any month, not just January or July. `t-a-i` handles all of these conversions correctly and returns results accurate to at least the millisecond.

## Installation

```
npm install t-a-i
```

## Examples

Exactly how long was 1972?

```javascript
var tai = require("t-a-i");

var unixStart = Date.UTC(1972, 0, 1); // 63072000000
var unixEnd   = Date.UTC(1973, 0, 1); // 94694400000

console.log(end - start);
// 31622400000 milliseconds - wrong answer!

var taiStart = tai.unixToAtomic(unixStart); // 63072010000
var taiEnd   = tai.unixToAtomic(unixEnd);   // 94694412000

console.log(taiEnd - taiStart);
// 31622402000 milliseconds - right, including two leap seconds!
```

What is the current offset between TAI and Unix time?

```javascript
var now = Date.now();
var offset = tai.unixToAtomic(now) - now;
// 37000 at the time of writing; TAI is 37 seconds ahead of Unix time
```

Note! Use caution when constructing a `Date` object directly from a TAI millisecond count. A `Date` represents an instant in Unix time, not an instant in TAI, and the object's method names and method behaviours reflect this. Instead, consider using a [`TaiDate`](https://github.com/ferno/tai-date)!

## API

### tai.unixToAtomic(unix)
Shorthand for `tai.convert.oneToOne.unixToAtomic(unix)`.

### tai.atomicToUnix(atomic)
Shorthand for `tai.convert.manyToOne.atomicToUnix(atomic)`.

### tai.convert

Object containing conversion methods, sorted by relationship model. All conversion methods throw an exception if the input or output is prior to the beginning of TAI, which was, equivalently:

* 1961-01-01 00:00:00.000000 UTC
* 1961-01-01 00:00:01.422818 TAI
* -283996800000.000 Unix time
* -283996798577.182 TAI milliseconds

### tai.convert.oneToMany

These methods treat the relationship between Unix time and TAI as one-to-many.

### tai.convert.oneToMany.unixToAtomic(unix)
Convert a number of Unix milliseconds to an array of possible TAI milliseconds counts. Ordinarily, this array will have a single entry. If the Unix time falls during an inserted leap second, the array will have two entries. If the Unix time falls during a removed leap second, the array will be empty.

```javascript
var unix = 915148800000;
// 1999-01-01 00:00:00 UTC

tai.convert.oneToMany.unixToAtomic(unix);
// [915148831000, 915148832000]
// i.e. [1999-01-01 00:00:31 TAI, 1999-01-01 00:00:32 TAI]
```

### tai.convert.oneToMany.atomicToUnix(atomic)
Convert a number of TAI milliseconds to Unix milliseconds. Note that over the course of a leap second, two instants in TAI may convert back to the same instant in Unix time.

```javascript
var atomic1 = 915148831000; // 1999-01-01 00:00:31 TAI
var atomic2 = 915148832000; // 1999-01-01 00:00:32 TAI

tai.convert.oneToMany.atomicToUnix(atomic1);
// 915148800000
// i.e. 1999-01-01 00:00:00 UTC

tai.convert.oneToMany.atomicToUnix(atomic2);
// 915148800000, same result
```

### tai.convert.oneToOne

These methods treat the relationship between Unix time and TAI as one-to-one. Ambiguity is not tolerated. Round trips always work.

### tai.convert.oneToOne.unixToAtomic(unix)
Convert a number of Unix milliseconds to a number of TAI milliseconds. If the Unix time falls on an inserted leap second, it corresponds to *two* TAI instants, so we return the later ("canonical") of the two. If the Unix time falls on a removed leap second, we throw an exception.

```javascript
var unix = 915148800000;
// 1999-01-01 00:00:00 UTC

tai.unixToAtomic(unix);
// 915148832000
// i.e. 1999-01-01 00:00:32 TAI
```

### tai.convert.oneToOne.atomicToUnix(atomic)
Convert a number of TAI milliseconds back to Unix milliseconds. If the TAI time falls during the first part of an inserted leap second, throw an exception.

```javascript
var atomic1 = 915148831000; // 1999-01-01 00:00:31 TAI
var atomic2 = 915148832000; // 1999-01-01 00:00:32 TAI

tai.convert.oneToOne.atomicToUnix(915148831000);
// throws exception

tai.convert.oneToOne.atomicToUnix(915148832000);
// 915148800000
// i.e. 1999-01-01 00:00:00 UTC
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
* `MJD` is the current Modified Julian date. The Modified Julian date is the Julian date minus 2400000.5, or equivalently the number of UTC days elapsed since midnight UTC on 17 November 1858.
* `37300.` is the Modified Julian date of some (essentially arbitrary) root point, in this case midnight UTC on 1 January 1961.
* So, `MJD - 37300.` is the number of UTC days since the root point.
* And `(MJD - 37300.) X 0.001296 S` is offset accrued since the root point.
* `1.4228180 S` is the absolute offset of TAI from UTC as of that root point, in TAI seconds.
* So, `1.4228180 S + (MJD - 37300.) X 0.001296 S` is the total offset between TAI and UTC in TAI seconds as of the current Modified Julian date.

From this we compute that initially, 1961-01-01 00:00:00.000000 UTC was equal to 1961-01-01 00:00:01.422818 TAI. After one (Modified) Julian day, TAI had pulled ahead by another 0.001296 TAI seconds, so that 1961-01-02 00:00:00.000000 UTC was equal to 1961-01-02 00:00:01.424114 TAI.

This linear relationship was effective until the beginning of the next period (which we can compute as 1961-08-01 00:00:01.647570 TAI), when the parameters were changed.

### Discontinuities

More often than not, changing the parameters of the linear relationship introduces a discontinuity between the current UTC time as of the end of one period and the current UTC time as of the beginning of the next period. This discontinuity causes UTC to apparently repeat itself or to skip time.

#### Example of inserted time

At 1965-01-01 00:00:03.540130 TAI, the offset between TAI and UTC was increased by 0.1 TAI seconds, leaving all other parameters identical. At this instant, UTC jumped back 0.1 TAI seconds = 0.0999999985... UTC seconds, from 1965-01-01 00:00:00.0999999985... to 1965-01-01 00:00:00.000, and repeated that time. This means that e.g. 1965-01-01 00:00:00.05 UTC is ambiguous, and has two meanings in TAI.

Equivalently, we could say that the last minute of 1964 was 0.1 TAI seconds longer than normal, so UTC counted up as far as 1964-12-31 23:59:60.0999999985... before advancing to 1965-01-01 00:00:00.000.

#### Example of removed time

At 1968-02-01 00:00:06.185682000 TAI, the offset between TAI and UTC was decreased by 0.1 TAI seconds, leaving all other parameters identical. At this instant, UTC jumped forward 0.1 TAI seconds = 0.099999997... UTC seconds, from 1968-01-31 23:59:59.9000000029... to 1968-02-01 00:00:00.000, skipping the intervening time. This means that e.g. 1968-01-31 23:59:59:95 UTC never happened, and has no interpretation in TAI.

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

* 1970-01-01 00:00:00.000000 UTC
* 1970-01-01 00:00:08.000082 TAI
* 0.000 Unix time
* 8000.082 TAI milliseconds

, not counting leap seconds. For example, 1999-01-01 00:00:00 UTC is 915148800000 Unix milliseconds.

Unix time can be computed from any Gregorian calendar date and time using a relatively simple piece of arithmetic, and the reverse calculation is also simple. Unix time can be extended backwards to negative numbers.

Unix time therefore has the same issues as UTC when it comes to removed time; certain millisecond counts literally never happened. During inserted time, since Unix time is a simple real number, it can't express a time like "23:59:60", so it simply overruns, then backtracks and repeats itself.

### TAI milliseconds

Ironically, TAI fits the description of an idealised Gregorian calendar much better. Applying the same arithmetic to a TAI date yields TAI time, which is the number of TAI milliseconds since 1970-01-01 00:00:00 TAI.

A one-time calculation using the Unix epoch as our new root yields this raw data:

| Starting from this Unix time | TAI - Unix =                                       | Notes                                                |
| ----------------------------:| --------------------------------------------------:| ---------------------------------------------------- |
|                -283996800000 | 0.000000015&nbsp;*&nbsp;Unix&nbsp;+&nbsp;5682.7700 | Beginning of TAI                                     |
|                -265680000000 | 0.000000015&nbsp;*&nbsp;Unix&nbsp;+&nbsp;5632.7700 | 0.05 TAI seconds removed from UTC                    |
|                -252460800000 | 0.000000013&nbsp;*&nbsp;Unix&nbsp;+&nbsp;5127.8484 | Drift rate reduced, no discontinuity in UTC          |
|                -194659200000 | 0.000000013&nbsp;*&nbsp;Unix&nbsp;+&nbsp;5227.8484 | 0.1 TAI seconds added to UTC                         |
|                -189388800000 | 0.000000015&nbsp;*&nbsp;Unix&nbsp;+&nbsp;5606.6260 | Drift rate restored, no discontinuity in UTC         |
|                -181526400000 | 0.000000015&nbsp;*&nbsp;Unix&nbsp;+&nbsp;5706.6260 | 0.1 TAI seconds added to UTC                         |
|                -168307200000 | 0.000000015&nbsp;*&nbsp;Unix&nbsp;+&nbsp;5806.6260 | 0.1 TAI seconds added to UTC                         |
|                -157766400000 | 0.000000015&nbsp;*&nbsp;Unix&nbsp;+&nbsp;5906.6260 | 0.1 TAI seconds added to UTC                         |
|                -152668800000 | 0.000000015&nbsp;*&nbsp;Unix&nbsp;+&nbsp;6006.6260 | 0.1 TAI seconds added to UTC                         |
|                -142128000000 | 0.000000015&nbsp;*&nbsp;Unix&nbsp;+&nbsp;6106.6260 | 0.1 TAI seconds added to UTC                         |
|                -136771200000 | 0.000000015&nbsp;*&nbsp;Unix&nbsp;+&nbsp;6206.6260 | 0.1 TAI seconds added to UTC                         |
|                -126230400000 | 0.000000030&nbsp;*&nbsp;Unix&nbsp;+&nbsp;8100.0820 | Drift rate doubled, no discontinuity in UTC          |
|                 -60480000000 | 0.000000030&nbsp;*&nbsp;Unix&nbsp;+&nbsp;8000.0820 | 0.1 TAI seconds removed from UTC                     | 
|                  63072010000 |                                         10000.0000 | 0.107758 TAI seconds added to UTC, drift rate zeroed |
|                  78796810000 |                                         11000.0000 | 1.0 seconds added to UTC                             |
|                  94694410000 |                                         12000.0000 | 1.0 seconds added to UTC                             |
|                 126230410000 |                                         13000.0000 | etc.                                                 |
|                 157766410000 |                                         14000.0000 |                                                      |
|                 189302410000 |                                         15000.0000 |                                                      |
|                 220924810000 |                                         16000.0000 |                                                      |
|                 252460810000 |                                         17000.0000 |                                                      |
|                 283996810000 |                                         18000.0000 |                                                      |
|                 315532810000 |                                         19000.0000 |                                                      |
|                 362793620000 |                                         20000.0000 |                                                      |
|                 394329620000 |                                         21000.0000 |                                                      |
|                 425865620000 |                                         22000.0000 |                                                      |
|                 489024020000 |                                         23000.0000 |                                                      |
|                 567993620000 |                                         24000.0000 |                                                      |
|                 631152020000 |                                         25000.0000 |                                                      |
|                 662688020000 |                                         26000.0000 |                                                      |
|                 709948820000 |                                         27000.0000 |                                                      |
|                 741484820000 |                                         28000.0000 |                                                      |
|                 773020820000 |                                         29000.0000 |                                                      |
|                 820454430000 |                                         30000.0000 |                                                      |
|                 867715230000 |                                         31000.0000 |                                                      |
|                 915148830000 |                                         32000.0000 |                                                      |
|                1136073630000 |                                         33000.0000 |                                                      |
|                1230768030000 |                                         34000.0000 |                                                      |
|                1341100830000 |                                         35000.0000 |                                                      |
|                1435708830000 |                                         36000.0000 |                                                      |
|                1483228830000 |                                         37000.0000 |                                                      |

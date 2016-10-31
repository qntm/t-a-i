# t-a-i

Introduces [International Atomic Time (TAI)](https://en.wikipedia.org/wiki/International_Atomic_Time) milliseconds, and methods for converting these to and from conventional [Unix milliseconds](https://en.wikipedia.org/wiki/Unix_time).

**Unix time** tracks the number of elapsed milliseconds since 1970-01-01 00:00:00 UTC, excluding [leap seconds](https://en.wikipedia.org/wiki/Leap_second). (Unix time can equally well be measured in seconds, but here we use milliseconds because this is how a JavaScript `Date` object works.)

**TAI milliseconds** tracks the number of elapsed milliseconds since 1970-01-01 00:00:00 TAI. TAI does not have leap seconds.

# Installation

```
npm install t-a-i
```

# Usage

```javascript
var tai = require("t-a-i");

tai.unixToAtomic(915148799000); // 915148830000
tai.atomicToUnix(915148830000); // 915148799000

var now = Date.now();
var offset = tai.unixToAtomic(now) - now;
// 36000 at the time of writing; TAI is 36 seconds ahead of Unix
```

More powerful conversion methods are also provided, see below.

## Background: UTC vs Unix time vs TAI (1972 to present)

Here's what happened over the course of the inserted leap second of 31 December 1998 (h/t Wikipedia):

| UTC                          | Unix time                    | Unix milliseconds | TAI                          | TAI milliseconds | TAI - Unix |
| ---------------------------- | ---------------------------- | ----------------- | ---------------------------- | ---------------- | ---------- |
| 1998‑12‑31&nbsp;23:59:58.750 | 1998‑12‑31&nbsp;23:59:58.750 |      915148798750 | 1999‑01‑01&nbsp;00:00:29.750 |     915148829750 |    31000ms |
| 1998‑12‑31&nbsp;23:59:59.000 | 1998‑12‑31&nbsp;23:59:59.000 |      915148799000 | 1999‑01‑01&nbsp;00:00:30.000 |     915148830000 |    31000ms |
| 1998‑12‑31&nbsp;23:59:59.250 | 1998‑12‑31&nbsp;23:59:59.250 |      915148799250 | 1999‑01‑01&nbsp;00:00:30.250 |     915148830250 |    31000ms |
| 1998‑12‑31&nbsp;23:59:59.500 | 1998‑12‑31&nbsp;23:59:59.500 |      915148799500 | 1999‑01‑01&nbsp;00:00:30.500 |     915148830500 |    31000ms |
| 1998‑12‑31&nbsp;23:59:59.750 | 1998‑12‑31&nbsp;23:59:59.750 |      915148799750 | 1999‑01‑01&nbsp;00:00:30.750 |     915148830750 |    31000ms |
| 1998‑12‑31&nbsp;23:59:60.000 | 1999‑01‑01&nbsp;00:00:00.000 |      915148800000 | 1999‑01‑01&nbsp;00:00:31.000 |     915148831000 |    31000ms |
| 1998‑12‑31&nbsp;23:59:60.250 | 1999‑01‑01&nbsp;00:00:00.250 |      915148800250 | 1999‑01‑01&nbsp;00:00:31.250 |     915148831250 |    31000ms |
| 1998‑12‑31&nbsp;23:59:60.500 | 1999‑01‑01&nbsp;00:00:00.500 |      915148800500 | 1999‑01‑01&nbsp;00:00:31.500 |     915148831500 |    31000ms |
| 1998‑12‑31&nbsp;23:59:60.750 | 1999‑01‑01&nbsp;00:00:00.750 |      915148800750 | 1999‑01‑01&nbsp;00:00:31.750 |     915148831750 |    31000ms |
| 1999‑01‑01&nbsp;00:00:00.000 | 1999‑01‑01&nbsp;00:00:00.000 |      915148800000 | 1999‑01‑01&nbsp;00:00:32.000 |     915148832000 |    32000ms |
| 1999‑01‑01&nbsp;00:00:00.250 | 1999‑01‑01&nbsp;00:00:00.250 |      915148800250 | 1999‑01‑01&nbsp;00:00:32.250 |     915148832250 |    32000ms |
| 1999‑01‑01&nbsp;00:00:00.500 | 1999‑01‑01&nbsp;00:00:00.500 |      915148800500 | 1999‑01‑01&nbsp;00:00:32.500 |     915148832500 |    32000ms |
| 1999‑01‑01&nbsp;00:00:00.750 | 1999‑01‑01&nbsp;00:00:00.750 |      915148800750 | 1999‑01‑01&nbsp;00:00:32.750 |     915148832750 |    32000ms |
| 1999‑01‑01&nbsp;00:00:01.000 | 1999‑01‑01&nbsp;00:00:01.000 |      915148801000 | 1999‑01‑01&nbsp;00:00:33.000 |     915148833000 |    32000ms |
| 1999‑01‑01&nbsp;00:00:01.250 | 1999‑01‑01&nbsp;00:00:01.250 |      915148801250 | 1999‑01‑01&nbsp;00:00:33.250 |     915148833250 |    32000ms |

See how UTC shows the leap second correctly as 23:59:60. Meanwhile, Unix time *shows an incorrect time* during the leap second; then it *undergoes a discontinuity* and *repeats itself*. Equally meanwhile, TAI just keeps counting, ignoring the leap second entirely.

If that had been a removed leap second, this is what would have happened instead:

| UTC                          | Unix time                    | Unix milliseconds | TAI                          | TAI milliseconds | TAI - Unix |
| ---------------------------- | ---------------------------- | ----------------- | ---------------------------- | ---------------- | ---------- |
| 1998‑12‑31&nbsp;23:59:58.750 | 1998‑12‑31&nbsp;23:59:58.750 |      915148798750 | 1999‑01‑01&nbsp;00:00:29.750 |     915148829750 |    31000ms |
| 1999‑01‑01&nbsp;00:00:00.000 | 1999‑01‑01&nbsp;00:00:00.000 |      915148800000 | 1999‑01‑01&nbsp;00:00:30.000 |     915148830000 |    30000ms |
| 1999‑01‑01&nbsp;00:00:00.250 | 1999‑01‑01&nbsp;00:00:00.250 |      915148800250 | 1999‑01‑01&nbsp;00:00:30.250 |     915148830250 |    30000ms |
| 1999‑01‑01&nbsp;00:00:00.500 | 1999‑01‑01&nbsp;00:00:00.500 |      915148800500 | 1999‑01‑01&nbsp;00:00:30.500 |     915148830500 |    30000ms |
| 1999‑01‑01&nbsp;00:00:00.750 | 1999‑01‑01&nbsp;00:00:00.750 |      915148800750 | 1999‑01‑01&nbsp;00:00:30.750 |     915148830750 |    30000ms |
| 1999‑01‑01&nbsp;00:00:01.000 | 1999‑01‑01&nbsp;00:00:01.000 |      915148801000 | 1999‑01‑01&nbsp;00:00:31.000 |     915148831000 |    30000ms |
| 1999‑01‑01&nbsp;00:00:01.250 | 1999‑01‑01&nbsp;00:00:01.250 |      915148801250 | 1999‑01‑01&nbsp;00:00:31.250 |     915148831250 |    30000ms |

See how UTC skips a second. 23:59:59 *never happened* - it is considered an invalid time of day on 1998-12-31, just as 25:98:66 would be. Meanwhile, Unix time has a one-second *discontinuity* - there is a full second of Unix times which strictly speaking do not exist, or, to look at it another way, overlap with the next second. And again, TAI just keeps counting.

Additionally, when TAI began at the beginning of 1972, it was already 10 seconds ahead of UTC:

| UTC                          | Unix time                    | Unix milliseconds | TAI                          | TAI milliseconds | TAI - Unix |
| ---------------------------- | ---------------------------- | ----------------- | ---------------------------- | ---------------- | ---------- |
| 1972‑01‑01&nbsp;00:00:00.000 | 1972‑01‑01&nbsp;00:00:00.000 |       63072000000 | 1972‑01‑01&nbsp;00:00:10.000 |      63072010000 |    10000ms |

As a result of these shenanigans, instants in TAI and instants in Unix time and are in a *one-to-many relationship*, and the offered APIs reflect this. This relationship can alternatively be viewed as *one-to-one* by eliminating some duplicate instants.

## APIs

### tai.leapSeconds
Returns an array of leap second objects. Each leap second has a property `atomic` which indicates the TAI time when the offset between TAI and Unix time changed, and the new offset. E.g. `{atomic: 78796811000, offset: 11000}` for the inserted leap second of 30 June 1972.

The first entry is `{atomic: 63072010000, offset: 10000}`, marking the beginning of TAI for our purposes.

### tai.unixToAtomic(unix)
Shorthand for `tai.convert.oneToOne.unixToAtomic(unix)`.

### tai.atomicToUnix(atomic)
Shorthand for `tai.convert.manyToOne.atomicToUnix(atomic)`.

### tai.convert

Object containing conversion methods, sorted by relationship model. All conversion methods throw an exception if the input or output is prior to the beginning of TAI.

### tai.convert.oneToMany

These methods treat the relationship between TAI and Unix time as one-to-many.

### tai.convert.oneToMany.unixToAtomic(unix)
Convert a number of Unix milliseconds to an array of possible TAI milliseconds counts. Ordinarily, this array will have a single entry. If the Unix time falls during an inserted leap second, the array will have two entries. If the Unix time falls during a removed leap second, the array will be empty.

```javascript
tai.convert.oneToMany.unixToAtomic(915148800000);
// [915148831000, 915148832000]
```

### tai.convert.oneToMany.atomicToUnix(atomic)
Convert a number of TAI milliseconds to Unix milliseconds. Note that over the course of a leap second, two instants in TAI may convert back to the same instant in Unix time.

```javascript
tai.convert.oneToMany.atomicToUnix(915148831000);
// 915148800000

tai.convert.oneToMany.atomicToUnix(915148832000);
// 915148800000
```

### tai.convert.oneToOne

These methods treat the relationship between Unix time and TAI as one-to-one. Ambiguity is not tolerated, round trips always work.

### tai.convert.oneToOne.unixToAtomic(unix)
Convert a number of Unix milliseconds to a number of TAI milliseconds. If the Unix time falls on an inserted leap second, it corresponds to *two* TAI instants, so we return the later ("canonical") of the two. If the Unix time falls on a removed leap second, we throw an exception.

```javascript
tai.unixToAtomic(915148800000);
// 915148832000
```

### tai.convert.oneToOne.atomicToUnix(atomic)
Convert a number of TAI milliseconds back to Unix milliseconds. If the TAI time falls during the first part of an inserted leap second, throw an exception.

```javascript
tai.convert.oneToOne.atomicToUnix(915148831000);
// throws exception

tai.convert.oneToOne.atomicToUnix(915148832000);
// 915148800000
```

### tai.build(leapSeconds)

`t-a-i` uses real-world data, but it also exposes a `build` method which can be used to construct atomic time standards with arbitrary combinations of leap seconds. This is useful because it means we can try out removed leap seconds too, which have never happened to date.

It also means we can build a more demonstrative example. Let's consider this odd hypothetical timeline of TAI and Unix milliseconds:

```javascript
var odd = tai.build([
	{
		atomic: 13, // first instant in TAI
		offset: 12  // initial offset of TAI from Unix time
	},
	{atomic: 16, offset: 13}, // inserted leap millisecond
	{atomic: 19, offset: 12}  // removed leap millisecond
]);
```

(Note that we can insert and remove arbitrary numbers of milliseconds, not just 1000 at a time.)

Timeline diagram:

```
                     start     insertion    removal
                      \/          \/          \/
TAI:                   [13][14][15][16][17][18][19][20][21][...]
Unix time: [...][-1][0][ 1][ 2][ 3][ 3][ 4][ 5][ 7][ 8][ 9][...]
```

* Unix time extends backwards basically forever.
* TAI, however, is not defined before a certain instant in Unix time.
* TAI is offset from Unix time at the instant when it begins.
* TAI is a fixture, it does not jump forwards or backwards, but increases smoothly and continuously.
* There is one inserted leap millisecond, which causes Unix time to jump backwards with respect to TAI, and repeat itself.
* There is also one removed leap millisecond, which causes Unix time to jump forwards with respect to TAI.
* Both Unix and TAI extend forwards basically forever.

One-to-many APIs:

```javascript
odd.convert.oneToMany.unixToAtomic(1); // [13]
odd.convert.oneToMany.unixToAtomic(3); // [15, 16]
odd.convert.oneToMany.unixToAtomic(6); // []

odd.convert.oneToMany.atomicToUnix(13); // 1
odd.convert.oneToMany.atomicToUnix(15); // 3
odd.convert.oneToMany.atomicToUnix(16); // 3
```

One-to-one APIs see the timeline more simply, like this:

```
                start     insertion    removal
                 \/          \/          \/
TAI:              [13][14][15][16][17][18][19][20][21][...]
Unix: [...][-1][0][ 1][ 2]    [ 3][ 4][ 5][ 7][ 8][ 9][...]
```

```javascript
odd.convert.oneToOne.unixToAtomic(1); // 13
odd.convert.oneToOne.unixToAtomic(3); // 16
odd.convert.oneToOne.unixToAtomic(6); // throws exception
o
odd.convert.oneToOne.atomicToUnix(13); // 1
odd.convert.oneToOne.atomicToUnix(15); // throws exception
```

## Note

Use caution when constructing a `Date` object from a TAI millisecond count. A `Date` represents an instant in Unix time, not an instant in TAI, and the object's method names and method behaviours reflect this.

Instead, use a [`TaiDate`](https://github.com/ferno/tai-date)!

## UTC vs Unix time vs TAI (1961 to 1971 inclusive)

The relationship between TAI and UTC (and hence Unix time) is well-defined as far back as 1961-01-01 00:00:00 UTC = 1961-01-01 00:00:01.422818 TAI, which for the purposes of this module is the beginning of TAI; conversions involving earlier times will fail.

Prior to 1972-01-01 00:00:00 UTC = 1972-01-01 00:00:10 TAI, the relationship between TAI and UTC was quite complex; TAI seconds were not the same length as UTC seconds, and the ratio of their lengths was modified periodically by small amounts, as was the absolute offset between the two. This can be seen in [this IERS listing of historic offsets between TAI and UTC](http://hpiers.obspm.fr/eop-pc/earthor/utc/TAI-UTC_tab.html) and this table provided by the US Naval Observatory (ftp://maia.usno.navy.mil/ser7/tai-utc.dat).

This module correctly handles conversions during this period, give or take some potential loss of precision due to floating point stuff - I think there's some room for improvement here. However, I believe conversions are accurate to the millisecond, which is close enough for jazz as far as JavaScript is concerned.

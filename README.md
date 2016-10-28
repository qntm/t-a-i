# t-a-i

Introduces International Atomic Time (TAI) milliseconds, and methods for converting these to and from conventional Unix milliseconds.

**Unix time** tracks the number of elapsed milliseconds since 1970-01-01 00:00:00 UTC, excluding leap seconds. (Unix time can equally well be measured in seconds, but here we use milliseconds because this is how a JavaScript `Date` object works.)

**TAI milliseconds** tracks the number of elapsed milliseconds since 1970-01-01 00:00:00 TAI. TAI does not have leap seconds.

Well... actually, TAI is not well-defined prior to 1972-01-01 00:00:00 Unix time = 1972-01-01 00:00:10 TAI, when TAI started. However, if we call this instant 63072010000 TAI milliseconds, the effective result is the same. But we have to be careful not to extend TAI backwards to before this instant.

```javascript
var tai = require("t-a-i");

tai.unixToAtomic(915148799000); // 915148831000
tai.atomicToUnix(915148831000); // 915148799000
```

More powerful conversion methods are also provided.

## Background: UTC vs Unix time vs TAI

Here's what happened over the course of the inserted leap second of 31 December 1998 (h/t Wikipedia):

| UTC                          | Unix time                    | Unix milliseconds | TAI                          | TAI milliseconds | TAI - Unix |
| ---------------------------- | ---------------------------- | ----------------- | ---------------------------- | ---------------- | ---------- |
| 1998‑12‑31&nbsp;23:59:58.750 | 1998‑12‑31&nbsp;23:59:58.750 |      915148798750 | 1999‑01‑01&nbsp;00:00:29.750 |     915148830750 |    32000ms |
| 1998‑12‑31&nbsp;23:59:59.000 | 1998‑12‑31&nbsp;23:59:59.000 |      915148799000 | 1999‑01‑01&nbsp;00:00:30.000 |     915148831000 |    32000ms |
| 1998‑12‑31&nbsp;23:59:59.250 | 1998‑12‑31&nbsp;23:59:59.250 |      915148799250 | 1999‑01‑01&nbsp;00:00:30.250 |     915148831250 |    32000ms |
| 1998‑12‑31&nbsp;23:59:59.500 | 1998‑12‑31&nbsp;23:59:59.500 |      915148799500 | 1999‑01‑01&nbsp;00:00:30.500 |     915148831500 |    32000ms |
| 1998‑12‑31&nbsp;23:59:59.750 | 1998‑12‑31&nbsp;23:59:59.750 |      915148799750 | 1999‑01‑01&nbsp;00:00:30.750 |     915148831750 |    32000ms |
| 1998‑12‑31&nbsp;23:59:60.000 | 1999‑01‑01&nbsp;00:00:00.000 |      915148800000 | 1999‑01‑01&nbsp;00:00:31.000 |     915148832000 |    32000ms |
| 1998‑12‑31&nbsp;23:59:60.250 | 1999‑01‑01&nbsp;00:00:00.250 |      915148800250 | 1999‑01‑01&nbsp;00:00:31.250 |     915148832250 |    32000ms |
| 1998‑12‑31&nbsp;23:59:60.500 | 1999‑01‑01&nbsp;00:00:00.500 |      915148800500 | 1999‑01‑01&nbsp;00:00:31.500 |     915148832500 |    32000ms |
| 1998‑12‑31&nbsp;23:59:60.750 | 1999‑01‑01&nbsp;00:00:00.750 |      915148800750 | 1999‑01‑01&nbsp;00:00:31.750 |     915148832750 |    32000ms |
| 1999‑01‑01&nbsp;00:00:00.000 | 1999‑01‑01&nbsp;00:00:00.000 |      915148800000 | 1999‑01‑01&nbsp;00:00:32.000 |     915148833000 |    33000ms |
| 1999‑01‑01&nbsp;00:00:00.250 | 1999‑01‑01&nbsp;00:00:00.250 |      915148800250 | 1999‑01‑01&nbsp;00:00:32.250 |     915148833250 |    33000ms |
| 1999‑01‑01&nbsp;00:00:00.500 | 1999‑01‑01&nbsp;00:00:00.500 |      915148800500 | 1999‑01‑01&nbsp;00:00:32.500 |     915148833500 |    33000ms |
| 1999‑01‑01&nbsp;00:00:00.750 | 1999‑01‑01&nbsp;00:00:00.750 |      915148800750 | 1999‑01‑01&nbsp;00:00:32.750 |     915148833750 |    33000ms |
| 1999‑01‑01&nbsp;00:00:01.000 | 1999‑01‑01&nbsp;00:00:01.000 |      915148801000 | 1999‑01‑01&nbsp;00:00:33.000 |     915148834000 |    33000ms |
| 1999‑01‑01&nbsp;00:00:01.250 | 1999‑01‑01&nbsp;00:00:01.250 |      915148801250 | 1999‑01‑01&nbsp;00:00:33.250 |     915148834250 |    33000ms |

See how UTC shows the leap second correctly as 23:59:60. Meanwhile, Unix time *shows an incorrect time* during the leap second; then it *undergoes a discontinuity* and *repeats itself*. Equally meanwhile, TAI just keeps counting, ignoring the leap second entirely.

If that had been a removed leap second, this is what would have happened instead:

| UTC                          | Unix time                    | Unix milliseconds | TAI                          | TAI milliseconds | TAI - Unix |
| ---------------------------- | ---------------------------- | ----------------- | ---------------------------- | ---------------- | ---------- |
| 1998‑12‑31&nbsp;23:59:58.750 | 1998‑12‑31&nbsp;23:59:58.750 |      915148798750 | 1999‑01‑01&nbsp;00:00:29.750 |     915148830750 |    32000ms |
| 1999‑01‑01&nbsp;00:00:00.000 | 1999‑01‑01&nbsp;00:00:00.000 |      915148800000 | 1999‑01‑01&nbsp;00:00:30.000 |     915148831000 |    31000ms |
| 1999‑01‑01&nbsp;00:00:00.250 | 1999‑01‑01&nbsp;00:00:00.250 |      915148800250 | 1999‑01‑01&nbsp;00:00:30.250 |     915148831250 |    31000ms |
| 1999‑01‑01&nbsp;00:00:00.500 | 1999‑01‑01&nbsp;00:00:00.500 |      915148800500 | 1999‑01‑01&nbsp;00:00:30.500 |     915148831500 |    31000ms |
| 1999‑01‑01&nbsp;00:00:00.750 | 1999‑01‑01&nbsp;00:00:00.750 |      915148800750 | 1999‑01‑01&nbsp;00:00:30.750 |     915148831750 |    31000ms |
| 1999‑01‑01&nbsp;00:00:01.000 | 1999‑01‑01&nbsp;00:00:01.000 |      915148801000 | 1999‑01‑01&nbsp;00:00:31.000 |     915148832000 |    31000ms |
| 1999‑01‑01&nbsp;00:00:01.250 | 1999‑01‑01&nbsp;00:00:01.250 |      915148801250 | 1999‑01‑01&nbsp;00:00:31.250 |     915148832250 |    31000ms |

See how UTC skips a second. 23:59:59 *never happened* - it is considered an invalid time of day on 1998-12-31, just as 25:98:66 would be. Meanwhile, Unix time has a one-second **discontinuity** - there is a full second of Unix times which strictly speaking do not exist, or, to look at it another way, overlap with the next second. And again, TAI just keeps counting.

Additionally, when TAI began at the beginning of 1972, it was already 10 seconds ahead of UTC:

| UTC                          | Unix time                    | Unix milliseconds | TAI                          | TAI milliseconds | TAI - Unix |
| ---------------------------- | ---------------------------- | ----------------- | ---------------------------- | ---------------- | ---------- |
| 1972‑01‑01&nbsp;00:00:00.000 | 1972‑01‑01&nbsp;00:00:00.000 |       63072000000 | 1972‑01‑01&nbsp;00:00:10.000 |      63072010000 |    10000ms |

As a result of these shenanigans, instants in Unix time and instants in TAI are in a *many-to-many relationship*.

* During an inserted leap second, a single instant Unix time (e.g. 1999-01-01 00:00:00.500) can be interpreted to mean either of two instants (1999-01-01 00:00:31.500 or 1999-01-01 00:00:32.500) in TAI. So, we should return an array of possibilities: usually one, but sometimes two.
* However, this relationship can be made many-to-one by considering one of the two results (the later one) to be *canonical*.
* Furthermore, this relationship can be made one-to-one by throwing an exception when we attempt to convert a non-canonical instant back.
* During a removed leap second, the same applies in reverse: a single instant in TAI (e.g. 1999-01-01 00:00:30.500 TAI) can be interpreted to mean either of two instants (1998-12-31 23:59:59.500 or 1999-01-01 00:00:00.500) in Unix time.

## APIs

### tai.earliestUnix
Returns `63072000000`, Unix time when TAI began (1972-01-01 00:00:00 Unix time).

### tai.earliestAtomic
Returns `63072010000`, TAI milliseconds when TAI began (1972-01-01 00:00:10 TAI).

### tai.initialOffset
Returns `10000`, the offset in milliseconds between TAI and Unix time when TAI began.

### tai.leapSeconds
Returns an array of leap second objects. Each leap second has a property `unix` which indicates the Unix time when the offset between TAI and Unix time changed, and the number of milliseconds by which the offset changed. E.g. `{unix: 78796801000, offset: 1000}` for the inserted leap second of 1 July 1972.

### tai.unixToAtomic(unix)
Shorthand for `tai.convert.manyToOne.unixToAtomic(unix)`.

### tai.atomicToUnix(atomic)
Shorthand for `tai.convert.manyToOne.atomicToUnix(atomic)`.

### tai.convert

Object containing conversion methods, sorted by relationship model.

#### tai.convert.manyToMany

These methods treat the relationship between Unix time and TAI as many-to-many. Ambiguity is handled by always returning an array of possibilities. This array usually contains a single element, but for a leap second, it may contain two elements. Also, several different inputs may result in the same output.

##### tai.convert.manyToMany.unixToAtomic(unix)
Convert a number of Unix milliseconds to an array of possible TAI milliseconds counts.

```javascript
tai.convert.manyToMany.unixToAtomic(915148800000);
// [915148832000, 915148833000]
```

##### tai.convert.manyToMany.atomicToUnix(atomic)
Convert a number of TAI milliseconds to an array of possible Unix milliseconds counts.

```javascript
tai.convert.manyToMany.atomicToUnix(915148832000);
// [915148800000]

tai.convert.manyToMany.atomicToUnix(915148833000);
// [915148800000], same result
```

#### tai.convert.manyToOne

These methods treat the relationship between Unix time and TAI as many-to-one in each direction. The result of a conversion is always a single possiblity. For a leap second, when the input is ambiguous, we return the "canonical" (later) of the two possibilities. However, distinct inputs may still result in the same output, and reversing a conversion does not always result in the same input.

##### tai.convert.manyToOne.unixToAtomic(unix)
Convert a number of Unix milliseconds to a number of TAI milliseconds. Note that over the course of a leap second, a single Unix instant can correspond to *two* TAI instants, so we return the later of the two.

```javascript
tai.unixToAtomic(915148800000);
// 915148833000
```

##### tai.convert.manyToOne.atomicToUnix(atomic)
Convert a number of TAI milliseconds to Unix milliseconds. Note that over the course of a leap second, two instants in TAI may convert back to the same instant in Unix time.

```javascript
tai.convert.manyToOne.atomicToUnix(915148832000);
// 915148800000

tai.convert.manyToOne.atomicToUnix(915148833000);
// 915148800000
```

#### tai.convert.oneToOne

These methods treat the relationship between Unix time and TAI as one-to-one. Ambiguity is not tolerated, round trips always work, any value which is not canonical causes an exception to be thrown.

##### tai.convert.oneToOne.unixToAtomic(unix)
```javascript
tai.convert.oneToOne.unixToAtomic(915148800000);
// 915148833000
```

##### tai.convert.oneToOne.atomicToUnix(atomic)
```javascript
tai.convert.oneToOne.atomicToUnix(915148832000);
// throws exception

tai.convert.oneToOne.atomicToUnix(915148833000);
// 915148800000
```

### tai.build(earliestUnix, initialOffset, leapSeconds)

`t-a-i` uses real-world data, but it also exposes a `build` method which can be used to construct atomic time standards with arbitrary combinations of leap seconds. This is useful because it means we can try out removed leap seconds too, which have never happened to date.

It also means we can build a more demonstrative example. Let's consider this odd hypothetical timeline of TAI and Unix milliseconds:

```javascript
var odd = tai.build(
	1,  // instant in Unix time when TAI started
	12, // initial offset of TAI from Unix time
	[
		{unix: 3, offset:  1}, // inserted leap millisecond
		{unix: 6, offset: -1}  // removed leap millisecond
	]
);
```

(Note that we can insert and remove arbitrary numbers of milliseconds, not just 1000 at a time.)

Timeline diagram:

```
                     start     insertion    removal
                      \/          \/          \/
TAI:                   [13][14][15][16][17][18][19][20][21][...]
Unix time: [...][-1][0][ 1][ 2][ 3][ 3][ 4][ 5]
                                           [ 6][ 7][ 8][ 9][...]
```

* Unix time extends backwards basically forever.
* TAI, however, is not defined before a certain instant in Unix time.
* TAI is offset from Unix time at the instant when it begins.
* TAI is a fixture, it does not jump forwards or backwards, but increases smoothly and continuously.
* There is one inserted leap millisecond, which causes Unix time to jump backwards with respect to TAI, and repeat itself.
* There is also one removed leap millisecond, which causes Unix time to jump forwards with respect to TAI, and overlap itself.
* Both Unix and TAI extend forwards basically forever.

Many-to-many APIs:

```javascript
odd.convert.manyToMany.atomicToUnix(13); // [1]
odd.convert.manyToMany.atomicToUnix(15); // [3]
odd.convert.manyToMany.atomicToUnix(16); // [3]
odd.convert.manyToMany.atomicToUnix(18); // [5, 6]

odd.convert.manyToMany.unixToAtomic(1); // [13]
odd.convert.manyToMany.unixToAtomic(3); // [15, 16]
odd.convert.manyToMany.unixToAtomic(5); // [18]
odd.convert.manyToMany.unixToAtomic(6); // [18]
```

Many-to-one APIs:

```javascript
odd.convert.manyToOne.atomicToUnix(13); // 1
odd.convert.manyToOne.atomicToUnix(15); // 3
odd.convert.manyToOne.atomicToUnix(16); // 3
odd.convert.manyToOne.atomicToUnix(18); // 6 (there is no way to return 5)

odd.convert.manyToOne.unixToAtomic(1); // 13
odd.convert.manyToOne.unixToAtomic(3); // 16 (there is no way to return 15)
odd.convert.manyToOne.unixToAtomic(5); // 18
odd.convert.manyToOne.unixToAtomic(6); // 18
```

One-to-one APIs see the timeline more simply, like this:

```
                start     insertion    removal
                 \/          \/          \/
TAI:              [13][14][15][16][17][18][19][20][21][...]
Unix: [...][-1][0][ 1][ 2]    [ 3][ 4]
                                      [ 6][ 7][ 8][ 9][...]
```

```javascript
odd.convert.oneToOne.atomicToUnix(13); // 1
odd.convert.oneToOne.atomicToUnix(15); // throws exception
odd.convert.oneToOne.atomicToUnix(16); // 3
odd.convert.oneToOne.atomicToUnix(18); // 6 (there is no way to return 5)

odd.convert.oneToOne.unixToAtomic(1); // 13
odd.convert.oneToOne.unixToAtomic(3); // 16 (there is no way to return 15)
odd.convert.oneToOne.unixToAtomic(5); // throws exception
odd.convert.oneToOne.unixToAtomic(6); // 18
```

## Note

Use caution when constructing a `Date` object from a TAI millisecond count. A `Date` represents an instant in Unix time, not an instant in TAI, and the object's method names and method behaviours reflect this.

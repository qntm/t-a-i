# t-a-i

Introduces [International Atomic Time (TAI)](https://en.wikipedia.org/wiki/International_Atomic_Time) milliseconds, and methods for converting these to and from conventional [Unix milliseconds](https://en.wikipedia.org/wiki/Unix_time).

**Unix time** tracks the number of elapsed UTC milliseconds since 1970-01-01 00:00:00 UTC, excluding [leap seconds](https://en.wikipedia.org/wiki/Leap_second). (Unix time can equally well be measured in seconds, but here we use milliseconds because this is how a JavaScript `Date` object works.)

Because Unix time ignores leap seconds, it is not generally possible to determine the *true* amount of elapsed time between any two Unix timestamps by simply subtracting one from the other. Equally, it is not safe to add a time interval to a Unix timestamp and expect to receive a new Unix timestamp which is separated from the first Unix timestamp by that interval. Results will be wrong by the number of leap seconds in the interval, which depends on when the interval started and ended.

**TAI milliseconds** track the number of elapsed TAI milliseconds since 1970-01-01 00:00:00 TAI. TAI does not have leap seconds. Using TAI, all of the above problems are easily solved as follows:

1. Convert your Unix milliseconds to TAI milliseconds.
2. Perform your arithmetic.
3. Convert the TAI results back to Unix time.

The relationship between TAI and UTC is well-defined as far back as 1 January 1961. Prior to 1 January 1972, the relationship was quite complex:

* TAI seconds were not the same length as UTC seconds
* time was inserted in fractions of TAI seconds
* time was sometimes removed
* time was modified at the beginning of any month, not just January or July

`t-a-i` handles all of these conversions correctly and returns results truncated to the millisecond.

### Modelling discontinuities

Official sources are generally inconsistent and unclear about exactly how the relationship between TAI and Unix time should be modelled during leap seconds and other discontinuities. Rather than nominate any specific model as authoritative, `t-a-i` provides access to all of them:

#### "Overrun" model

With this model, during inserted time, Unix time **overruns**. At the end of the inserted time, Unix time instantaneously backtracks, and then repeats itself. One instant in Unix time may therefore correspond to 0, 1 or 2 instants in TAI.

When time is removed, Unix time jumps forward discontinuously between one TAI instant and the next.

#### "Break" model

With this model, during inserted time, Unix time is **indeterminate**.

When time is removed, Unix time jumps forward discontinuously between one TAI instant and the next.

#### "Stall" model

With this model, during inserted time, Unix time **stalls**. One instant in Unix time may therefore correspond either to a single instant or a closed *range* of instants in TAI.

When time is removed, Unix time jumps forward discontinuously between one TAI instant and the next.

#### "Smear" model

With [this model](https://developers.google.com/time/smear), both inserted time and removed time are handled by **smearing** the discontinuity out over 24 Unix hours, starting 12 hours prior to the discontinuity and ending 12 hours after the discontinuity. For a typical leap second, this means Unix time runs very slightly slower than normal from midday to midday, so that 86,400,000 Unix milliseconds take 86,401,000 TAI milliseconds to elapse.

#### Comparison of models

None these proposed/implied models are perfect; each has its own disadvantages, marked with ❌:

| Disadvantage | "Overrun" model | "Break" model | "Stall" model | ["Smear" model](https://developers.google.com/time/smear) |
| :--- | --- | --- | --- | --- |
| TAI time can convert to `NaN` in Unix |  | ❌ |  |  |
| Unix time can convert to `NaN` in TAI | ❌ | ❌ | ❌ |  |
| Unix time can be ambiguous (two TAI times map to the same Unix time) | ❌ |  | ❌ |  |
| Unix time can run backwards | ❌ |  |  |  |
| Unix seconds vary in length\* |  |  |  | ❌ |
| Fractions of seconds can disagree between Unix and TAI\* |  |  |  | ❌ |

\* From 1972 onwards. All models have this disadvantage prior to 1972.

## Examples

Exactly how long was 1972?

```javascript
import { TaiConverter, MODELS } from 't-a-i'

const unixStart = Date.UTC(1972, 0, 1) // 63_072_000_000
const unixEnd   = Date.UTC(1973, 0, 1) // 94_694_400_000

console.log(unixEnd - unixStart)
// 31_622_400_000 milliseconds - wrong answer!

const taiConverter = TaiConverter(MODELS.STALL)
const atomicStart = taiConverter.unixToAtomic(unixStart) // 63_072_010_000
const atomicEnd   = taiConverter.unixToAtomic(unixEnd)   // 94_694_412_000

console.log(atomicEnd - atomicStart)
// 31_622_402_000 milliseconds - right, including two leap seconds!
```

What is the current offset between TAI and Unix time?

```javascript
const now = Date.now()
const offset = taiConverter.unixToAtomic(now) - now

console.log(offset)
// 37_000 at the time of writing; TAI is 37 seconds ahead of Unix time
```

What was TAI at the Unix epoch?

```javascript
taiConverter.unixToAtomic(0)
// 8_000, i.e. 1970-01-01 00:00:08.000_082 TAI, truncated to the millisecond
```

## Important notes!

### Unit test your code

It is **strongly recommended** that you thoroughly unit test the behaviour of your code at leap second boundaries: before, during and after.

The nature of the relationship between Unix time and TAI - no matter how it is modelled - means that conversions behave consistently for years on end, and then, during leap seconds, suddenly display very different behaviour, **sometimes returning `NaN`**. Not only that, leap seconds are commonly inserted on New Year's Eve, which is a very inopportune time to be dealing with this kind of bug!

For your reference, at the time of writing:

* The most recent inserted leap second was added at the very end of 31 December 2016.
* The most recent removed time was 0.1 TAI seconds, removed from the very end of 31 January 1968.

### Validity for the future

Leap seconds (or the lack thereof) are announced in the International Earth Rotation and Reference Systems Service (IERS)'s six-monthly Bulletin C. For example, at the time of writing, [the latest such bulletin](https://datacenter.iers.org/data/16/bulletinc-069.txt) was published on 6 January 2025 and announced that there will be no leap second at the end of June 2025. This means that `t-a-i`'s calculations are guaranteed to be correct up to, but not including, the *next* potential leap second, which in this case is at the end of December 2025. At or beyond this point, the introduction of leap seconds cannot be predicted in advance, and the correctness of `t-a-i`'s behaviour cannot be guaranteed.

As a result, `t-a-i`'s behaviour beyond the next-but-one (possible) leap second is considered to be undefined. Updates to the source data when new leap seconds are announced will not be considered breaking changes, and will not incur a major version bump.

### JavaScript `Date`s should not be used to represent instants in TAI

It's not recommended to construct a `Date` object directly from a TAI millisecond count.

```js
// bad code, don't do this
const taiDate = new Date(taiConverter.unixToAtomic(unixDate.getTime()))
```

This is because `Date` represents an instant in Unix time, not an instant in TAI. The `Date` object's [method names and method behaviours](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) reflect this.

Instead, consider using a [`TaiDate`](https://github.com/ferno/tai-date)!

```js
// do this instead
import { TaiDate } from 'tai-date'
const taiDate = new TaiDate(taiConverter.unixToAtomic(unixDate.getTime())
```

## Installation

```
npm install t-a-i
```

## API

### UNIX_START

This constant is the Unix millisecond count at the beginning of TAI, which was, equivalently:

* 1961-01-01 00:00:00.000_000 UTC
* 1961-01-01 00:00:01.422_818 TAI
* -283_996_800_000.000 Unix time
* -283_996_798_577.182 TAI milliseconds

Conversions generally return `NaN` when the input Unix or TAI instant is before this.

### UNIX_END

This constant is the Unix millisecond count when the next possible leap second may or may not occur. `t-a-i`'s behaviour at or beyond this point in time is considered to be undefined.

### MODELS

This object contains constants corresponding to different possible models of the relationship between TAI and Unix time (see above). Pass one of these constants to the TaiConverter constructor:

#### MODELS.OVERRUN
#### MODELS.BREAK
#### MODELS.STALL
#### MODELS.SMEAR

### TaiConverter(model)

Returns a TAI/Unix converter object whose conversions obey the specified model. All `TaiConverter` objects provide the same methods, `unixToAtomic` and `atomicToUnix`, but they differ in what they return depending on the model used.

### taiConverter.atomicToUnix(atomic)

Throws unless `atomic` is an integer. Converts the input TAI millisecond count to a Unix millisecond count. Under normal circumstances this conversion returns a single integer. If the input is prior to the beginning of TAI, `NaN` is returned.

When Unix time is inserted,

* with the `OVERRUN` model, Unix time overruns and then backtracks. This means that sometimes two TAI millisecond counts convert to the same Unix millisecond count.
* with the `BREAK` model,  Unix time is indeterminate; `NaN` is returned.
* with the `STALL` model, Unix time stalls. This means that a whole range of TAI millisecond counts all convert to the same Unix millisecond count.
* with the `SMEAR` model, the discontinuity is smeared out from midday to midday across the discontinuity.

When Unix time is removed,

* with the `OVERRUN`, `BREAK` and `STALL` models, the returned Unix millisecond count jumps up discontinuously between input one TAI millisecond count and the next.
* with the `SMEAR` model, the discontinuity is smeared out from midday to midday across the discontinuity.

### taiConverter.unixToAtomic(unix[, options])

Throws unless `unix` is an integer. Converts the input Unix millisecond count to a TAI millisecond count. Under normal circumstances this conversion returns a single integer. If the input is prior to the beginning of TAI, `NaN` is returned.

When Unix time is inserted,

* with the `OVERRUN` model, one Unix millisecond count corresponds to two TAI millisecond counts. The latter of the two, after the inserted time, is returned.
* with the `BREAK` model, the input Unix millisecond count corresponds unambiguously to a TAI millisecond count time after the inserted time.
* with the `STALL` model, one particular input Unix millisecond count corresponds to a closed range of TAI millisecond counts. The last TAI millisecond count in the range, at the end of the inserted time, is returned.
* with the `SMEAR` model, the discontinuity is smeared out from midday to midday across the discontinuity.

When Unix time is removed,

* with the `OVERRUN`, `BREAK` and `STALL` models, some Unix millisecond counts never happened; `NaN` is returned.
* with the `SMEAR` model, the discontinuity is smeared out from midday to midday across the discontinuity.

#### Special options

With the `OVERRUN` model, you can do `taiConverter.unixToAtomic(unix, { array: true })` to receive an array of TAI millisecond counts. Normally this array has a single entry. If the input Unix millisecond count is prior to the beginning of TAI, or was removed, an empty array `[]` is returned. During inserted time, an array containing two entries is returned.

```javascript
import { TaiConverter, MODELS } from 't-a-i'

const taiConverter = TaiConverter(MODELS.OVERRUN)

const unix = 915_148_800_500
// 1999-01-01 00:00:00.500 UTC

taiConverter.unixToAtomic(unix)
// 915_148_832_500
// i.e. 1999-01-01 00:00:32.500 TAI

taiConverter.unixToAtomic(unix, { array: true })
// [915_148_831_500, 915_148_832_500]
// i.e. [1999-01-01 00:00:31.500 TAI, 1999-01-01 00:00:32.500 TAI]
```

With the `STALL` model, you can do `taiConverter.unixToAtomic(unix, { range: true })` to receive a closed range `[first, last]` of TAI millisecond counts. Normally `first` and `last` will be equal. If the input Unix millisecond count is prior to the beginning of TAI, or was removed, `[NaN, NaN]` is returned. During inserted time, Unix time stalls; if the input Unix millisecond count is precisely the value at which Unix time stalled, the array's entries indicate the first and last TAI millisecond counts in the stall.

```javascript
import { TaiConverter, MODELS } from 't-a-i'

const taiConverter = TaiConverter(MODELS.STALL)

const unix = 915_148_800_000
// 1999-01-01 00:00:00.000 UTC

taiConverter.unixToAtomic(unix)
// 915_148_832_000
// i.e. 1999-01-01 00:00:32.000 TAI

taiConverter.unixToAtomic(unix, { range: true })
// [915_148_831_000, 915_148_832_000]
// i.e. [1999-01-01 00:00:31.000 TAI, 1999-01-01 00:00:32.000 TAI]
```

### Nanoseconds API

All of the above works with integer numbers of TAI or Unix milliseconds. You can also work in nanoseconds:

```js
import { TaiConverter, MODELS, UNIX_START } from 't-a-i/nanos'

const taiConverter = TaiConverter(MODELS.STALL)

console.log(UNIX_START)
// -283_996_800_000_000_000 Unix nanoseconds

console.log(taiConverter.unixToAtomic(UNIX_START))
// -283_996_798_577_182_000 TAI nanoseconds
```

## Background: TAI vs UTC vs Unix

The relationship between UTC and TAI starts at 00:00:00 UTC on 1 January 1961. The relationship has always been [linear](https://en.wikipedia.org/wiki/Linear_function_(calculus)), but the nature of the linear relationship has changed on various discrete occasions.

Raw data is provided by USNO (ftp://maia.usno.navy.mil/ser7/tai-utc.dat) or <a href="http://hpiers.obspm.fr/eop-pc/earthor/utc/TAI-UTC_tab.html">IERS</a>.

### 1961 to 1971 inclusive

When TAI was first defined, it had the following relationship with UTC:

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

At 1965-01-01 00:00:03.540_130 TAI, the offset between TAI and UTC was increased by 0.1 TAI seconds, leaving all other parameters identical. At this instant, UTC jumped back 0.1 TAI seconds = 0.099_999_998_5... UTC seconds, from 1965-01-01 00:00:00.099_999_998_5... to 1965-01-01 00:00:00.000, and repeated that time. This means that a time like *e.g.* 1965-01-01 00:00:00.05 UTC is ambiguous, and has two meanings in TAI.

Equivalently, we could say that the last minute of 1964 was 0.1 TAI seconds longer than normal, so UTC counted up as far as 1964-12-31 23:59:60.099_999_998_5... before advancing to 1965-01-01 00:00:00.000.

#### Example of removed time

At 1968-02-01 00:00:06.185_682 TAI, the offset between TAI and UTC was decreased by 0.1 TAI seconds, leaving all other parameters identical. At this instant, UTC jumped forward 0.1 TAI seconds = 0.099_999_997... UTC seconds, from 1968-01-31 23:59:59.900_000_002_9... to 1968-02-01 00:00:00.000, skipping the intervening time. This means that a time like *e.g.* 1968-01-31 23:59:59:95 UTC never happened, and has no interpretation in TAI.

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

At 2015-07-01 00:00:36 TAI, the offset between TAI and UTC was increased by 1 second. At this instant, UTC jumped back 1 second from 2015-07-01 00:00:01 to 2015-07-01 00:00:00 and repeated that time. This means that a time like *e.g.* 2015-07-01 00:00:00.5 UTC is ambiguous, and has two meanings in TAI: 2015-07-01 00:00:35.5 or 2015-07-01 00:00:36.5.

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

Unix time therefore has the same issues as UTC when it comes to removed time; certain millisecond counts literally never happened. And during inserted time, since Unix time is a simple real number, it can't express a time like "23:59:60", so *something else must happen*.

Ironically, TAI fits the description of an idealised Gregorian calendar much better. Applying the same arithmetic to a TAI date yields TAI time, which is the number of TAI milliseconds since 1970-01-01 00:00:00 TAI.

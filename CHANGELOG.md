# CHANGELOG

## 3.0.x

Rather than `require('t-a-i')` returning a converter object, it now returns an object `tai` whose property `tai.Converter` must be called to create a converter object. It also returns an enumeration `INSERT_MODELS` whose properties `OVERRUN_ARRAY` and `STALL_LAST` which must be used to select the conversion model.

In general, `tai.oneToMany` is replaced with `Converter(INSERT_MODELS.OVERRUN_ARRAY)`, and `tai.oneToOne` is replaced with `Converter(INSERT_MODELS.STALL_LAST)` replaces `tai.oneToOne`.

## 2.1.x

`tai.oneToOne.atomicToUnix`'s behaviour has been changed to no longer throw exceptions in the event of trying to convert a "non-canonical" TAI millisecond count to Unix milliseconds. Instead, this conversion now behaves as if Unix time was paused during the inserted leap second. This more accurately reflects the assertion in the README that "Unix time ignores leap seconds". Documentation and unit tests have been updated accordingly.

## 2.0.x

Shorthand methods `tai.unixToAtomic` and `tai.atomicToUnix` have been removed; it's now required to explicitly choose either `tai.oneToMany` or `tai.oneToOne` when performing conversions.

All methods no longer either accept or return fractional input. Inputs must be integer numbers of milliseconds or an exception will be thrown. Return values will be integer milliseconds, with fractional results having been rounded down (towards negative infinity).

New methods `tai.oneToMany.unixToAtomicPicos` and `tai.oneToOne.unixToAtomicPicos` have been introduced. These return BigInt TAI picosecond counts which are always precise.

Internal logic for conversions prior to 1972 (variable-length Unix seconds) has been fine-tuned.

Support for Node.js 10 is dropped.

## 1.x.x

Initial release.

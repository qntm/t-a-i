# CHANGELOG

## 2.x.x

Shorthand methods `tai.unixToAtomic` and `tai.atomicToUnix` have been removed; it's now required to explicitly choose either `tai.oneToMany` or `tai.oneToOne` when performing conversions.

All methods no longer either accept or return fractional input. Inputs must be integer numbers of milliseconds or an exception will be thrown. Return values will be rounded to the millisecond.

Internal logic for conversions prior to 1972 (variable-length Unix seconds) has been fine-tuned.

## 1.x.x

Initial release.
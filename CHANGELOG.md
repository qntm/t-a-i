# CHANGELOG

## 5.0.0

Support for Node.js 18 and lower is dropped.

## 4.1.0

Added `t-a-i/nanos` support.

## 4.0.0

* `t-a-i` has dropped support for Node.js 14.
* `t-a-i` is now provided as [ECMAScript modules](https://nodejs.org/docs/latest/api/esm.html) (which use `import` and `export`), not [CommonJS modules](https://nodejs.org/docs/latest/api/modules.html) (which use `require` and `module.exports`).

## 3.0.x

`t-a-i`'s API has been completely overhauled. Code like:

```js
const tai = require('t-a-i')

console.log(tai.oneToMany.unixToAtomic(0))
console.log(tai.oneToMany.atomicToUnix(1000))

console.log(tai.oneToOne.unixToAtomic(2000))
console.log(tai.oneToOne.atomicToUnix(3000))
```

should be replaced with something like:

```js
const { TaiConverter, MODELS } = require('t-a-i')

const oneToMany = TaiConverter(MODELS.OVERRUN)
const oneToOne = TaiConverter(MODELS.STALL)

console.log(oneToMany.unixToAtomic(0, { array: true }))
console.log(oneToMany.atomicToUnix(1000))

console.log(oneToOne.unixToAtomic(2000))
console.log(oneToOne.atomicToUnix(3000))
```

Other, more flexible models are now also provided. Check the new README for more information.

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

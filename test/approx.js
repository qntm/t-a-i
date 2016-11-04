"use strict";

var Approx = require("../src/approx.js");

// Basic float comparisons
console.log( Approx.eq(0, 0));
console.log(!Approx.eq(0, 1));
console.log(!Approx.eq(0, 2));
console.log(!Approx.eq(1, 0));
console.log( Approx.eq(1, 1));
console.log(!Approx.eq(1, 2));
console.log(!Approx.eq(2, 0));
console.log(!Approx.eq(2, 1));
console.log( Approx.eq(2, 2));

console.log(!Approx.ne(0, 0));
console.log( Approx.ne(0, 1));
console.log( Approx.ne(0, 2));
console.log( Approx.ne(1, 0));
console.log(!Approx.ne(1, 1));
console.log( Approx.ne(1, 2));
console.log( Approx.ne(2, 0));
console.log( Approx.ne(2, 1));
console.log(!Approx.ne(2, 2));

console.log(!Approx.lt(0, 0));
console.log( Approx.lt(0, 1));
console.log( Approx.lt(0, 2));
console.log(!Approx.lt(1, 0));
console.log(!Approx.lt(1, 1));
console.log( Approx.lt(1, 2));
console.log(!Approx.lt(2, 0));
console.log(!Approx.lt(2, 1));
console.log(!Approx.lt(2, 2));

console.log( Approx.le(0, 0));
console.log( Approx.le(0, 1));
console.log( Approx.le(0, 2));
console.log(!Approx.le(1, 0));
console.log( Approx.le(1, 1));
console.log( Approx.le(1, 2));
console.log(!Approx.le(2, 0));
console.log(!Approx.le(2, 1));
console.log( Approx.le(2, 2));

console.log(!Approx.gt(0, 0));
console.log(!Approx.gt(0, 1));
console.log(!Approx.gt(0, 2));
console.log( Approx.gt(1, 0));
console.log(!Approx.gt(1, 1));
console.log(!Approx.gt(1, 2));
console.log( Approx.gt(2, 0));
console.log( Approx.gt(2, 1));
console.log(!Approx.gt(2, 2));

console.log( Approx.ge(0, 0));
console.log(!Approx.ge(0, 1));
console.log(!Approx.ge(0, 2));
console.log( Approx.ge(1, 0));
console.log( Approx.ge(1, 1));
console.log(!Approx.ge(1, 2));
console.log( Approx.ge(2, 0));
console.log( Approx.ge(2, 1));
console.log( Approx.ge(2, 2));

// Basic exact Approx comparisons, class methods
console.log( Approx.eq(Approx(0, Approx.EXACTLY), Approx(0, Approx.EXACTLY)));
console.log(!Approx.eq(Approx(0, Approx.EXACTLY), Approx(1, Approx.EXACTLY)));
console.log(!Approx.eq(Approx(0, Approx.EXACTLY), Approx(2, Approx.EXACTLY)));
console.log(!Approx.eq(Approx(1, Approx.EXACTLY), Approx(0, Approx.EXACTLY)));
console.log( Approx.eq(Approx(1, Approx.EXACTLY), Approx(1, Approx.EXACTLY)));
console.log(!Approx.eq(Approx(1, Approx.EXACTLY), Approx(2, Approx.EXACTLY)));
console.log(!Approx.eq(Approx(2, Approx.EXACTLY), Approx(0, Approx.EXACTLY)));
console.log(!Approx.eq(Approx(2, Approx.EXACTLY), Approx(1, Approx.EXACTLY)));
console.log( Approx.eq(Approx(2, Approx.EXACTLY), Approx(2, Approx.EXACTLY)));

console.log(!Approx.lt(Approx(0, Approx.EXACTLY), Approx(0, Approx.EXACTLY)));
console.log( Approx.lt(Approx(0, Approx.EXACTLY), Approx(1, Approx.EXACTLY)));
console.log( Approx.lt(Approx(0, Approx.EXACTLY), Approx(2, Approx.EXACTLY)));
console.log(!Approx.lt(Approx(1, Approx.EXACTLY), Approx(0, Approx.EXACTLY)));
console.log(!Approx.lt(Approx(1, Approx.EXACTLY), Approx(1, Approx.EXACTLY)));
console.log( Approx.lt(Approx(1, Approx.EXACTLY), Approx(2, Approx.EXACTLY)));
console.log(!Approx.lt(Approx(2, Approx.EXACTLY), Approx(0, Approx.EXACTLY)));
console.log(!Approx.lt(Approx(2, Approx.EXACTLY), Approx(1, Approx.EXACTLY)));
console.log(!Approx.lt(Approx(2, Approx.EXACTLY), Approx(2, Approx.EXACTLY)));

// Basic exact Approx comparisons, object methods
console.log( Approx(0, Approx.EXACTLY).eq(Approx(0, Approx.EXACTLY)));
console.log(!Approx(0, Approx.EXACTLY).eq(Approx(1, Approx.EXACTLY)));
console.log(!Approx(0, Approx.EXACTLY).eq(Approx(2, Approx.EXACTLY)));
console.log(!Approx(1, Approx.EXACTLY).eq(Approx(0, Approx.EXACTLY)));
console.log( Approx(1, Approx.EXACTLY).eq(Approx(1, Approx.EXACTLY)));
console.log(!Approx(1, Approx.EXACTLY).eq(Approx(2, Approx.EXACTLY)));
console.log(!Approx(2, Approx.EXACTLY).eq(Approx(0, Approx.EXACTLY)));
console.log(!Approx(2, Approx.EXACTLY).eq(Approx(1, Approx.EXACTLY)));
console.log( Approx(2, Approx.EXACTLY).eq(Approx(2, Approx.EXACTLY)));

console.log(!Approx(0, Approx.EXACTLY).lt(Approx(0, Approx.EXACTLY)));
console.log( Approx(0, Approx.EXACTLY).lt(Approx(1, Approx.EXACTLY)));
console.log( Approx(0, Approx.EXACTLY).lt(Approx(2, Approx.EXACTLY)));
console.log(!Approx(1, Approx.EXACTLY).lt(Approx(0, Approx.EXACTLY)));
console.log(!Approx(1, Approx.EXACTLY).lt(Approx(1, Approx.EXACTLY)));
console.log( Approx(1, Approx.EXACTLY).lt(Approx(2, Approx.EXACTLY)));
console.log(!Approx(2, Approx.EXACTLY).lt(Approx(0, Approx.EXACTLY)));
console.log(!Approx(2, Approx.EXACTLY).lt(Approx(1, Approx.EXACTLY)));
console.log(!Approx(2, Approx.EXACTLY).lt(Approx(2, Approx.EXACTLY)));

// Numbers between 0 and Number.EPSILON
var a = Approx(0, Approx.EXACTLY);
var b = Approx(0, Approx.BUT_HIGHER);
var c = Approx(Number.EPSILON, Approx.BUT_LOWER)
var d = Approx(Number.EPSILON, Approx.EXACTLY);

console.log( a.eq(a));
console.log(!a.eq(b));
console.log(!a.eq(c));
console.log(!a.eq(d));
console.log(!b.eq(a));
try { b.eq(b); console.log(false); } catch(e) { console.log(true); }
console.log(!b.eq(c));
console.log(!b.eq(d));
console.log(!c.eq(a));
console.log(!c.eq(b));
try { c.eq(c); console.log(false); } catch(e) { console.log(true); }
console.log(!c.eq(d));
console.log(!d.eq(a));
console.log(!d.eq(b));
console.log(!d.eq(c));
console.log( d.eq(d));

console.log(a.lt(b));
console.log(a.lt(c));
console.log(a.lt(d));
console.log(b.lt(c));
console.log(b.lt(d));
console.log(c.lt(d));

// Pi
var pi = Approx(Math.PI, Approx.BUT_HIGHER);
console.log(pi.ne(Math.PI));
console.log(pi.gt(Math.PI));
console.log(pi.ge(Math.PI));

console.log(Approx(0, Approx.EXACTLY).lt(Approx(0, Approx.BUT_HIGHER)));
console.log(Approx(-265679998352.43, Approx.BUT_LOWER).lt(Approx(-252460798154.142, Approx.BUT_LOWER)));

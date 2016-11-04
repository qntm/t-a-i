/**
	Is `x` less than π? `x < Math.PI` returns the wrong result for `x` equal to
	`Math.PI`, because `Math.PI` is strictly less than π.

	This module allows us to fix this:

		Approx.lt(x, Approx(Math.PI, Approx.BUT_HIGHER))
*/

"use strict";

/**
	Represents a specific real number which is (1) closer to `nearestFloat` than to
	any other float, but (2) either lower or higher than it (or exactly the same).
*/
var Approx = function(nearestFloat, actualValueIs) {
	var approx = {
		nearestFloat  : nearestFloat,
		actualValueIs : actualValueIs,
		toString      : function() {
			return "Approx(" + nearestFloat + ", " + actualValueIs.toString() + ")";
		}
	};

	["lt", "eq", "le", "ne", "ge", "gt"].forEach(function(op) {
		approx[op] = function(b) {
			return Approx[op](approx, b);
		}
	});

	return approx;
};

// EVery float has three regions around it:
Approx.BUT_LOWER   = {valueOf: function() { return -1}, toString: function() { return "Approx.BUT_LOWER"; }};
Approx.EXACTLY     = {valueOf: function() { return  0}, toString: function() { return "Approx.EXACTLY"; }};
Approx.BUT_HIGHER  = {valueOf: function() { return  1}, toString: function() { return "Approx.BUT_HIGHER"; }};

Approx.eq = function(a, b) {
	if(typeof a === "number") { a = Approx(a, Approx.EXACTLY); }
	if(typeof b === "number") { b = Approx(b, Approx.EXACTLY); }

	if(a.nearestFloat !== b.nearestFloat) {
		// A is closest to one float, B is closest to another.
		// They cannot possibly be equal.
		return false;
	}

	if(a.actualValueIs !== b.actualValueIs) {
		// A and B are in different regions around their shared float.
		// They cannot be equal.
		return false;
	}

	if(a.actualValueIs === Approx.EXACTLY) {
		// A and B are both exactly equal to this float.
		return true;
	}

	// A and B are both LOWER than this float or both HIGHER than this float.
	throw Error("It is not possible to tell whether " + a + " and " + b + " are equal");
};

Approx.lt = function(a, b) {
	if(typeof a === "number") { a = Approx(a, Approx.EXACTLY); }
	if(typeof b === "number") { b = Approx(b, Approx.EXACTLY); }

	if(a.nearestFloat !== b.nearestFloat) {
		// A's closest float is different from B's closest float.
		// Go by the order of the floats.
		return a.nearestFloat < b.nearestFloat;
	}

	if(a.actualValueIs !== b.actualValueIs) {
		// A and B are in different regions around their shared float.
		// Go by the order of the regions.
		return a.actualValueIs < b.actualValueIs;
	}

	if(a.actualValueIs === Approx.EXACTLY) {
		// A and B are both exactly equal to this float.
		return false;
	}

	// A and B are both LOWER than this float or both HIGHER than this float.
	throw Error("It is not possible to tell whether " + a + " is less than " + b);
};

Approx.le = function(a, b) { return Approx.lt(a, b) || Approx.eq(a, b); };
Approx.ne = function(a, b) { return !Approx.eq(a, b); };
Approx.ge = function(a, b) { return !Approx.lt(a, b); };
Approx.gt = function(a, b) { return !Approx.le(a, b); };

module.exports = Approx;

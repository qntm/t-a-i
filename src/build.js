/**
	Set the parameters of your very own spinning Earth and compare it with
	reality! (This provides DI for testing against simpler structures of leap
	seconds.)
*/

"use strict";

/**
	Convert the initial parameters and the leap seconds list into a list of
	blocks of Unix time which track exactly with atomic time.
*/
var _generateBlocks = function(leapSeconds) {

	if(leapSeconds.length < 1) {
		throw new Error("Need to provide at least one reference point");
	}

	leapSeconds.forEach(function(leapSecond, i) {
		if(i > 0 && leapSecond.atomic <= leapSeconds[i - 1].atomic) {
			throw new Error("Disordered leap seconds");
		}
	});

	var millisecondsInOneDay = 1000 * 60 * 60 * 24; // 86400000

	return leapSeconds.map(function(leapSecond, i) {
		var offset        = leapSecond.offset;
		var driftRate     = leapSecond.driftRate || 0.000000;

		var atomicStart   = leapSecond.atomic;
		var atomicEnd     = i === leapSeconds.length - 1 ? Infinity : leapSeconds[i + 1].atomic;
		var atomicInBlock = function(atomic) {
			return atomicStart <= atomic && atomic < atomicEnd;
		};
		var atomicToUnix  = function(atomic) {
			atomic -= offset;
			// Ewww, direct float equality comparison
			if(driftRate !== 0) {
				// Ordinarily we would now divide `atomic` by `1 + driftRate / millisecondsInOneDay`
				// but this number is very close to 1 so we would possibly lose precision...
				atomic = (atomic * millisecondsInOneDay) / (millisecondsInOneDay + driftRate);
			}
			return atomic;
		};

		var unixStart     = atomicToUnix(atomicStart);
		var unixEnd       = atomicToUnix(atomicEnd);
		var unixInBlock   = function(unix) {
			return unixStart <= unix && unix < unixEnd;
		};
		var unixToAtomic  = function(unix) {
			// Ewww, direct float equality comparison
			if(driftRate !== 0) {
				// Ordinarily we would multiply `unix` by `1 + driftRate / millisecondsInOneDay`
				// but this number is very close to 1 so we could lose even more precision
				// than I am clearly already losing
				unix = unix + (unix * driftRate) / millisecondsInOneDay;
			}
			unix += offset;
			return unix;
		};

		return {
			offset        : offset,
			driftRate     : driftRate,
			atomicStart   : atomicStart,
			atomicEnd     : atomicEnd,
			atomicInBlock : atomicInBlock,
			atomicToUnix  : atomicToUnix,
			unixStart     : unixStart,
			unixEnd       : unixEnd,
			unixInBlock   : unixInBlock,
			unixToAtomic  : unixToAtomic
		};
	});
};

/**
	Build and return an atomic time converter.
*/
module.exports = function(
	// An array of pairs {atomic, offset}.
	// `atomic` is the atomic time when the offset changed; the offset in milliseconds
	// indicates the new offset (TAI minus Unix) as of this atomic time.
	leapSeconds
) {
	var blocks = _generateBlocks(leapSeconds);

	// Compute the "beginning" of atomic time. We need this so we can check it
	var earliestAtomic = Math.min.apply(Math, blocks.map(function(block) {
		return block.atomicStart;
	}));
	var earliestUnix = Math.min.apply(Math, blocks.map(function(block) {
		return block.unixStart;
	}));

	// One-to-many APIs

	/**
		Convert this Unix time to an array of atomic times. Ordinarily
		this will return a single-element array, but if the Unix time
		falls during an inserted leap second, then there will be two
		elements in the array. A removed leap second? No elements.
	*/
	var oneToMany_unixToAtomic = function(unix) {
		if(unix < earliestUnix) {
			throw new Error("This Unix time falls before atomic time was defined.");
		}
		return blocks.filter(function(block) {
			return block.unixInBlock(unix);
		}).map(function(block) {
			return block.unixToAtomic(unix);
		});
	};

	/**
		Convert this atomic time object to a Unix time.
		If it falls during a removed leap second, return the second,
		"canonical" Unix time (since the earlier one never happened).
		`oneToMany.atomicToUnix(oneToMany.unixToAtomic(x))` returns `x`.
		If the "atomic time" falls too early, throw an exception.
	*/
	var oneToMany_atomicToUnix = function(atomic) {
		if(atomic < earliestAtomic) {
			throw new Error("This atomic time is not defined.");
		}
		var results = blocks.filter(function(block) {
			return block.atomicInBlock(atomic);
		}).map(function(block) {
			return block.atomicToUnix(atomic);
		});
		if(results.length === 0) {
			throw new Error("This atomic time was not found. This should be impossible.");
		}
		if(results.length > 1) {
			throw new Error("This atomic time is ambiguous. This should be impossible.");
		}
		return results[0];
	};

	// One-to-one APIs

	/**
		Same as `oneToMany.unixToAtomic` but select a canonical result.
		If the Unix time doesn't exist (due to being clobbered during a
		removed leap second), throws an exception.
	*/
	var oneToOne_unixToAtomic = function(unix) {
		var many = oneToMany_unixToAtomic(unix);
		if(many.length === 0) {
			throw new Error("This Unix time never happened; it falls during a removed leap second.");
		}
		return many[many.length - 1];
	};

	/**
		Same as `oneToMany.atomicToUnix` but if the target Unix time is the
		first of a repeated Unix time due to an inserted leap
		second, throws an exception.
	*/
	var oneToOne_atomicToUnix = function(atomic) {
		var unix = oneToMany_atomicToUnix(atomic);
		if(oneToOne_unixToAtomic(unix) !== atomic) {
			throw new Error("This atomic time cannot be represeted in Unix time; it falls during an inserted leap second.");
		}
		return unix;
	};

	return {
		leapSeconds    : leapSeconds,
		unixToAtomic   : oneToOne_unixToAtomic,
		atomicToUnix   : oneToMany_atomicToUnix,
		convert        : {
			oneToMany  : {
				unixToAtomic : oneToMany_unixToAtomic,
				atomicToUnix : oneToMany_atomicToUnix
			},
			oneToOne   : {
				unixToAtomic : oneToOne_unixToAtomic,
				atomicToUnix : oneToOne_atomicToUnix
			}
		}
	};
};

// For testing only
module.exports._generateBlocks = _generateBlocks;

/**
	Set the parameters of your very own spinning Earth and compare it with
	reality! (This provides DI for testing against simpler structures of leap
	seconds.)

	Ironically it is TAI which is the fixed constant in reality, and Unix time
	which takes on different shapes depending when leap seconds are added, but in
	JavaScript the reverse is true: Unix time is fixed, and our atomic "backing"
	time standard is what we must build by applying changes to it.
*/

"use strict";

/**
	Convert the initial parameters and the leap seconds list into a list of
	blocks of Unix time which track exactly with atomic time.
*/
var _generateBlocks = function(leapSeconds) {
	var blocks = [];

	if(leapSeconds.length < 1) {
		throw new Error("Need to provide at least one reference point");
	}

	var initial = leapSeconds[0];
	blocks.push({
		offset      : initial.offset,
		atomicStart : initial.atomic,
		atomicEnd   : Infinity
	});

	leapSeconds.slice(1).forEach(function(leapSecond) {
		if(!("atomic" in leapSecond)) {
			throw new Error("Missing property `atomic` in leapSecond");
		}
		var atomic = leapSecond.atomic;
		var offset = leapSecond.offset;
		if(atomic <= blocks[blocks.length - 1].atomicStart) {
			throw new Error("Disordered leap seconds");
		}
		blocks[blocks.length - 1].atomicEnd = atomic;
		blocks.push({
			offset      : offset, // absolute
			atomicStart : atomic,
			atomicEnd   : Infinity
		});
	});

	blocks.forEach(function(block) {
		block.unixStart = block.atomicStart - block.offset;
		block.unixEnd   = block.atomicEnd   - block.offset;
	});

	return blocks;
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
			return block.unixStart <= unix && unix < block.unixEnd;
		}).map(function(block) {
			return unix + block.offset;
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
			return block.atomicStart <= atomic && atomic < block.atomicEnd;
		}).map(function(block) {
			return atomic - block.offset;
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

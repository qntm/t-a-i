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
		var atomicStart = Math.min(
			atomic,

			// Extend the block backwards a little way so that all possible
			// Unix times are still represented
			atomic + offset - blocks[blocks.length - 1].offset
		);
		if(atomicStart <= blocks[blocks.length - 1].atomicStart) {
			throw new Error("Disordered leap seconds");
		}
		blocks[blocks.length - 1].atomicEnd = atomic;
		blocks.push({
			offset      : offset, // absolute
			atomicStart : atomicStart,
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

	// Many-to-many APIs

	/**
		Convert this Unix time to an array of atomic times. Ordinarily
		this will return a single-element array, but if the Unix time
		falls during an inserted leap second, then there will be two
		elements in the array. If the Unix time is before atomic time
		was defined, returns an empty array.
	*/
	var manyToMany_unixToAtomic = function(unix) {
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
		Convert this atomic time to an array of Unix times representing the
		same instant in time as output. In most cases this will be an array
		containing a single entry. In the event that we fall on a removed
		leap second, the array will have two entries. If the atomic time
		falls before atomic time was defined, the array will be empty.
	*/
	var manyToMany_atomicToUnix = function(atomic) {
		if(atomic < earliestAtomic) {
			throw new Error("This atomic time is not defined.");
		}
		return blocks.filter(function(block) {
			return block.atomicStart <= atomic && atomic < block.atomicEnd;
		}).map(function(block) {
			return atomic - block.offset;
		});
	};

	// Many-to-one APIs

	/**
		Same as `manyToMany.unixToAtomic`, but if the Unix time falls during an
		inserted leap second, return the later of the two atomic times.
		`manyToOne.atomicToUnix(manyToOne.unixToAtomic(x))` returns `x`. If the Unix time falls before
		atomic time was defined, throws an exception.
	*/
	var manyToOne_unixToAtomic = function(unix) {
		return manyToMany_unixToAtomic(unix).pop();
	};

	/**
		Convert this atomic time object to a Unix time.
		If it falls during a removed leap second, return the second,
		"canonical" Unix time (since the earlier one never happened).
		`manyToOne.atomicToUnix(manyToOne.unixToAtomic(x))` returns `x`.
		If the "atomic time" falls too early, throw an exception.
	*/
	var manyToOne_atomicToUnix = function(atomic) {
		return manyToMany_atomicToUnix(atomic).pop();
	};

	// One-to-one APIs

	/**
		Same as `manyToOne.unixToAtomic` but if the Unix time doesn't exist
		(due to being clobbered during a removed leap second),
		throws an exception.
	*/
	var oneToOne_unixToAtomic = function(unix) {
		var atomic = manyToOne_unixToAtomic(unix);
		if(manyToOne_atomicToUnix(atomic) !== unix) {
			throw new Error("This Unix time never happened; it falls during a removed leap second.");
		}
		return atomic;
	};

	/**
		Same as `manyToOne.atomicToUnix` but if the target Unix time is the
		first of a repeated Unix time due to an inserted leap
		second, throws an exception.
	*/
	var oneToOne_atomicToUnix = function(atomic) {
		var unix = manyToOne_atomicToUnix(atomic);
		if(manyToOne_unixToAtomic(unix) !== atomic) {
			throw new Error("This atomic time cannot be represeted in Unix time; it falls during an inserted leap second.");
		}
		return unix;
	};

	return {
		leapSeconds    : leapSeconds,
		unixToAtomic   : manyToOne_unixToAtomic,
		atomicToUnix   : manyToOne_atomicToUnix,
		convert        : {
			manyToMany : {
				unixToAtomic : manyToMany_unixToAtomic,
				atomicToUnix : manyToMany_atomicToUnix
			},
			manyToOne  : {
				unixToAtomic : manyToOne_unixToAtomic,
				atomicToUnix : manyToOne_atomicToUnix
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

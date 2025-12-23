// The way to think about this is a 2D graph with TAI on the X axis, UTC on the Y, and a collection
// of numbered *segments*. Each segment starts at a well defined position in both TAI and UTC and
// proceeds diagonally up and to the right, expressing *one* relationship between the two.
// Typically each new segment is either (1) the previous segment translated up or down a little or
// (2) a discrete change in direction/slope of the previous segment with no discontinuity.
// A segment becomes invalid once we reach the TAI start point of the next (numerical) segment. So,
// every TAI time (vertical line) intersects exactly one segment, and maps to exactly 1 UTC time,
// unless it precedes the beginning of TAI.
// A UTC time (horizontal line) can intersect 0, 1, 2 or theoretically many more segments, and hence
// map to multiple TAI times. We can return an array of these, or just the result from the latest
// segment (according to its numbering).

import { munge } from './munge.js'
import { Range } from './range.js'

export class Converter {
  constructor (data, model) {
    this.segments = munge(data, model)
  }

  atomicToUnix (atomic) {
    for (const segment of this.segments) {
      if (!segment.atomicOnSegment(atomic)) {
        continue
      }

      return segment.atomicToUnix(atomic)
    }

    // Pre-1961, or BREAK model and we hit a break
    return NaN
  }

  unixToAtomic (unix) {
    const ranges = []
    for (const segment of this.segments) {
      if (!segment.unixOnSegment(unix)) {
        continue
      }

      const range = segment.unixToAtomicRange(unix)

      if (ranges.length - 1 in ranges) {
        const prev = ranges[ranges.length - 1]

        // Previous range ends where current one starts, so try to combine the two.
        // The previous range should have `open: true` but it doesn't actually make a difference.
        if (prev.end.eqS(range.start)) {
          ranges[ranges.length - 1] = new Range(prev.start, range.end, range.open)
          continue
        }
      }

      ranges.push(range)
    }

    if (ranges.some(range => range.open)) {
      throw Error('Failed to close all open ranges, this should be impossible')
    }

    // Always return an array of ranges, caller can prune this output if desired
    return ranges
  }
}

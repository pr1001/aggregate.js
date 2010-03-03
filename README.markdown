aggregate.js
===========

aggregate.js is a simple proof-of-concept Javascript library of different ways to handle on-the-fly calculation of aggregate values for data from multiple sources. I built it because I wanted to be able to easily experiment with different aggregation strategies.

Objects
-------
- **`Sample`:** `Sample` is just that, a single data point from a single source. It takes a key unique to a data source (e.g. a UUID or a MAC address), a numeric value, and a millisecond timestamp.
- **`InstantaneousAggregate`**: `InstantaneousAggregate` simply calculates the relevant aggregate values based upon the `Samples` passed to its constructor. It takes the time of the most recent `Sample` as its own. `InstantaneousAggregate` is designed based upon the belief that every time you receive any new data, there is a new aggregate state and thus you should create a new `InstantaneousAggregate` based upon the most recent `Samples`. See `aggregator.js` for an example of how this is done in practice, as some additional code is required. Note that it always takes the most recent `Sample` from each source, regardless of whether a source hasn't been heard from in quite some time. This is considered a feature, as it makes the conservative assumption that in the absence of new data we can only assume that the source has stayed constant. You can easily change which of the latest `Samples` are passed to the `InstantaneousAggregate` constructor based upon what you feel is a proper strategy if this is not to your liking.
- **`WindowedAggregate`:** `WindowedAggregate` calculates aggregate values based upon a set of `Samples` within a specific period of time (by default, 1000 milliseconds from the earliest `Sample`). Because of this, `Samples` can be added to the `WindowedAggregate` after it has been created provided they are within the `WindowedAggregate`'s window of time for which a `Sample` is valid. The `updateIfValid` method is the safest way to do this.

Running the example code
------------------------
Node (http://nodejs.org/) is required. Once installed, simply type `node sampler.js`

To Do
-----
- Move some common min, max, avg calculation code into the parent `Aggregate` object common to both `InstantaneousAggregate` and `WindowedAggregate`.
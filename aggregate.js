var sys = require("sys");

function Sample(key, value, time) {
  this.key = key;
  this.value = value;
  this.time = time;
}
Sample.prototype.toString = function toString() {
  return "Sample " + this.value + " for " + this.key + " at " + this.time;
}

// an empty class to indicate common inheritance
function Aggregate() {}

function WindowedAggregate() {
  var args = Array.prototype.slice.call(arguments);
  
  // if the first value is a time interval (in ms)
  if (typeof args[0] == 'number' || args[0] instanceof Number) {
    this.timespan = args.shift();
  } else {
    this.timespan = 1000;
  }
  
  // if the first value is a timestamp (in ms)
  if (typeof args[0] == 'number' || args[0] instanceof Number) {
    this.time = args.shift();
  // else we only have Samples
  } else {
    this.time = Math.min.apply(Math, args.map(function(item) { return item.time; }));
  }
  
  this.samples = args;
  this.__updateOverall();
  this.deltaMin = 0;
  this.deltaMax = 0;
  this.deltaAvg = 0;
}
WindowedAggregate.prototype = new Aggregate();
WindowedAggregate.prototype.__updateOverall = function __updateOverall() {
  var values = this.samples.map(function (item) { return item.value; });
  var newMin = Math.min.apply(Math, values);
  this.deltaMin = (newMin - this.min) / this.min;
  this.min = newMin;
  var newMax = Math.max.apply(Math, values);
  this.deltaMax = (newMax - this.max) / this.max;
  this.max = newMax;
  this.avg = values.reduce(function (a, b) { return a + b; }) / values.length;
}
WindowedAggregate.prototype.update = function update(sample) {
  var oldValues = this.samples.map(function (item) { return item.value; });
  var oldAvg = oldValues.reduce(function (a, b) { return a + b; }) / oldValues.length;
  this.samples.push(sample);
  this.__updateOverall();
  this.deltaAvg = (this.avg - oldAvg) / oldAvg;
  return this;
}
WindowedAggregate.prototype.windowIsClosed = function windowIsClosed(sample) {
  return (sample.time > (this.time + this.timespan));
}
/*
// Commented out because can only think of strange and potentially wrong ways to use this
WindowedAggregate.prototype.updateOrNew = function updateOrNew(sample) {
  if (this.windowIsClosed(sample)) {
    return new WindowedAggregate(sample);
  }
  else {
    return this.update(sample);
  }
}
*/
WindowedAggregate.prototype.updateIfValid = function updateIfValid(sample) {
  if (this.windowIsClosed(sample)) {
    return this;
  }
  else {
    return this.update(sample);
  }
}
WindowedAggregate.prototype.toString = function toString() {
  return "WindowedAggregate from " + this.time + " for " + this.timespan + " ms (min: " + this.min + ", max: " + this.max + ", avg: " + this.avg + ")";
}

function InstantaneousAggregate() {
  this.samples = Array.prototype.slice.call(arguments);
  var values = this.samples.map(function (item) { return item.value; });
  
  this.time = Math.max.apply(Math, this.samples.map(function(item) { return item.time; }));
  this.min = Math.min.apply(Math, values);
  this.max = Math.max.apply(Math, values);
  this.avg = values.reduce(function (a, b) { return a + b; }, 0) / values.length;
  this.deltaMin = 0;
  this.deltaMax = 0;
  this.deltaAvg = 0;
}
InstantaneousAggregate.prototype = new Aggregate();
InstantaneousAggregate.prototype.toString = function toString() {
  return "InstantaneousAggregate @ " + this.time + "   (min: " + this.min + ", max: " + this.max + ", avg: " + this.avg + ")";
}

exports.Sample = Sample;
exports.WindowedAggregate = WindowedAggregate;
exports.InstantaneousAggregate = InstantaneousAggregate;
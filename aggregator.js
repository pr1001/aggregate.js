var sys = require('sys');
var events = require('events');
var sampling = require('./sampling');

var myEventEmitter = new events.EventEmitter();
// does NodeJS have thread-safe queues?
// this is a LIFO stack
var windowedAggregates = [];
var instantaneousAggregates = [];

var latestSamples = {};

// stupid helper function since latestSamples isn't actually an associative array
function obj2array(obj) {
  var tmp = [];
  for (var key in obj) {
    tmp.push(obj[key]);
  }
  return tmp;
}

myEventEmitter.addListener('newSample', function(sample) {
  sys.puts("Sample received: " + sample);
  
  // update our windowedAggregates stack
  // if our stack is empty, ie this is the very first Sample we've received, or if the most recent WindowedAggregate's window has closed
  if (windowedAggregates.length == 0 || windowedAggregates[0].windowIsClosed(sample)) {
    windowedAggregates.unshift(new sampling.WindowedAggregate(sample));
  // else an existing window is still open so we should add
  } else {
    windowedAggregates[0].updateIfValid(sample);
  }
  
  // update our instantaneousAggregates stack
  // update our latestSamples associative array (object)
  latestSamples[sample.key] = sample;
  var placeholder = new sampling.InstantaneousAggregate();
  // call the constructor with an array of parameters via the apply method
  sampling.InstantaneousAggregate.prototype.constructor.apply(placeholder, obj2array(latestSamples));
  instantaneousAggregates.unshift(placeholder);
  
  // if we have more than one InstantaneousAggregate we can calculate deltas
  if (obj2array(latestSamples).length > 1) {
    instantaneousAggregates[0].deltaMin = (instantaneousAggregates[0].min - instantaneousAggregates[1].min) / instantaneousAggregates[1].min
    instantaneousAggregates[0].deltaMax = (instantaneousAggregates[0].max - instantaneousAggregates[1].max) / instantaneousAggregates[1].max
    instantaneousAggregates[0].deltaAvg = (instantaneousAggregates[0].avg - instantaneousAggregates[1].avg) / instantaneousAggregates[1].avg
  }
});

// every second emit an event with a new Sample from 'a'
var myInterval1 = setInterval(function() {
  var newSample = new sampling.Sample('a', Math.round(Math.random() * 100), (new Date()).getTime());
  myEventEmitter.emit('newSample', newSample);
}, 1000);

// start the second interval a little later
var myInterval2 = {};
setTimeout(function () {
  // every second emit an event with a new Sample from 'b'
  myInterval2 = setInterval(function() {
    var newSample = new sampling.Sample('b', Math.round(Math.random() * 100), (new Date()).getTime());
    myEventEmitter.emit('newSample', newSample);
  }, 1000);
}, 200);

setTimeout(function() {
  clearInterval(myInterval1);
  clearInterval(myInterval2);
  // dump out accumulated data
  sys.puts(windowedAggregates);
  sys.puts(instantaneousAggregates);
}, 10000);
var test = require('tape')
var from = require('from')
var fifoTransform = require('./index.js')


test('basic test', function (t) {
  var wrapper = new fifoTransform.wrap()
  var unwrapper = new fifoTransform.unwrap()

  var inputArray = ['1','2','3','4']
  var resultArray = []

  t.plan(1)
  from(inputArray)
    .pipe(wrapper)
    .pipe(unwrapper)
    .on('data', function(data){
      resultArray.push(data)
    })
    .on('end', function(){
      t.equal(inputArray.toString(), resultArray.toString(), 'result should match input')
      t.end()
    })
})

test('out of order test', function (t) {
  var wrapper = new fifoTransform.wrap()
  var unwrapper = new fifoTransform.unwrap()
  var chaos = new OrderJumbleTransform()

  var inputArray = ['1','2','3','4']
  var resultArray = []

  t.plan(1)
  from(inputArray)
    .pipe(wrapper)
    .pipe(chaos)
    .pipe(unwrapper)
    .on('data', function(data){
      resultArray.push(data)
    })
    .on('end', function(){
      t.equal(inputArray.toString(), resultArray.toString(), 'result should match input')
      t.end()
    })
})

test('out of order w/o fifo test', function (t) {
  var wrapper = new fifoTransform.wrap()
  var unwrapper = new fifoTransform.unwrap()
  var chaos = new OrderJumbleTransform()

  var inputArray = ['1','2','3','4']
  var resultArray = []

  t.plan(1)
  from(inputArray)
    .pipe(chaos)
    .on('data', function(data){
      resultArray.push(data)
    })
    .on('end', function(){
      t.notEqual(inputArray.toString(), resultArray.toString(), 'result should not match input')
      t.end()
    })
})



// util

var TransformStream = require('stream').Transform
var inherits = require('util').inherits

// jumbles message order by switching order of every pair of messages.

inherits(OrderJumbleTransform, TransformStream)

function OrderJumbleTransform(opts) {
  TransformStream.call(this)
}

OrderJumbleTransform.prototype._transform = function(payload, encoding, callback) {
  var heldMessage = this.heldMessage
  if (heldMessage) {
    // send both, out of order
    this.heldMessage = null
    this.push(payload)
    this.push(heldMessage)
  } else {
    // hold this message
    this.heldMessage = payload
  }
  callback()
}

OrderJumbleTransform.prototype._flush = function(callback) {
  var heldMessage = this.heldMessage
  if (heldMessage) {
    this.push(heldMessage)
  }
  callback()
}
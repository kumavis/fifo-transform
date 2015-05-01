var TransformStream = require('stream').Transform
var inherits = require('util').inherits

module.exports = {
  wrap: WrapFifoTransform,
  unwrap: UnwrapFifoTransform,
}

// base class

inherits(BaseFifoTransform, TransformStream)

function BaseFifoTransform(opts) {
  opts = opts || {}
  TransformStream.call(this, opts)
  var byteLength = opts.byteLength || 2
  this._messageIndex = 0
  this._byteLength = byteLength
  this._maxCount = Math.pow(2, byteLength*8)
}

BaseFifoTransform.prototype._incrementMsgIndex = function() {
  this._messageIndex = (this._messageIndex+1) % this._maxCount
}

// wrap it

inherits(WrapFifoTransform, BaseFifoTransform)

function WrapFifoTransform(opts) {
  BaseFifoTransform.call(this, opts)
}

WrapFifoTransform.prototype._transform = function (data, encoding, callback) {
  var ordering = pad(intToBuffer(this._messageIndex), this._byteLength)
  var payload = Buffer.concat([ordering, data])
  this._incrementMsgIndex()
  callback(null, payload)
}

// unwrap it

inherits(UnwrapFifoTransform, BaseFifoTransform)

function UnwrapFifoTransform(opts) {
  BaseFifoTransform.call(this, opts)
  this._msgStore = {}
}

UnwrapFifoTransform.prototype._transform = function (payload, encoding, callback) {
  var ordering = bufferToInt(payload.slice(0, this._byteLength))
  var data = payload.slice(this._byteLength)
  if (ordering === this._messageIndex) {
    this._incrementMsgIndex()
    this.push(data)
    this._checkQueue()
  } else {
    this._queueMessage(ordering, data)
  }
  callback()  
}

UnwrapFifoTransform.prototype._queueMessage = function(msgIndex, data) {
  this._msgStore[msgIndex] = data
}

UnwrapFifoTransform.prototype._checkQueue = function() {
  var nextMessage = this._msgStore[this._messageIndex]
  if (nextMessage) {
    delete this._msgStore[this._messageIndex]
    this.push(nextMessage)
    this._incrementMsgIndex()
    this._checkQueue()
  } else {
  }
}


// utils
// from https://github.com/ethereum/ethereumjs-util

/**
 * Converts an integer into a hex string
 * @method intToHex
 * @param {Number}
 * @return {String}
 */
function intToHex(i) {
  // assert(i % 1 === 0, 'number is not a interger');
  // assert(i >= 0, 'number must be positive');
  var hex = i.toString(16);
  if (hex.length % 2) {
    hex = '0' + hex;
  }
  return hex;
};

/**
 * Converts an integer to a buffer
 * @method intToBuffer
 * @param {Number}
 * @return {Buffer}
 */
function intToBuffer(i) {
  var hex = intToHex(i);
  return new Buffer(hex, 'hex');
};

/**
 * Converts a buffer to an Interger
 * @method bufferToInt
 * @param {Buffer}
 * @return {Number}
 */
function bufferToInt(buf) {
  if (buf.length === 0) {
    return 0;
  }
  return parseInt(buf.toString('hex'), 16);
};

/**
 * pads an array of buffer with leading zeros till it has `length` bytes
 * @method pad
 * @param {Buffer|Array} array
 * @param {Integer}  length the number of bytes the output should be
 * @return {Buffer|Array}
 */
function pad(msg, length) {
  var buf;
  if (msg.length < length) {
    buf = new Buffer(length);
    buf.fill(0);
    msg.copy(buf, length - msg.length);
    return buf;
  } else {
    return msg.slice(-length);
  }
};
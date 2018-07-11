const through = require('through2')

module.exports = {
  createFifoWrapper,
  createFifoUnwrapper,
}

function createFifoWrapper(opts = {}) {
  let messageIndex = 0
  const byteLength = opts.byteLength || 1
  const maxCount = Math.pow(2, byteLength * 8)

  return through(function (data, _, callback) {
    const indexPrefix = pad(intToBuffer(messageIndex), byteLength)
    const payload = Buffer.concat([indexPrefix, data])
    this.push(payload)
    messageIndex = (messageIndex + 1) % maxCount
    callback()
  })
}

function createFifoUnwrapper(opts = {}) {
  let messageIndex = 0
  const byteLength = opts.byteLength || 1
  const maxCount = Math.pow(2, byteLength * 8)
  const msgStore = {}

  return through(function (payload, _, callback) {
    const messageNumber = bufferToInt(payload.slice(0, byteLength))
    const data = payload.slice(byteLength)
    if (messageNumber === messageIndex) {
      incrementMsgIndex()
      this.push(data)
      checkQueue.call(this)
    } else {
      msgStore[messageNumber] = data
    }
    callback()
  })

  function checkQueue () {
    let nextMessage
    while (nextMessage = msgStore[messageIndex]) {
      delete msgStore[messageIndex]
      this.push(nextMessage)
      incrementMsgIndex()
    }
  }

  function incrementMsgIndex () {
    messageIndex = (messageIndex + 1) % maxCount
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
  // assert(i % 1 === 0, 'number is not a interger')
  // assert(i >= 0, 'number must be positive')
  var hex = i.toString(16)
  if (hex.length % 2) {
    hex = '0' + hex
  }
  return hex
}


/**
 * Converts an integer to a buffer
 * @method intToBuffer
 * @param {Number}
 * @return {Buffer}
 */
function intToBuffer(i) {
  var hex = intToHex(i)
  return Buffer.from(hex, 'hex')
}

/**
 * Converts a buffer to an Interger
 * @method bufferToInt
 * @param {Buffer}
 * @return {Number}
 */
function bufferToInt(buf) {
  if (buf.length === 0) {
    return 0
  }
  return parseInt(buf.toString('hex'), 16)
}

/**
 * pads an array of buffer with leading zeros till it has `length` bytes
 * @method pad
 * @param {Buffer|Array} array
 * @param {Integer}  length the number of bytes the output should be
 * @return {Buffer|Array}
 */
function pad(msg, length) {
  var buf
  if (msg.length < length) {
    buf = Buffer.allocSafe(length)
    msg.copy(buf, length - msg.length)
    return buf
  } else {
    return msg.slice(-length)
  }
}

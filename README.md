### Fifo Transform

Layer on ordering to your stream.
Use before sending over a transport that doesn't guarantee fifo ordering.


```js
const { createFifoWrapper, createFifoUnwrapper } = require('fifo-transform')

inputStream
  .pipe(createFifoWrapper())
  .pipe(chaos)
  .pipe(createFifoUnwrapper())
  .pipe(outputStream)
```

#### api

We append (and remove) an ordering number to the front of the buffer of a specified length.
How many messages do you expect to be in a jumble at once?
It will support up to `Math.pow(2, byteLength * 8)` simultaneously in-transit messages.
Default byteLength is 1, allowing 256 messages to be in jumble at once.

```js
var wrapper = createFifoWrapper({ byteLength: 2 })
var unwrapper = createFifoUnwrapper({ byteLength: 2 })
```

#### note

Currently does not work with streams in object mode.

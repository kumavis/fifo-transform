### Fifo Transform

Layer on ordering to your stream.
Use before sending over a transport that doesn't guarantee fifo ordering.


```js
var fifoTransform = require('fifoTransform')
var wrapper = new fifoTransform.wrap()
var unwrapper = new fifoTransform.unwrap()

inputStream
  .pipe(wrapper)
  .pipe(chaos)
  .pipe(unwrapper)
  .pipe(outputStream)
```

#### api

We append (and remove) an ordering number to the front of the buffer of a specified length.
How many messages do you expect to be in a jumble at once?
It will support up to `Math.pow(2, byteLength * 8)` simultaeneously in-transit messages.
Default byteLength is 2, allowing 65536 messages to be in jumble at once.

```js
var wrapper = new fifoTransform.wrap({ byteLength: 2 })
var unwrapper = new fifoTransform.unwrap({ byteLength: 2 })
```

#### note

Currently does not work with streams in object mode.
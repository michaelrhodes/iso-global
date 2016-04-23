# iso-global

This module lets you require and asynchronously access global objects that exist within an isolated browser context (specifically, an iframe). You could use it to conditionally load [standalone modules](http://www.forbeslindesay.co.uk/post/46324645400/standalone-browserify-builds) without polluting the global namespace.

** The [tests](#running-the-tests) should pass in all browsers, even IE 6 and friends! **

## Install

```sh
$ npm install iso-global
```

## Usage

### Example

Suppose you wanted to generate some SHA-1 hashes. Most modern browsers support `crypto.subtle.digest` but for those that don’t  you’d like to provide a fallback. Ideally, a capable browser shouldn’t be forced to download and parse a non-native implementation they’ll never execute, so you could do something like this:

```js
var iso = require('iso-global')
var supports = require('subtle-digest/supports')

supports('sha1', function (yes) {
  var sha1 = yes ?
    iso('url/for/native-sha1.js') :
    iso('url/for/fallback-sha1.js')
  
  sha1('some string', function (err, hash) {
    hash
    > 8b45e4bd1c6acb88bebf6407d16205f567e62a3e
  })
})
```

For more comprehensive but less “real world” usage examples, check out `test/index.js`.

### API

#### [`:accessor`](#void--accessor)` < iso-global(…)`

**required** `script-src:string` is any URL that resolves to a javascript file.

**optional** `object-name:string` is the name of a global object that `script-src` exposes. If omitted, the basename of `script-src` will be used instead.

**optional** `object-properties:array` is a list of properties, belonging to the global object, that you would like to access. These will be exposed as properties of the returned `accessor(…)` object, and are themselves `accessor(…)` objects.

**optional** `object-functions-are-synchronous:boolean` defaults to `false` but should be set to `true` if the global object or its function properties return values rather than passing them into callback functions.

*note: optional arguments for can be specified in any order.*

#### `:void < accessor(…)`

**optional** `args:arguments` are any number of values that need to be passed to the global object, assuming the object is a function.

**required** `callback:function` is a function that will eventually be passed the accessed value or values.

**optional** `object-function-is-synchronous:boolean` allows you to override the `object-functions-are-synchronous` boolean for this specific global object property.

### A few words about `iso-global/recontext(…)`

Because `iso-global` runs scripts in an separate context from the main application, a weird edge case exists where if the isolated code performs `instanceof` checks against arguments passed from the main context, those checks will always fail. The reason for this can perhaps best be demonstrated through code:

```js
var ContextA = window
var ContextB = iframe.contentWindow
var array = []

array instanceof ContextA.Array
> true
array instanceof ContextB.Array
> false
```

If this is a problem for you, you can likely get around it by requiring `iso-global/recontext`, which will automagically recontextualise arguments before passing them to the isolated script. It’s a total hack, so that’s why it’s provided as an optional augmentation.

### Page weight

`require('iso-global')`

| compression          |    size |
| :------------------- | ------: |
| iso-global.js        | 4.62 kB |
| iso-global.min.js    | 2.05 kB |
| iso-global.min.js.gz | 1.04 kB |


`require('iso-global/recontext')`

| compression         |    size |
| :------------------ | ------: |
| recontext.js        | 5.43 kB |
| recontext.min.js    | 2.47 kB |
| recontext.min.js.gz | 1.22 kB |

### Running the tests

Until [testling](https://ci.testling.com/) comes back (or is replaced by something elegant) you can run the tests yourself in any browser:

```sh
$ git clone git@github.com:michaelrhodes/iso-global
$ cd iso-global
$ npm install
$ npm test
```

#### License

[MIT](http://opensource.org/licenses/MIT)

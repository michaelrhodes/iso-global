require('./lib/bind.polyfill')

var test = require('tape-catch')
var iso = require('../recontext')

// Save recontext stuff for later.
var recontext = iso.re
iso.re = null

var tick = '✔︎'

test('it returns a funtion', function (assert) {
  assert.equal('function', typeof iso('test/fixtures/string.js'), tick)
  assert.end()
})

test('it can load any script', function (assert) {
  var lib = 'https://wzrd.in/standalone/closest-to'
  var remote = iso(lib)
  remote(5, [1, 4, 7], function (closest) {
    assert.equal(closest, 4, tick)
    assert.end()
  })
})

test('you can access properties', function (assert) {
  var object = iso('test/fixtures/object.js', ['hello', 'how'])
  object.hello(function (val) {
    assert.equal('there', val, tick)

    object.how(function (val) {
      assert.equal('are you?', val, tick)
      assert.end()
    })
  })
})

test('you can specify a different global name', function (assert) {
  var math = iso('test/fixtures/mess.js', 'math')
  math(function (msg) {
    assert.equal('math is kewl', msg, tick)
    assert.end()
  })
})

test('you can specify a different global and access properties',
  function (assert) {
    var math = iso('test/fixtures/mess.js', 'math', ['square'])
    math.square(2, function (result) {
      assert.equal(4, result, tick)
      assert.end()
    })
  })

test('it can’t handle cross-context `instanceof` checks…',
  function (assert) {
    iso('test/fixtures/array.js')([], function (yes) {
      assert.equal(yes, false, tick)
      assert.end()
    })
})

test('…or can it?', function (assert) {
  iso.re = recontext 
  iso('test/fixtures/array.js')([], function (yes) {
    iso.re = null
    assert.equal(yes, true, tick)
    assert.end()
  })
})

test('it can call asynchronous functions', function (assert) {
  var greet = iso('test/fixtures/greet.js', true)
  greet('michael', function (greeting) {
    assert.equal(greeting, 'hello, michael', tick)
    assert.end()
  })
})

test('it accepts optional arguments in any order', function (assert) {
  var path = 'test/fixtures/order.js'
  var name = 'not-order'
  var properties = ['version', 'fn']
  var async = false

  check(name, properties, async, function () {
    check(properties, async, name, function () {
      check(async, name, properties, function () {
        assert.end()
      })
    })
  })

  function check (a, b, c, next) {
    var order = iso(path, a, b, c)

    order(2, function (squared) {
      assert.equal(squared, 4, tick)

      order.version(function (version) {
        assert.equal(version, '1.0.0', tick)

        order.fn(function (msg) {
          assert.equal(msg, 'thanks for calling', tick)
          next()
        }, true)
      })
    })
  }
})

require('./lib/bind.polyfill')

var test = require('tape-catch')
var umd = require('../index')
var recontext = require('../lib/recontext')
var tick = '✔︎'

test('it returns a funtion', function (assert) {
  assert.equal('function', typeof umd('test/fixtures/string'), tick)
  assert.end()
})

test('it can load any script', function (assert) {
  var lib = 'https://cdn.rawgit.com/michaelrhodes/2e708c23f04a09789cefcf8302753971/raw/f2837993dd5b7e647b7cbaf08bd111a313f6d144/remote.js'
  var remote = umd(lib)
  remote('michael', function (msg) {
    assert.equal('greetings from the internet, michael', msg, tick)
    assert.end()
  })
})

test('you can access properties', function (assert) {
  var object = umd('test/fixtures/object', ['hello', 'how'])
  object.hello(function (val) {
    assert.equal('there', val, tick)

    object.how(function (val) {
      assert.equal('are you?', val, tick)
      assert.end()
    })
  })
})

test('you can specify a different global name', function (assert) {
  var math = umd('test/fixtures/mess', 'math')
  math(function (msg) {
    assert.equal('math is kewl', msg, tick)
    assert.end()
  })
})

test('you can specify a different global and access properties',
  function (assert) {
    var math = umd('test/fixtures/mess', 'math', ['square'])
    math.square(2, function (result) {
      assert.equal(4, result, tick)
      assert.end()
    })
  })

test('it can’t handle cross-context `instanceof` checks…',
  function (assert) {
    umd('test/fixtures/array')([], function (yes) {
      assert.equal(yes, false, tick)
      assert.end()
    })
})

test('…or can it?', function (assert) {
  umd.re = recontext 
  umd('test/fixtures/array')([], function (yes) {
    umd.re = null
    assert.equal(yes, true, tick)
    assert.end()
  })
})

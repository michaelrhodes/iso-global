var slice = Array.prototype.slice

module.exports = iso

function iso () {
  var args = slice.call(arguments)
  var src = args.shift()
  var name = find(args, 'string')
  var props = find(args, 'array') || []
  var sync = find(args, 'boolean')

  var loaded = false
  var remote = null
  var queue = []

  // Allow access to module.exports
  var entry = accessor()

  // Allow access to module.exports[prop]
  var prop, props = props.slice()
  while (prop = props.shift()) {
    entry[prop] = accessor(prop)
  }

  // Load script
  inject(src, name, sync, function (err, access) {
    if (err) throw err

    remote = access
    loaded = true

    var args
    while (args = queue.shift()) {
      remote(args)
    }
  })

  function accessor (property) {
    return function () {
      var args = slice.call(arguments)
      args.push(property)
      loaded ? remote(args) : queue.push(args)
    }
  }

  return entry
}

function inject (src, name, sync, cb) {
  // Assume global name is last URL segment without extension
  name = name || src.split('/').pop().replace(/[#\?\.].+$/, '')

  var iframe = document.createElement('iframe')
  iframe.setAttribute('data-module', name)
  iframe.style.display = 'none'

  function onload () {
    var iwindow = iframe.contentWindow
    var idocument = iwindow.document

    var complete = false
    var script = idocument.createElement('script')
    script.src = src

    function onload () {
      complete = true
      cb(null, function access (args) {
        // `browserify -s` camel-cases global names :/
        var object = iwindow[name] || iwindow[camel(name)]
        var prop = object[args.pop()] || object
        var last = args.pop()

        // Allow individual calls to made sync or async.
        if (typeof last == 'boolean') {
          sync = last
          last = args[args.length - 1]
        }

        // The module will be run in a different window context
        // so if it performs any `instanceof` checks against
        // global constructors, we need to reconstruct some
        // of its properties before we proceed. This sucks.
        if (!!iso.re) {
          var l = args.length
          while (l--) args.push(iso.re(args.shift(), iwindow, true))
        }

        if (typeof prop == 'function') {
          // If we are async we don’t need `prop` anymore
          // so there’s no harm in mutating the value.
          prop = prop.apply(object, args.concat(last))
          if (!sync) return
        }

        // Used for async non-function property access
        // and also for all sync property access.
        if (typeof last == 'function') {
          setTimeout(function () {
            last(prop)
          }, 0)
        }
      })
    }

    script.onerror = function () {
      complete = true
      cb(new Error('Couldn’t load module ' +
        name + ' <' + script.src + '>'
      ))
    }

    // <= ie8 support
    script.onload = onload
    script.onreadystatechange = function () {
      var ready = /^(loaded|complete)$/.test(this.readyState)
      if (!complete && ready) onload()
    }

    idocument.body.appendChild(script)
  }

  // <= ie8 support
  !!iframe.attachEvent ?
    iframe.attachEvent('onload', onload) :
    iframe.onload = onload

  document.body.appendChild(iframe)
}

function find (array, type) {
  // Including word boundaries will prevent
  // Array from matching ArrayBuffer, etc.
  var regex = RegExp('\\b' + type + '\\b', 'i')

  for (var i = 0, l = array.length, val; i < l; i++) {
    val = array[i]
    if (typeof val == type || val && regex.test(val.constructor)) {
      // Remove the found item from the array
      // to speed up subsequent `find` calls.
      return array.splice(i, 1)[0]
    }
  }
}

// Logic lifted from https://github.com/ForbesLindesay/umd
function camel (name) {
  function uc (_, ch) {
    return ch.toUpperCase()
  }

  name = name
    .replace(/\-([a-z])/g, uc)
    .replace(/^[^a-zA-Z_$]/, '')
    .replace(/[^\w$]+/g, '')

  if (!name) throw new Error(
    'Invalid JavaScript identifier resulted ' +
    'from camel-casing'
  )

  return name
}

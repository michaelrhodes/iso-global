var slice = Array.prototype.slice

module.exports = umd

function umd (path, name, props) {
  // Global name is optional
  if (name && /Array/.test(name.constructor)) {
    props = name
    name = null
  }

  props = [].concat(props)

  var loaded = false
  var call = null
  var queue = []

  // Allow access to module.exports
  var entry = accessor()

  // Allow access to module.exports[prop]
  var prop
  while (prop = props.shift()) {
    entry[prop] = accessor(prop)
  }

  // Load script
  inject(path, name, function (err, fn) {
    if (err) throw err

    call = fn
    loaded = true

    var args
    while (args = queue.shift()) {
      call(args)
    }
  })

  function accessor (property) {
    return function () {
      var args = slice.call(arguments)
      args.push(property)
      loaded ? call(args) : queue.push(args)
    }
  }

  return entry
}

function inject (path, name,  cb) {
  // Assume global name is last URL segment without extension
  name = name || path.split('/').pop().replace(/[#\?\.].+$/, '')

  var iframe = document.createElement('iframe')
  iframe.setAttribute('data-module', name)
  iframe.style.display = 'none'

  function onload () {
    var iwindow = iframe.contentWindow
    var idocument = iwindow.document

    var complete = false
    var script = idocument.createElement('script')
    script.src = path.replace(/\.js$/, '') + '.js'

    function onload () {
      complete = true
      cb(null, function access (args) {
        // `browserify -s` camel-cases global names
        var object = iwindow[name] || iwindow[camel(name)]
        var prop = object[args.pop()] || object
        var last = args[args.length - 1]

        // The module will be run in a different context
        // so if it performs any `instanceof` checks against
        // global constructors, we need to reconstruct its
        // properties before we proceed. This should never
        // fail, but it a bit hacky might so it’s optional.
        if (!!umd.re) {
          var l = args.length
          while (l--) args.push(umd.re(args.shift(), iwindow, true))
        }

        if (typeof prop == 'function') return prop.apply(object, args)
        if (typeof last == 'function') return last(prop)
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

// Logic lifted from: https://github.com/ForbesLindesay/umd
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

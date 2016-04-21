var toString = Function.prototype.toString
var bind = Function.prototype.bind

var ignore = /^(String|Number|Boolean|Object|Function|Symbol)$/

module.exports = function (instance, context, mutate) {
  var cname = match(toString.call(instance.constructor),
    /function ([^\(]+)/
  )

  if (ignore.test(cname)) {
    return instance
  }

  var constructor = context[cname]

  if (!constructor && mutate) {
    context[cname] = instance.constructor
    return instance
  }

  return binding(constructor, instance)
}

function binding (constructor, instance) {
  return new (bind.apply(constructor,
    [constructor].concat(instance)
  ))
}

function match (str, regex) {
  return (str.match(regex) || [])[1]
}

function notOrder (n) {
  return n * n
}

notOrder.fn = function (cb) {
  setTimeout(function () {
    cb('thanks for calling')
  }, 0)
}

notOrder.version = '1.0.0'

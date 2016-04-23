function greet (name, cb) {
  setTimeout(function () {
    cb('hello, ' + name)
  }, 0)
}

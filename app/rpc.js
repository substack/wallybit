var hello = require('hello-frame-rpc')
var normOrigin = require('../lib/norm_origin.js')

module.exports = function (state, box) {
  var rpc, methods = {}
  methods.request = allowed(function (req, cb) {
    cb(null, 'whatever')
  })
  hello.listen('*', methods, function (err, r) { rpc = r })

  function allowed (f) {
    return function () {
      var args = arguments
      var cb = typeof args[args.length-1] === 'function'
        ? args[args.length-1] : noop

      if (state.access.length === 0) {
        box.listAccess(function (err, apps) {
          if (err) cb(err)
          else check(apps)
        })
      } else check(state.access.length)

      function check (apps) {
        if (checker(apps)) f.apply(null, args)
        else cb('not authorized')
      }
      function checker (apps) {
        var origin = normOrigin(rpc.origin)
        for (var i = 0; i < apps.length; i++) {
          if (normOrigin(apps[i].origin) === origin) return true
        }
        return false
      }
    }
  }
}

function noop () {}

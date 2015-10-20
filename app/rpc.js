var hello = require('hello-frame-rpc')
var normOrigin = require('../lib/norm_origin.js')

module.exports = function (state, bus, box) {
  var rpc, methods = {}
  methods.send = allowed(function (app, dstAddr, amount, cb) {
    box.getWallet(app.wallet, function (err, value) {
      if (err) return cb(err)
      //
    })
  })
  hello.listen('*', methods, function (err, r) { rpc = r })

  function allowed (f) {
    return function () {
      var args = [].slice.call(arguments)
      var cb = typeof args[args.length-1] === 'function'
        ? args[args.length-1] : noop

      if (state.access.length === 0) {
        box.listAccess(function (err, apps) {
          if (err) cb(err)
          else check(apps)
        })
      } else check(state.access.length)

      function check (apps) {
        var app = find(apps)
        if (!app) return cb('not authorized')
        f.apply(null, [app].concat(args))
      }
      function find (apps) {
        var origin = normOrigin(rpc.origin)
        for (var i = 0; i < apps.length; i++) {
          if (normOrigin(apps[i].origin) === origin) return apps[i]
        }
        return null
      }
    }
  }
}

function noop () {}

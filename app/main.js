var normOrigin = require('../lib/norm_origin.js')

var level = require('level-browserify')
var db = level('wallybox')

var EventEmitter = require('events').EventEmitter
var xtend = require('xtend')

var ui = new EventEmitter
var Box = require('../')
var box = new Box(db)

var main = require('main-loop')
var vdom = require('virtual-dom')

var state = {
  url: location.pathname,
  wallets: [],
  access: []
}
var render = require('./render.js')
var loop = main(state, function (state) {
  return render(state, ui.emit.bind(ui))
}, vdom)
document.querySelector('#content').appendChild(loop.target)

var bus = require('./actions.js')(ui, box)
require('./events.js')(bus, loop)

var router = require('./router.js')
var singlePage = require('single-page')
var showPage = singlePage(function (href) {
  loop.update(xtend(loop.state, { url: href }))
})
var catcher = require('catch-links')
catcher(window, showPage)

var hello = require('hello-frame-rpc')
;(function () {
  var rpc, methods = {}
  methods.request = function (req, cb) {
    if (!allowed()) return cb('not authorized')
    cb(null, 'whatever')
  }
  hello.listen('*', methods, function (err, r) { rpc = r })
  function allowed () {
    var origin = normOrigin(rpc.origin)
console.log(state.access) 
    for (var i = 0; i < state.access.length; i++) {
console.log('CMP', normOrigin(state.access[i].origin), origin)
      if (normOrigin(state.access[i].origin) === origin) return true
    }
    return false
  }
})()

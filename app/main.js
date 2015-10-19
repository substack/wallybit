var hyperlog = require('hyperlog')
var hindex = require('hyperlog-index')

var level = require('level-browserify')
var db = level('wallybox')
var idb = level('wallybox-index')

var log = hyperlog(db)
var dex = hindex(log, idb, function (row, tx, next) {
  next()
})

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
hello.listen('*', function (rpc) {
  var methods = {}
  console.log('rpc=', rpc)
  methods.request = function (req, cb) {
    console.log('req=', req)
  }
  return methods
})

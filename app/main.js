var hyperlog = require('hyperlog')
var hindex = require('hyperlog-index')

var level = require('level-browserify')
var db = level('wallybox')
var idb = level('wallybox-index')

var log = hyperlog(db)
var dex = hindex(log, idb, function (row, tx, next) {
  next()
})

var Box = require('../')
var box = new Box(db)

var main = require('main-loop')
var vdom = require('virtual-dom')
var rpc = require('hello-frame-rpc')

var EventEmitter = require('events').EventEmitter
var bus = new EventEmitter

bus.on('create-wallet', function () {
  box.createWallet(function (err, wallet) {
    if (err) return showError(err)
    state.wallets.push(wallet)
    loop.update(state)
  })
})

bus.on('remove-access', function (origin) {
  box.removeAccess(origin, function (err) {
    if (err) return showError(err)
  })
})

bus.on('add-access', function (origin) {
  rpc.connect(origin, {}, function (err) {
    if (err) return showError(err)
    box.addAccess(origin, {}, function (err) {
      if (err) return showError(err)
      state.access.push({ origin: origin })
    })
  })
})

box.on('add-access', function (origin, perms) {
  state.requests = state.requests.filter(function (req) {
    return req.origin !== origin
  })
  state.approved.push({ origin: origin, permissions: perms })
  loop.update(state)
})

box.on('remove-access', function (origin, req) {
  state.requests = state.requests.filter(function (req) {
    return req.origin !== origin
  })
  loop.update(state)
})

var state = {
  url: location.pathname,
  wallets: [],
  access: []
}
var render = require('./render.js')
var loop = main(state, function (state) {
  return render(state, bus.emit.bind(bus))
}, vdom)
document.querySelector('#content').appendChild(loop.target)

var router = require('./router.js')
var singlePage = require('single-page')
var showPage = singlePage(function (href) {
  state.url = href
  loop.update(state)
})
var catcher = require('catch-links')
catcher(window, showPage)

var hello = require('hello-frame-rpc')
hello.listen('*', function (rpc) {
  var methods = {}
  methods.request = function (req, cb) {
    //...
  }
  return methods
})

box.listWallets(function (err, wallets) {
  if (err) return showError(err)
  state.wallets = wallets
  loop.update(state)
})

box.listAccess(function (err, apps) {
  if (err) return showError(err)
  state.access = apps
  loop.update(state)
})

function showError (err) {
  state.error = err.message || String(err)
  loop.update(state)
}

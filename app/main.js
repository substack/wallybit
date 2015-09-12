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
var PageBus = require('page-bus')

var ui = new EventEmitter
var Box = require('../')
var box = new Box(db, { events: new PageBus })

var main = require('main-loop')
var vdom = require('virtual-dom')
var rpc = require('hello-frame-rpc')

ui.on('create-wallet', function () {
  box.createWallet(showError)
})

ui.on('add-wallet', function (wif) {
  box.addWallet(wif, showError)
})

ui.on('remove-wallet', function (addr) {
  box.removeWallet(addr, showError)
})

ui.on('remove-access', function (origin) {
  box.removeAccess(origin, function (err) {
    if (err) return showError(err)
  })
})

ui.on('add-access', function (origin) {
  rpc.connect(origin, {}, function (err) {
    if (err) return showError(err)
    box.addAccess(origin, {}, showError)
  })
})

box.events.on('add-access', function (origin, perms) {
  state.access.push({ origin: origin, permissions: perms || {} })
  loop.update(state)
})

box.events.on('remove-access', function (origin, req) {
  state.access = state.access.filter(function (x) {
    return x.origin !== origin
  })
  loop.update(state)
})

box.events.on('add-wallet', function (wallet) {
  state.wallets.push(wallet)
  loop.update(state)
})

box.events.on('remove-wallet', function (addr) {
  state.wallets = state.wallets.filter(function (w) {
    return w.address !== addr
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
  return render(state, ui.emit.bind(ui))
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
  if (!err) return
  state.error = err.message || String(err)
  loop.update(state)
}

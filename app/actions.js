var rpc = require('hello-frame-rpc')
var PageBus = require('page-bus')
var EventEmitter = require('events').EventEmitter

module.exports = function (ui, box) {
  var shared = new PageBus
  var local = new EventEmitter

  box.listWallets(function (err, wallets) {
    if (err) local.emit('error', err)
    else local.emit('list-wallets', wallets)
  })

  box.listAccess(function (err, apps) {
    if (err) local.emit('error', err)
    else local.emit('list-access', apps)
  })

  ui.on('create-wallet', function (opts) {
    box.createWallet(opts, function (err, wallet) {
      if (err) local.emit('error', err)
      else shared.emit('add-wallet', wallet)
    })
  })

  ui.on('add-wallet', function (wif) {
    box.addWallet(wif, function (err, wallet) {
      if (err) local.emit('error', err)
      else shared.emit('add-wallet', wallet)
    })
  })

  ui.on('remove-wallet', function (addr) {
    box.removeWallet(addr, function (err) {
      if (err) local.emit('error', err)
      else shared.emit('remove-wallet', addr)
    })
  })

  ui.on('remove-access', function (origin) {
    box.removeAccess(origin, function (err) {
      if (err) local.emit('error', err)
      else shared.emit('remove-access', origin)
    })
  })

  ui.on('add-access', function (host) {
    rpc.connect(host.origin, {}, function (err) {
      if (err) return showError(err)
      box.addAccess(host, function (err, perms) {
        if (err) local.emit('error', err)
        else shared.emit('add-access', host)
      })
    })
  })

  return { shared: shared, local: local }
}

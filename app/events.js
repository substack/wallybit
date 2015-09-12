var xtend = require('xtend')

module.exports = function (bus, loop) {
  bus.shared.on('add-access', function (host) {
    update({ access: loop.state.access.concat(host) })
  })

  bus.shared.on('remove-access', function (origin) {
    update({
      access: loop.state.access.filter(function (row) {
        return row.origin !== origin
      })
    })
  })

  bus.shared.on('add-wallet', function (wallet) {
    update({
      wallets: loop.state.wallets.concat(wallet)
    })
  })

  bus.shared.on('remove-wallet', function (addr) {
    update({
      wallets: loop.state.wallets.filter(function (w) {
        return w.address !== addr
      })
    })
  })

  bus.local.on('error', function (err) {
    update({ error: err.message || String(err) })
  })
  bus.local.on('list-wallets', function (wallets) {
    update({ wallets: wallets })
  })
  bus.local.on('list-access', function (apps) {
    update({ access: apps })
  })

  function update (ref) {
    loop.update(xtend(loop.state, ref))
  }
}

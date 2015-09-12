var h = require('virtual-dom/h')
module.exports = function (m, emit) {
  var wallets = m.state.wallets.map(function (wallet) {
    return h('tr', [
      h('td.address', wallet.address),
      h('td', h('button', { onclick: remove }, 'remove'))
    ])
    function remove () { emit('remove-wallet', wallet.address) }
  })
  var table = h('table.wallets', [
    h('tr', [
      h('th', 'address'),
      h('th', 'actions')
    ])
  ].concat(wallets))
  if (wallets.length === 0) {
    table = h('div.info', 'no wallets to show')
  }
  return h('div#wallets', [
    h('h1.bar', [
      'wallets',
      h('div.buttons', [
        h('button', { onclick: createWallet }, 'new wallet')
      ])
    ]),
    h('div.padded', table)
  ])
  
  function createWallet (ev) { emit('create-wallet') }
}

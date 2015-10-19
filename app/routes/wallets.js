var h = require('virtual-dom/h')
module.exports = function (m, emit) {
console.log('RENDER', m.state.wallets)
  var wallets = m.state.wallets.map(function (wallet) {
    return h('tr', [
      h('td.address', wallet.address),
      h('td.network', wallet.network || '???'),
      h('td', [
        h('button', { onclick: remove }, 'remove'),
        h('button', { onclick: download }, 'download')
      ])
    ])
    function remove () { emit('remove-wallet', wallet.address) }
    function download () { emit('download-wallet', wallet) }
  })
  var table = h('table.wallets', [
    h('tr', [
      h('th', 'address'),
      h('th', 'network'),
      h('th', 'actions')
    ])
  ].concat(wallets))
  if (wallets.length === 0) {
    table = h('div.info', 'no wallets to show')
  }
  return h('div#wallets', [
    h('h1.bar', [ 'wallets' ]),
    h('div.padded', [
      h('form', { onsubmit: createWallet }, [
        h('select', { name: 'network' }, [
          h('option', 'bitcoin'),
          h('option', 'dogecoin'),
          h('option', 'litecoin'),
          h('option', 'testnet')
        ]),
        h('button', { type: 'submit' }, 'create wallet')
      ])
    ].concat(table))
  ])
  
  function createWallet (ev) {
    ev.preventDefault()
    emit('create-wallet', { network: this.elements.network.value })
  }
}

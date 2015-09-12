var Router = require('routes')
var router = new Router
var h = require('virtual-dom/h')

module.exports = router

router.addRoute('/', function (m) {
  return h('div', [
    h('h1.bar', 'log'),
    h('div.padded', 'log view')
  ])
})

router.addRoute('/wallets', function (m, emit) {
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
})

router.addRoute('/access', function (m, emit) {
  var apps = m.state.access.map(function (x) {
    return h('tr', [
      h('td.origin', x.origin),
      h('td', h('button', { onclick: remove }, 'remove'))
    ])
    function remove (ev) { emit('remove-access', x.origin) }
  })
  var table = h('table.access', [
    h('tr', [
      h('th', 'origin'),
      h('th', 'actions')
    ])
  ].concat(apps))

  if (apps.length === 0) {
    table = h('div.info', 'no applications have been authorized')
  }

  return h('div', [
    h('h1.bar', 'access'),
    h('div.padded#access', [
      h('form.add-access', { onsubmit: addAccess }, [
        h('div', [
          h('input', {
            type: 'text',
            name: 'origin',
            placeholder: 'application URL'
          }),
          h('button', { type: 'submit' }, 'authorize application')
        ]),
      ]),
      table
    ])
  ])

  function addAccess (ev) {
    ev.preventDefault()
    emit('add-access', this.elements.origin.value)
  }
})

router.addRoute('/send', function (m) {
  return h('div.padded', 'transfer view')
})

router.addRoute('/settings', function (m) {
  return h('div.padded', 'settings view')
})

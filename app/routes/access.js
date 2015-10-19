var h = require('virtual-dom/h')
module.exports = function (m, emit) {
  var apps = m.state.access.map(function (x) {
    return h('div', [
      h('h3', x.origin),
      h('div', x.wallet),
      h('div', [
        h('button', { onclick: remove }, 'remove')
      ])
    ])
    function remove (ev) { emit('remove-access', x.origin) }
  })

  if (apps.length === 0) {
    table = h('div.info', 'no applications have been authorized')
  }

  return h('div', [
    h('h1.bar', 'access'),
    h('div.padded#access', [
      h('form.add-access', { onsubmit: addAccess }, [
        h('h2', 'authorize new application'),
        h('div', h('input', {
          type: 'text',
          name: 'origin',
          placeholder: 'application URL'
        })),
        h('div', h('select', { name: 'wallet' },
        m.state.wallets.map(function (w) {
          return h('option', w.address)
        }))),
        h('div', h('button', { type: 'submit' },
          'authorize application'))
      ]),
      h('h2', 'authorized applications'),
      h('div', apps)
    ])
  ])

  function addAccess (ev) {
    ev.preventDefault()
    emit('add-access', {
      origin: this.elements.origin.value,
      wallet: this.elements.wallet.value
    })
  }
}

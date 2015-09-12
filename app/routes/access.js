var h = require('virtual-dom/h')
module.exports = function (m, emit) {
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
}

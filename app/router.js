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

router.addRoute('/wallets', require('./routes/wallets.js'))
router.addRoute('/access', require('./routes/access.js'))

router.addRoute('/send', function (m) {
  return h('div.padded', 'transfer view')
})

router.addRoute('/settings', function (m) {
  return h('div.padded', 'settings view')
})

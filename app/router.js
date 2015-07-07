var Router = require('routes');
var router = new Router;
var h = require('virtual-dom/h');

module.exports = router;

router.addRoute('/', function (m) {
    var wallets = m.state.wallets.map(function (wallet) {
        return h('div.wallet', [
            h('div.address', wallet.address)
        ]);
    });
    var requests = m.state.requests.map(function (req) {
        return h('div.request', [
            h('span.origin', req.origin),
            h('button', { onclick: reject }, 'reject'),
            h('button', { onclick: approve }, 'approve')
        ]);
        function reject (ev) {
            m.bus.emit('reject-origin', req.origin);
        }
        function approve (ev) {
            m.bus.emit('approve-origin', req.origin);
        }
    });
    return h('div', [
        h('div.buttons', [
            h('button', { onclick: createWallet }, 'create wallet'),
            h('button', 'import wallet')
        ]),
        h('div.wallets', wallets),
        h('div.requests', requests)
    ]);
    
    function createWallet (ev) {
        m.bus.emit('create-wallet');
    }
});

router.addRoute('/settings', function (m) {
    return h('div', 'settings todo');
});

var Router = require('routes');
var router = new Router;
var h = require('virtual-dom/h');

module.exports = router;

router.addRoute('/', function (m) {
    return h('div', [
        h('h1.bar', 'log'),
        h('div.padded', 'log view')
    ]);
});

router.addRoute('/wallets', function (m, emit) {
    var wallets = m.state.wallets.map(function (wallet) {
        return h('div.wallet', [
            h('div.address', wallet.address)
        ]);
    });
    return h('div', [
        h('h1.bar', [
            'wallets',
            h('div.buttons', [
                h('button', { onclick: createWallet }, 'new wallet')
            ])
        ]),
        h('div.padded', [
            h('div.wallets', wallets)
        ])
    ]);
    
    function createWallet (ev) {
        emit('create-wallet');
    }
});

router.addRoute('/access', function (m, emit) {
    var requests = m.state.requests.map(function (req) {
        return h('tr', [
            h('td.origin', req.origin),
            h('td', h('button', { onclick: reject }, 'reject')),
            h('td', h('button', { onclick: approve }, 'approve'))
        ]);
        function reject (ev) {
            emit('reject-origin', req.origin);
        }
        function approve (ev) {
            emit('approve-origin', req.origin);
        }
    });
    return h('div', [
        h('h1.bar', 'access'),
        h('div.padded', [
            h('table.requests', [
                h('tr', [
                    h('th', 'origin'),
                    h('th', 'action')
                ])
            ].concat(requests))
        ])
    ]);
});

router.addRoute('/send', function (m) {
    return h('div.padded', 'transfer view');
});

router.addRoute('/settings', function (m) {
    return h('div.padded', 'settings view');
});

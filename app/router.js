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
    return h('div', [
        h('div.buttons', [
            h('button', { onclick: createWallet }, 'create wallet'),
            h('button', 'import wallet')
        ]),
        h('div.wallets', wallets)
    ]);
    
    function createWallet (ev) {
        m.bus.emit('create-wallet');
    }
});

router.addRoute('/settings', function (m) {
    return h('div', 'settings todo');
});

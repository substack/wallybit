var h = require('virtual-dom/h');

module.exports = function (state) {
    var bar = h('div.bar', [
        h('h1', 'wallybox'),
        h('a', { href: '/' }, [ h('button', 'wallets') ]),
        h('a', { href: '/access' }, [ h('button', 'access') ]),
        h('a', { href: '/settings' }, [ h('button', 'settings') ]),
        h('a', { href: '/send' }, [ h('button', 'send') ])
    ]);
    var wallets = state.wallets.map(function (wallet) {
        return h('div.wallet', [
            h('div.address', wallet.address),
            h('div.wif', wallet.wif)
        ]);
    });
    return h('div', [
        bar,
        h('div.page', state.page || [])
    ]);
};

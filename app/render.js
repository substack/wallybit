var h = require('virtual-dom/h');
var router = require('./router.js');

module.exports = function (state, emit) {
    var m = router.match(state.url);
    var page = m && m.fn({
        params: m.params,
        state: state
    }, emit);
    var buttons = [
        { href: '/', text: 'log' },
        { href: '/wallets', text: 'wallets' },
        { href: '/access', text: 'access' },
        { href: '/send', text: 'send' },
        { href: '/settings', text: 'settings' }
    ];
    var bar = h('div.bar', [ h('h1', 'wallybit') ]
        .concat(buttons.map(function (b) {
            var ex = state.url === b.href ? '.active' : '';
            return h('a', { href: b.href }, [ h('button' + ex, b.text) ]);
        }))
    );
    return h('div', [
        bar,
        (state.error ? h('div.error', state.error) : ''),
        h('div.page', page || [])
    ]);
};

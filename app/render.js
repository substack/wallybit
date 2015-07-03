var h = require('virtual-dom/h');
var router = require('./router.js');

module.exports = function (state) {
    var m = router.match(state.url);
    var page = m && m.fn({
        params: m.params,
        bus: state.bus,
        state: state
    });
    
    var bar = h('div.bar', [
        h('h1', 'wallybit'),
        h('a', { href: '/' }, [ h('button', 'wallets') ]),
        h('a', { href: '/access' }, [ h('button', 'access') ]),
        h('a', { href: '/settings' }, [ h('button', 'settings') ]),
        h('a', { href: '/send' }, [ h('button', 'send') ])
    ]);
    return h('div', [
        bar,
        (state.error ? h('div.error', state.error) : ''),
        h('div.page', page || [])
    ]);
};

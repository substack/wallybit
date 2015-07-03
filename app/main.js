var level = require('level-browserify');
var db = level('wallybox');

var Box = require('../');
var box = new Box(db);

var main = require('main-loop');
var vdom = require('virtual-dom');

var state = {
    url: location.pathname,
    page: null,
    wallets: []
};
var render = require('./render.js');
var loop = main(state, render, vdom);
document.querySelector('#content').appendChild(loop.target);

var Router = require('routes');
var router = new Router;
var h = require('virtual-dom/h');

var singlePage = require('single-page');
var showPage = singlePage(function (href) {
    var m = router.match(href);
    if (m) {
        state.page = m.fn({ state: state, params: m.params });
        loop.update(state);
    }
    else location.href = href;
});

router.addRoute('/', function (m) {
    return h('div', m.state.wallets.map(function (wallet) {
        return h('div.wallet', [
            h('div.address', wallet.address),
            h('div.wif', wallet.wif)
        ]);
    }));
});

router.addRoute('/settings', function (m) {
    return h('div', 'settings todo');
});

var catcher = require('catch-links');
catcher(window, showPage);

var RPC = require('frame-rpc');
var origin = document.referrer;
var rpc = RPC(window, window.parent, origin, {
    // ... todo ...
});

box.listWallets(function (err, wallets) {
    if (err) return showError();
    state.wallets = wallets;
    loop.update(state);
});

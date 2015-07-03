var level = require('level-browserify');
var db = level('wallybox');
window.db = db;

var Box = require('../');
var box = new Box(db);

var main = require('main-loop');
var vdom = require('virtual-dom');

var EventEmitter = require('events').EventEmitter;
var bus = new EventEmitter;

bus.on('create-wallet', function () {
    box.createWallet(function (err, wallet) {
        if (err) return showError(err);
        state.wallets.push(wallet);
        loop.update(state);
    });
});

var state = {
    url: location.pathname,
    page: null,
    bus: bus,
    wallets: []
};
var loop = main(state, require('./render.js'), vdom);
document.querySelector('#content').appendChild(loop.target);

var router = require('./router.js');
var singlePage = require('single-page');
var showPage = singlePage(function (href) {
    state.url = href;
    loop.update(state);
});
var catcher = require('catch-links');
catcher(window, showPage);

var RPC = require('frame-rpc');
var origin = document.referrer;
var rpc = RPC(window, window.parent, origin, {
    // ... todo ...
});

box.listWallets(function (err, wallets) {
    if (err) return showError(err);
    state.wallets = wallets;
    loop.update(state);
});

function showError (err) {
    state.error = err.message || String(err);
    loop.update(state);
}

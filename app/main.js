var level = require('level-browserify');
var db = level('wallybox');
window.db = db;

var Box = require('../');
var box = new Box(db);

var main = require('main-loop');
var vdom = require('virtual-dom');

var EventEmitter = require('events').EventEmitter;
var ui = new EventEmitter;

ui.on('create-wallet', function () {
    box.createWallet(function (err, wallet) {
        if (err) return showError(err);
        state.wallets.push(wallet);
        loop.update(state);
    });
});

ui.on('reject', function (origin) {
    box.rejectRequest(origin, function (err) {
        if (err) return showError(err);
    });
});

box.on('request', function (origin, req) {
console.log('REQUEST!!!!!', origin);
    state.requests.push(req);
    loop.update(state);
});

box.on('reject', function (origin, req) {
console.log('REJECT!!!!!', origin);
    state.requests = state.requests.filter(function (req) {
        return req.origin !== origin;
    });
    loop.update(state);
});

var state = {
    url: location.pathname,
    page: null,
    bus: ui,
    wallets: [],
    requests: []
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

var hello = require('hello-frame-rpc');
hello.listen('*', function (rpc) {
    var methods = {};
    methods.request = function (req, cb) {
console.log('REQUEST', rpc.origin); 
        box.request(rpc.origin, req, cb);
    };
    return methods;
});

box.listWallets(function (err, wallets) {
    if (err) return showError(err);
    state.wallets = wallets;
    loop.update(state);
});

box.listRequests(function (err, requests) {
    if (err) return showError(err);
    state.requests = requests;
    loop.update(state);
});

function showError (err) {
    state.error = err.message || String(err);
    loop.update(state);
}

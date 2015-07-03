var bitcoin = require('bitcoinjs-lib');
var defined = require('defined');
var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
var through = require('through2');
var readonly = require('read-only-stream');

var randomBytes = require('randombytes');
function defaultRng () { return randomBytes(32) }

module.exports = Box;

function Box (db, opts) {
    if (!(this instanceof Box)) return new Box(db, opts);
    if (!opts) opts = {};
    this.rng = defined(opts.rng, defaultRng);
    this.db = db;
}

Box.prototype.createWallet = function (opts, cb) {
    if (typeof opts === 'function') {
        cb = opts;
        opts = {};
    }
    if (!opts) opts = {};
    
    var keypair;
    if (opts.wif) {
        keypair = bitcoin.ECPair.fromWIF(opts.wif);
    }
    else {
        keypair = bitcoin.ECPair.makeRandom({
            rng: defined(opts.rng, this.rng)
        });
    }
    
    var addr = keypair.getAddress().toString();
    var wif = keypair.toWIF();
    
    this.db.put('wallet!' + addr, wif, function (err) {
        cb(null, addr);
    });
};

Box.prototype.listWallets = function (cb) {
    var r = db.createReadStream({ gt: 'wallet!', lt: 'wallet!~' });
    return readonly(r.pipe(through.obj(function (row, enc, next) {
        this.push({
            address: row.key.split('!')[0],
            wif: row.value
        });
        next();
    })));
};


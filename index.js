var bitcoin = require('bitcoinjs-lib')

var through = require('through2')
var readonly = require('read-only-stream')
var pump = require('pump')

var defined = require('defined')
var once = require('once')
var xtend = require('xtend')
function noop () {}

var defaults = require('levelup-defaults')
var normOrigin = require('./lib/norm_origin.js')

var randomBytes = require('randombytes')
function defaultRng () { return randomBytes(32) }

module.exports = Box

function Box (db, opts) {
  if (!(this instanceof Box)) return new Box(db, opts)
  if (!opts) opts = {}
  this.rng = defined(opts.rng, defaultRng)
  this.db = defaults(db, { valueEncoding: 'json' })
}

Box.prototype.addAccess = function (opts, cb) {
  var self = this
  var origin = normOrigin(opts.origin)
  if (!cb) cb = noop
  if (!opts.wallet) return error(cb, 'opts.wallet required')
  var value = {
    permissions: opts.permissions || {},
    wallet: opts.wallet
  }

  self.db.put('access!' + origin, value, function (err) {
    if (err) cb(err)
    else cb(null, value)
  })
}

Box.prototype.removeAccess = function (origin, cb) {
  var self = this
  if (!cb) cb = noop
  self.db.del('access!' + origin, cb)
}

Box.prototype.listAccess = function (cb) {
  return this._list('access', function (row) {
    return xtend(row.value, {
      origin: row.key.split('!')[1]
    })
  }, cb)
}

Box.prototype.createWallet = function (opts, cb) {
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }
  if (!opts) opts = {}
  var keypair = bitcoin.ECPair.makeRandom({
    rng: defined(opts.rng, this.rng)
  })
  var wif = keypair.toWIF(opts.network)
  this.addWallet(xtend(opts, { wif: wif }), cb)
}

Box.prototype.addWallet = function (opts, cb) {
  var self = this
  if (!cb) cb = noop
  if (!opts || typeof opts !== 'object') return error(cb, 'opts required')
  if (!opts.wif) return error(cb, 'opts.wif required')
  if (!opts.network) return error(cb, 'opts.network required')
  var network = bitcoin.networks[opts.network]
  if (!network) return error(cb, 'network not recognized')

  var keypair = bitcoin.ECPair.fromWIF(opts.wif)
  var addr = keypair.getAddress(network).toString()
  var rec = { address: addr, wif: opts.wif, network: opts.network }
  var value = { wif: opts.wif, network: opts.network }
  self.db.batch([
    { type: 'put', key: 'wallet!' + addr, value: value },
    { type: 'put', key: 'wallet-network!' + opts.network + '!' + addr,
      value: {} }
  ], onbatch)
  function onbatch (err) {
    if (err) cb(err)
    else cb(null, rec)
  }
}

Box.prototype.removeWallet = function (addr, cb) {
  var self = this
  if (!cb) cb = noop
  self.db.get('wallet!' + addr, function (err, row) {
    if (err) return cb(err)
    var ops = [ { type: 'del', key: 'wallet!' + addr } ]
    if (row && row.value && row.value.network) {
      ops.push({ type: 'del',
        key: 'wallet-network!' + row.value.network + '!' + addr
      })
    }
    self.db.batch(ops, function onbatch (err) {
      if (err) cb(err)
      else cb(null, addr)
    })
  })
}

Box.prototype.listWallets = function (cb) {
  return this._list('wallet', function (row) {
    return xtend(row.value, {
      address: row.key.split('!')[1]
    })
  }, cb)
}

Box.prototype._list = function (key, fn, cb) {
  cb = once(cb)
  var r = this.db.createReadStream({ gt: key + '!', lt: key + '!~' })
  var results = cb ? [] : null

  var stream = pump(r, through.obj(function (row, enc, next) {
    var rec = fn(row)
    if (results) results.push(rec)
    this.push(rec)
    next()
  }))
  if (cb) {
    stream.once('error', cb)
    stream.on('end', function () { cb(null, results) })
    process.nextTick(function () { stream.resume() })
  }
  return readonly(stream)
}

function error (cb, msg) {
  var err = new Error(msg)
  process.nextTick(function () { cb(err) })
}

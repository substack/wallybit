var bitcoin = require('bitcoinjs-lib')

var through = require('through2')
var readonly = require('read-only-stream')
var pump = require('pump')

var defined = require('defined')
var once = require('once')
var xtend = require('xtend')
function noop () {}

var defaults = require('levelup-defaults')
var EventEmitter = require('events').EventEmitter

var normOrigin = require('./lib/norm_origin.js')

var randomBytes = require('randombytes')
function defaultRng () { return randomBytes(32) }

module.exports = Box

function Box (db, opts) {
  if (!(this instanceof Box)) return new Box(db, opts)
  if (!opts) opts = {}
  this.rng = defined(opts.rng, defaultRng)
  this.db = defaults(db, { valueEncoding: 'json' })
  this.network = defined(opts.network, bitcoin.networks.bitcoin)
  this.events = opts.events || new EventEmitter
}

Box.prototype.addAccess = function (origin, perms, cb) {
  var self = this
  origin = normOrigin(origin)
  if (!cb) cb = noop
  self.db.put('access!' + origin, perms, function (err) {
    if (err) return cb(err)
    cb(null, perms)
    self.events.emit('add-access', origin, perms)
  })
}

Box.prototype.removeAccess = function (origin, cb) {
  var self = this
  if (!cb) cb = noop
  self.db.del('access!' + origin, function (err) {
    if (err) return cb(err)
    cb(null)
    self.events.emit('remove-access', origin)
  })
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
  var wif = keypair.toWIF(this.network)
  this.addWallet(wif, cb)
}

Box.prototype.addWallet = function (wif, cb) {
  var self = this
  var keypair = bitcoin.ECPair.fromWIF(wif)
  var addr = keypair.getAddress(self.network).toString()
  var rec = { address: addr, wif: wif }
  var value = { wif: wif }
  self.db.put('wallet!' + addr, value, function (err) {
    if (err) return cb(err)
    cb(null, rec)
    self.events.emit('add-wallet', rec)
  })
}

Box.prototype.removeWallet = function (addr, cb) {
  var self = this
  self.db.del('wallet!' + addr, function (err) {
    if (err) return cb(err)
    cb(null, addr)
    self.events.emit('remove-wallet', addr)
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

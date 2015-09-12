var bitcoin = require('bitcoinjs-lib')

var through = require('through2')
var readonly = require('read-only-stream')
var pump = require('pump')

var defined = require('defined')
var inherits = require('inherits')
var PageBus = require('page-bus')
var once = require('once')
var xtend = require('xtend')
function noop () {}

var defaults = require('levelup-defaults')

var normOrigin = require('./lib/norm_origin.js')

var randomBytes = require('randombytes')
function defaultRng () { return randomBytes(32) }

module.exports = Box
inherits(Box, PageBus)

function Box (db, opts) {
  if (!(this instanceof Box)) return new Box(db, opts)
  PageBus.call(this)
  if (!opts) opts = {}
  this.rng = defined(opts.rng, defaultRng)
  this.db = defaults(db, { valueEncoding: 'json' })
  this.network = defined(opts.network, bitcoin.networks.bitcoin)
}

Box.prototype.addAccess = function (origin, perms, cb) {
  var self = this
  origin = normOrigin(origin)
  if (!cb) cb = noop
  self.db.put('access!' + origin, perms, function (err) {
      if (err) return cb(err)
      cb(null, perms)
      self.emit('add-access', origin, perms)
  })
}

Box.prototype.removeAccess = function (origin, cb) {
  var self = this
  if (!cb) cb = noop
  self.db.del('access!' + origin, function (err) {
      if (err) return cb(err)
      cb(null)
      self.emit('remove-access', origin)
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
  
  var keypair
  if (opts.wif) {
      keypair = bitcoin.ECPair.fromWIF(opts.wif)
  }
  else {
      keypair = bitcoin.ECPair.makeRandom({
          rng: defined(opts.rng, this.rng)
      })
  }
  
  var addr = keypair.getAddress(this.network).toString()
  var wif = keypair.toWIF(this.network)
  var rec = { address: addr, wif: wif }
  var value = { wif: wif }
  
  this.db.put('wallet!' + addr, value, function (err) {
      if (err) cb(err)
      else cb(null, rec)
  })
}

Box.prototype.listWallets = function (cb) {
  return this._list('wallet', function (row) {
      return xtend(row.value, {
          address: row.key.split('!')[1],
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

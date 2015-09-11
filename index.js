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

Box.prototype.request = function (origin, req, cb) {
  var self = this
  origin = normOrigin(origin)
  cb = once(cb || noop)
  var pending = 3, results = {}
  self.db.get('request!' + origin, onreq)
  self.db.get('approved!' + origin, onorigin)
  self.db.get('block!' + origin, onblock)
  
  function onblock (err) {
      if (err && err.type !== 'NotFoundError') return cb(err)
      results.block = err ? false : true
      if (-- pending === 0) done()
  }
  function onorigin (err, perms) {
      if (err && err.type !== 'NotFoundError') return cb(err)
      results.perms = perms
      if (-- pending === 0) done()
  }
  function onreq (err, req) {
      if (err && err.type !== 'NotFoundError') return cb(err)
      results.request = req
      if (-- pending === 0) done()
  }
  function done () {
      if (results.origin) return cb(null, results.origin)
      else if (results.block) return cb(null, false)
      self.db.put('request!' + origin, req, function (err) {
          if (err) return cb(err)
          cb(null)
          req.origin = origin
          self.emit('request', origin, req)
      })
  }
}

Box.prototype.approveRequest = function (origin, cb) {
  var self = this
  origin = normOrigin(origin)
  if (!cb) cb = noop
  self.db.get('request!' + origin, function (err, perms) {
      if (err) return cb(err)
      self.db.batch([
          { type: 'del', key: 'request!' + origin },
          { type: 'put', key: 'approved!' + origin, value: perms }
      ], onbatch)
      function onbatch (err) {
          if (err) return cb(err)
          cb(null, perms)
          self.emit('approve', origin, perms)
      }
  })
}

Box.prototype.rejectRequest = function (origin, cb) {
  var self = this
  if (!cb) cb = noop
  self.db.del('request!' + origin, function (err) {
      if (err) return cb(err)
      cb(null)
      self.emit('reject', origin)
  })
}

Box.prototype.revokeOrigin = function (origin, cb) {
  var self = this
  if (!cb) cb = noop
  self.db.del('approved!' + origin, function (err) {
      if (err) return cb(err)
      cb(null)
      self.emit('revoke', origin)
  })
}

Box.prototype.blockOrigin = function (origin, cb) {
  var self = this
  self.db.put('blocked!' + origin, {}, function (err) {
      cb(null)
  })
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

Box.prototype.listRequests = function (cb) {
  return this._list('request', function (row) {
      return xtend(row.value, {
          origin: row.key.split('!')[1]
      })
  }, cb)
}

Box.prototype.listApproved = function (cb) {
  return this._list('approved', function (row) {
      return xtend(row.value, {
          origin: row.key.split('!')[1]
      })
  }, cb)
}

Box.prototype.listBlocked = function (cb) {
  return this._list('blocked', function (row) {
      return xtend(row.value, {
          origin: row.key.split('!')[1]
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

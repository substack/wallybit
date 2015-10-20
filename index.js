var bitcoin = require('bitcoinjs-lib')
var url = require('url')

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
  this.endpoint = opts.endpoint || location.protocol + '//' + location.host
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

Box.prototype.send = function (srcAddr, dstAddr, amount, cb) {
  var self = this
  var pending = 2
  cb = once(cb || noop)
  var tx = new bitcoin.TransactionBuilder()
  tx.addOutput(dstAddr, amount)
  var keypair

  this.getWallet(srcAddr, function (err, wallet) {
    if (err) return cb(err)
    keypair = bitcoin.ECPair.fromWIF(wallet.wif)
    if (--pending === 0) done()
  })

  this.getLastBlock(function (err, input) {
    if (err) return cb(err)
    tx.addInput(input, 0)
    if (--pending === 0) done()
  })

  function done () {
    tx.sign(0, keypair)
    var sig = tx.build().toHex()
    self.sendRawTransaction(sig, cb)
  }
}

Box.prototype.sendRawTransaction = function (sig, cb) {
  xhr({
    method: 'POST',
    url: url.resolve(this.endpoint, '/sendrawtransaction'),
    body: sig
  }, onpost)
  function onpost (err, res, body) {
    if (err) cb(err)
    else if (!/^2/.test(res.statusCode)) {
      cb(new Error(res.statusCode + ': ' + body))
    } else cb(null)
  }
}

Box.prototype.getLastBlock = function (cb) {
  xhr({
    method: 'GET',
    url: url.resolve(this.endpoint, '/lastblock')
  }, onget)

  function onget (err, res, body) {
    if (err) cb(err)
    else if (/^2/.test(res.statusCode)) {
      body = String(body).trim()
      if (!/^[0-9A-Fa-f]{64}$/.test(body)) {
        cb(new Error('invalid response for /lastblock:' + body))
      } else cb(body)
    }
  }
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

Box.prototype.getWallet = function (addr, cb) {
  this.db.get('wallet!' + addr, function (err, row) {
    if (err) cb(err)
    else cb(null, xtend(row, { address: addr }))
  })
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

function noop () {}

var http = require('http')
var body = require('body/any')

var server = http.createServer(function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers',
    'Authorization, Content-Type, If-Match, If-Modified-Since, If-None-Match, '
    + 'If-Unmodified-Since')
  res.setHeader('cache-control', 'no-cache')
  res.setHeader('max-age', '0')

  if (req.method === 'OPTIONS') return res.end('')
  if (req.method === 'POST' && req.url === '/sendrawtransaction') {
    body(req, res, function (err, src) {
      if (err) {
        res.statusCode = 500
        res.end(err + '\n')
      } else res.end('todo: forward to bitcoind\n')
    })
  } else if (req.method === 'GET' && req.url === '/lastblock') {
    res.end('todo: forward to bitcoind\n')
  }
})
server.listen(8000)

var rpc = require('hello-frame-rpc')
var button = document.querySelector('button#send')

button.addEventListener('click', function () {
  rpc.connect('http://localhost:8000', {}, function (err, remote) {
    remote.call('request', { hello: 'world' }, function (err, res) {
      console.log('RES', err, res)
    })
  })
})

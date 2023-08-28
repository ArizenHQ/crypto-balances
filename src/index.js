const express = require('express')
const app = express()
var cors = require('cors')
const balance = require("./crypto-balance");
var allowlist = ['http://localhost', 'https://staging.custody.coinhouse.com', 'https://custody.coinhouse.com'];

var corsOptionsDelegate = function (req, callback) {
  var corsOptions;
  if (allowlist.indexOf(req.header('Origin')) !== -1) {
    corsOptions = { origin: true } // reflect (enable) the requested origin in the CORS response
  } else {
    corsOptions = { origin: false } // disable CORS for this request
  }
  callback(null, corsOptions) // callback expects two parameters: error and options
}

app.get('/:coin/:addr', cors(corsOptionsDelegate), function (req, res) {
    balance(req.params.addr, req.params.coin)
    .then(items => res.send(items))
    .catch(error => res.send({ "error": error.message }));
});

app.get('/:addr', cors(corsOptionsDelegate), function (req, res) {
    balance(req.params.addr)
    .then(items => res.send(items))
    .catch(error => res.send({ "error": error.message }));
});

app.use('*', cors(corsOptionsDelegate), function (req, res) {
    res.send({ "error": "invalid route" });
});

app.listen(8888, function () {
    console.log('App listening on port 8888!')
});

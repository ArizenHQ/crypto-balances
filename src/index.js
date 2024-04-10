const express = require('express');
const NodeCache = require('node-cache');
const app = express();
var cors = require('cors');
const balance = require('./crypto-balance');
require('dotenv').config();

const cache = process.env.NO_CACHE ? new NodeCache({ stdTTL: 0 }) : new NodeCache({ stdTTL: 300 });

app.use(cors());

app.get('/:coin/:addr', function (req, res) {
    const cacheKey = `${req.params.coin}-${req.params.addr}`;
    const cachedResponse = cache.get(cacheKey);
    if (cachedResponse) {
        res.send(cachedResponse);
    } else {
        balance(req.params.addr, req.params.coin)
            .then((items) => {
                cache.set(cacheKey, items);

                res.send(items);
            })
            .catch((error) => res.send({ error: error.message }));
    }
});

app.get('/:addr', function (req, res) {
    const cacheKey = req.params.addr;
    const cachedResponse = cache.get(cacheKey);

    if (cachedResponse) {
        res.send(cachedResponse);
    } else {
        balance(req.params.addr)
            .then((items) => {
                cache.set(cacheKey, items);
                res.send(items);
            })
            .catch((error) => res.send({ error: error.message }));
    }
});

app.use('*', function (req, res) {
    res.send({ error: 'invalid route' });
});

app.listen(8888, function () {
    console.log('App listening on port 8888!');
});

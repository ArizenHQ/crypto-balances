const Bluebird = require("bluebird");
const req = Bluebird.promisify(require("request"));
const bs58check = require("bs58check");
const decimals = 8;
const multiplier = Math.pow(10, decimals);

// See: https://www.blockonomics.co/views/segwit_xpub_convert.html
function xpubSegwitConverter(xpub, generate = "ypub") {
  function hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
      bytes.push(parseInt(hex.substr(c, 2), 16));
    return new Uint8Array(bytes);
  }
  if (!xpub.startsWith("xpub")) {
    throw error("Incorrect xpub");
  }
  xpub_bin = bs58check.decode(xpub);
  if (generate == "ypub") {
    prefix = "049d7cb2";
  } else if (generate == "zpub") {
    prefix = "04b24746";
  }
  prefix_bin = hexToBytes(prefix);
  xpub_bin.set(prefix_bin, 0);
  return bs58check.encode(xpub_bin);
}

const blockchain = (module.exports = {
  supported_address: ["BTC"],

  check(addr) {
    return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/.test(addr);
  },

  symbol() {
    return "BTC";
  },

  fetch(addr) {
    const url = `https://blockchain.info/balance?active=${addr}`;

    return req(url, { json: true })
      .timeout(5000)
      .cancellable()
      .spread(function (resp, body) {
        if (body.error) {
          console.error(body);
          throw new Error(JSON.stringify(body));
        }
        if (resp.statusCode < 200 || resp.statusCode >= 300)
          throw new Error(JSON.stringify(resp));
        let balance = 0;
        balance = parseInt(body[addr].final_balance) / multiplier;
        1;
        /*
        if (balance == 0 && addr[0] == "x") {
          return blockchain.fetch(xpubSegwitConverter(addr));
        }
        */
        let results = [];
        if(balance > 0) {
          results.push({
            asset: "DOGE",
            quantity: balance,
            blockchain: "DOGECOIN",
          });
        }
        return results;
      });
  },
});

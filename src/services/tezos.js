const Bluebird = require("bluebird");
const get = Bluebird.promisify(require("request").get);

module.exports = {
  supported_address: ["XTZ", "TEZOS"],

  check(addr) {
    return RegExp("^(tz1|tz2|tz3|KT1)[a-zA-Z0-9]{33}$").test(addr);
  },

  symbol() {
    return "XTZ";
  },
  fetch(addr) {
    const url = `https://api.tzkt.io/v1/accounts/${addr}`;
    const headers = { "Content-Type": "application/json" };
    return get(url, { json: true, headers: headers})
      .timeout(10000)
      .cancellable()
      .spread((resp, json) => {        
        if (resp.statusCode === 404) {
          return [{
            asset: "XTZ",
            quantity: 0,
            blockchain: "TEZOS",
          }];
        }
        if (resp.statusCode < 200 || resp.statusCode >= 300)
          throw new Error(JSON.stringify(resp));
        if (json.error) throw new Error(json.error.message);
        let results = [];
        if (json && json.balance !== undefined) {
          results.push({
            asset: "XTZ",
            quantity: parseFloat(json.balance * 10 ** -6),
            blockchain: "TEZOS",
          });
        } else {
          results.push({
            asset: "XTZ",
            quantity: 0,
            blockchain: "TEZOS",
          });
        }
        return results;
      });
  },
};


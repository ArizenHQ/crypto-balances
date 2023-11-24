const Bluebird = require("bluebird");
const get = Bluebird.promisify(require("request").get);
const config = require("./configs/near.json");


// 76DA185BD1804C30BBFF07D95854E8C7

module.exports = {
  supported_address: ["NEAR"],

  check(addr) {
    return RegExp("^[0-9a-f]{64}$").test(addr);
  },

  symbol() {
    return "NEAR";
  },
  fetch(addr) {
    const url = `https://api.nearblocks.io/v1/account/${addr}`;
    const headers = { "Content-Type": "application/json", "Authorization": "Bearer " + process.env.near_api_key };
    return get(url, { json: true, headers: headers})
      .timeout(10000)
      .cancellable()
      .spread((resp, json) => {        
        if (resp.statusCode < 200 || resp.statusCode >= 300)
          throw new Error(JSON.stringify(resp));
        if (json.error) throw new Error(json.error.message);
        let results = [];
        if (json.account) {
          results.push({
            asset: "NEAR",
            quantity: parseFloat(json.account[0].amount * 10 ** -24),
            blockchain: "near",
          });
        }
        return results;
      });
  },
};

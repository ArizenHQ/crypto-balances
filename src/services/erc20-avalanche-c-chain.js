const Bluebird = require("bluebird");
const get = Bluebird.promisify(require("request").get);
const config = require("./configs/ethereum.json");

module.exports = {
  supported_address: ["ETH"],

  check(addr) {
    return RegExp("^(0x)?[0-9a-fA-F]{40}$").test(addr);
  },

  symbol() {
    return "ETH";
  },

  fetch(addr) {
    const url = `https://glacier-api.avax.network/v1/chains/43114/addresses/${addr}/balances:listErc20`;
    const headers = { "Content-Type": "application/json", "x-glacier-api-key": process.env.avax_glacier_api_key };
    return get(url, { json: true, headers: headers})
      .timeout(10000)
      .cancellable()
      .spread((resp, json) => {
        if (resp.statusCode < 200 || resp.statusCode >= 300)
          throw new Error(JSON.stringify(resp));
        if (json.error) throw new Error(json.error.message);
        let results = [];
        if (json.erc20TokenBalances) {
          json.erc20TokenBalances.map((token) => {
            const { address, balance, decimals, symbol, name } = token;
            results.push({
              asset: address,
              quantity: balance / Math.pow(10, parseInt(decimals)|| 0),
              blockchain: "avalanche-c-chain",
            });
          });
        }
        return results;
      });
  },
};

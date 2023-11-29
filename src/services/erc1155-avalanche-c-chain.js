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
    const url = `https://glacier-api.avax.network/v1/chains/43114/addresses/${addr}/balances:listErc1155`;
    const headers = { "Content-Type": "application/json", "x-glacier-api-key": process.env.avax_glacier_api_key };
    return get(url, { json: true, headers: headers})
      .timeout(10000)
      .cancellable()
      .spread((resp, json) => {
        if (resp.statusCode < 200 || resp.statusCode >= 300)
          throw new Error(JSON.stringify(resp));
        if (json.error) throw new Error(json.error.message);
        let results = [];
        if (json.erc1155TokenBalances) {
          json.erc1155TokenBalances.map((token) => {
            const { address, balance, tokenId, metadata } = token;
            results.push({
              asset: address,
              tokenId: tokenId,
              quantity: parseFloat(balance * 10 ** -18),
              blockchain: "avalanche-c-chain",
              metadata: metadata,
            });
          });
        }
        return results;
      });
  },
};

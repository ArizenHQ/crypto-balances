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
    const url = `https://glacier-api.avax.network/v1/chains/43114/addresses/${addr}/balances:listErc721`;
    const headers = { "Content-Type": "application/json", "x-glacier-api-key": process.env.avax_glacier_api_key };
    return get(url, { json: true, headers: headers})
      .timeout(10000)
      .cancellable()
      .spread((resp, json) => {
        if (resp.statusCode < 200 || resp.statusCode >= 300)
          throw new Error(JSON.stringify(resp));
        if (json.error) throw new Error(json.error.message);
        let results = [];
        if (json.erc721TokenBalances) {
          json.erc721TokenBalances.map((token) => {
            const { address, tokenId, metadata } = token;
            token.contractMetadata = metadata;
            results.push({
              asset: address,
              tokenId: tokenId,
              quantity: 1,
              blockchain: "avalanche-c-chain",
              metadata: token,
            });
          });
        }
        return results;
      });
  },
};

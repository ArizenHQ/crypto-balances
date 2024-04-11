const Bluebird = require("bluebird");
const post = Bluebird.promisify(require("request").post);
const config = require("./configs/ethereum.json");

module.exports = {
  supported_address: ["MATIC"],

  check(addr) {
    return RegExp("^(0x)?[0-9a-fA-F]{40}$").test(addr);
  },

  symbol() {
    return "MATIC";
  },
  fetch(addr) {
    const url = `https://polygon-mainnet.g.alchemy.com/v2/${process.env.alchemyKeyPolygon}`;
    const params = [addr];
    const headers = { "Content-Type": "application/json" };
    const body = { jsonrpc: "2.0", method: "eth_getBalance", params, headers };
    return post(url, { json: true, json: body })
      .timeout(10000)
      .cancellable()
      .spread((resp, json) => {
        if (resp.statusCode < 200 || resp.statusCode >= 300)
          throw new Error(JSON.stringify(resp));
        if (json.error) throw new Error(json.error.message);
        let results = [];
        if (json.result) {
          results.push({
            asset: "MATIC",
            quantity: parseFloat(parseInt(json.result, 16) * 10 ** -18),
            blockchain: "POLYGON",
          });
        }
        return results;
      });
  },
};

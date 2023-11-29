const Bluebird = require("bluebird");
const post = Bluebird.promisify(require("request").post);
const config = require("./configs/ethereum.json");

module.exports = {
  supported_address: ["AVAX"],

  check(addr) {
    return RegExp("^(0x)?[0-9a-fA-F]{40}$").test(addr);
  },

  symbol() {
    return "AVAX";
  },
  fetch(addr) {
    const url = `https://api.avax.network/ext/bc/C/rpc`;
    const params = [addr,"latest"];
    const headers = { "Content-Type": "application/json" };
    const body = { jsonrpc: "2.0", method: "eth_getBalance", params, headers, "id": 1 };
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
            asset: "AVAX",
            quantity: parseFloat(parseInt(json.result, 16) * 10 ** -18),
            blockchain: "avalanche-c-chain",
          });
        }
        return results;
      });
  },
};

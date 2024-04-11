const Bluebird = require("bluebird");
const post = Bluebird.promisify(require("request").post);

module.exports = {
  supported_address: ["SOL"],

  check(addr) {
    return RegExp("^[1-9A-HJ-NP-Za-km-z]{32,44}$").test(addr);
  },

  symbol() {
    return "SOL";
  },
  fetch(addr) {
    const url = `https://solana-mainnet.g.alchemy.com/v2/${process.env.alchemyKeySolana}`;
    const params = [
      addr,
      {
        commitment: "finalized",
      },
    ];
    const headers = { "Content-Type": "application/json" };
    const body = { jsonrpc: "2.0", method: "getBalance", params, id: 1 };

    return post(url, { json: true, json: body, headers })
      .timeout(10000)
      .cancellable()
      .spread((resp, json) => {
        if (resp.statusCode < 200 || resp.statusCode >= 300)
          throw new Error(JSON.stringify(resp));
        if (json.error) throw new Error(json.error.message);
        let results = [];
        if (json.result) {
          if (json.result.value) {
            results.push({
              asset: "SOL",
              quantity: parseFloat(parseInt(json.result.value) * 10 ** -9),
              blockchain: "SOLANA",
            });
          }
        }
        return results;
      });
  },
};

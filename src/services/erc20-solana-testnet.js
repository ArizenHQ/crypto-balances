const Bluebird = require("bluebird");
const post = Bluebird.promisify(require("request").post);
const config = require("./configs/ethereum.json");

module.exports = {
  supported_address: ["SOL"],

  check(addr) {
    return RegExp("^(0x)?[0-9a-fA-F]{40}$").test(addr);
  },

  symbol() {
    return "SOL";
  },

  fetch(addr) {
    const url = `https://solana-mainnet.g.alchemy.com/v2/${process.env.alchemyKeySolana}`;
    const params = [addr, "erc20"];
    const headers = { "Content-Type": "application/json" };
    const body = {
      jsonrpc: "2.0",
      method: "alchemy_getTokenBalances",
      params,
      headers,
    };
    return post(url, { json: true, json: body })
      .timeout(10000)
      .cancellable()
      .spread((resp, json) => {
        if (resp.statusCode < 200 || resp.statusCode >= 300)
          throw new Error(JSON.stringify(resp));
        if (json.error) throw new Error(json.error.message);
        let results = [];
        if (json.result.tokenBalances) {
          json.result.tokenBalances.map((token) => {
            const { contractAddress, tokenBalance } = token;
            let decimals = 0;
            let name = contractAddress;
            if(config[contractAddress.toLowerCase()]){
              name=config[contractAddress].name;
              decimals=config[contractAddress].decimals;
            }
            results.push({
              asset: contractAddress,
              quantity: parseFloat(parseInt(tokenBalance, 16)) / Math.pow(10, parseInt(decimals)|| 0),
              blockchain: "solana",
            });
          });
        }
        return results;
      });
  },
};

const Bluebird = require("bluebird");
const get = Bluebird.promisify(require("request").get);

const GWEI_TO_ETH = 1e9;

module.exports = {
  supported_address: ["ETH"],

  check(addr) {
    return RegExp("^(0x)?[0-9a-fA-F]{40}$").test(addr);
  },

  symbol() {
    return "ETH";
  },

  fetch(addr) {
    const apiKey = process.env.beaconchainApiKey;
    const url = `https://beaconcha.in/api/v1/validator/eth1/${addr}${apiKey ? `?apikey=${apiKey}` : ""}`;
    return get(url, { json: true })
      .timeout(10000)
      .cancellable()
      .spread((resp, json) => {
        if (resp.statusCode === 401) return [];
        if (resp.statusCode < 200 || resp.statusCode >= 300)
          throw new Error(JSON.stringify(resp));
        if (!json || json.status !== "OK" || !json.data || json.data.length === 0) {
          return [];
        }

        const validators = json.data.map((v) => ({
          index: v.validatorindex,
          pubkey: v.pubkey,
          status: v.status,
          balanceETH: v.balance / GWEI_TO_ETH,
          effectiveBalanceETH: v.effectivebalance / GWEI_TO_ETH,
        }));

        const totalStakedETH = validators.reduce((sum, v) => sum + v.effectiveBalanceETH, 0);
        const totalBalanceETH = validators.reduce((sum, v) => sum + v.balanceETH, 0);
        const activeValidators = validators.filter((v) =>
          v.status && v.status.startsWith("active")
        ).length;

        return [
          {
            asset: "ETH_STAKING",
            blockchain: "ETHEREUM",
            staking: {
              validatorCount: validators.length,
              activeValidators,
              totalStakedETH: parseFloat(totalStakedETH.toFixed(6)),
              totalBalanceETH: parseFloat(totalBalanceETH.toFixed(6)),
              totalRewardsETH: parseFloat((totalBalanceETH - totalStakedETH).toFixed(6)),
              validators,
            },
          },
        ];
      });
  },
};

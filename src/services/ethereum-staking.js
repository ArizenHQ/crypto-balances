const Bluebird = require("bluebird");
const get = Bluebird.promisify(require("request").get);

const GWEI_TO_ETH = 1e9;
// beaconcha.in free tier: keep batch small to avoid rate limits
const MAX_VALIDATORS_PER_BATCH = 20;

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
    const apiKeyParam = apiKey ? `?apikey=${apiKey}` : "";

    // Step 1: get validator indices for this ETH1 address
    const eth1Url = `https://beaconcha.in/api/v1/validator/eth1/${addr}${apiKeyParam}`;
    return get(eth1Url, { json: true })
      .timeout(10000)
      .cancellable()
      .spread((resp, json) => {
        if (resp.statusCode === 401) return [];
        if (resp.statusCode < 200 || resp.statusCode >= 300)
          throw new Error(JSON.stringify(resp));
        if (!json || json.status !== "OK" || !json.data || json.data.length === 0) {
          return [];
        }

        const validatorCount = json.data.length;
        const indices = json.data.map((v) => v.validatorindex);

        // Step 2: fetch full stats for the first batch only
        const batchIndices = indices.slice(0, MAX_VALIDATORS_PER_BATCH);
        const statsUrl = `https://beaconcha.in/api/v1/validator/${batchIndices.join(",")}${apiKeyParam}`;

        return Bluebird.delay(1500)
          .then(() => get(statsUrl, { json: true }))
          .timeout(10000)
          .cancellable()
          .spread((statsResp, statsJson) => {
            if (statsResp.statusCode === 429) {
              return [{
                asset: "ETH_STAKING",
                blockchain: "ETHEREUM",
                staking: {
                  validatorCount,
                  activeValidators: null,
                  totalStakedETH: null,
                  totalBalanceETH: null,
                  totalRewardsETH: null,
                },
              }];
            }

            if (
              statsResp.statusCode !== 200 ||
              !statsJson ||
              statsJson.status !== "OK" ||
              !statsJson.data
            ) {
              return [{
                asset: "ETH_STAKING",
                blockchain: "ETHEREUM",
                staking: { validatorCount, activeValidators: null, totalStakedETH: null, totalBalanceETH: null, totalRewardsETH: null },
              }];
            }

            // beaconcha.in returns an object (not array) when querying a single validator
            const statsData = Array.isArray(statsJson.data) ? statsJson.data : [statsJson.data];

            const activeValidators = statsData.filter((v) => v.status && v.status.startsWith("active")).length;

            const totalStakedETH = parseFloat(
              statsData.reduce((sum, v) => sum + (v.effectivebalance != null ? v.effectivebalance / GWEI_TO_ETH : 0), 0).toFixed(6)
            );
            const totalBalanceETH = parseFloat(
              statsData.reduce((sum, v) => sum + (v.balance != null ? v.balance / GWEI_TO_ETH : 0), 0).toFixed(6)
            );
            const totalRewardsETH = parseFloat((totalBalanceETH - totalStakedETH).toFixed(6));

            return [{
              asset: "ETH_STAKING",
              blockchain: "ETHEREUM",
              staking: {
                validatorCount,
                activeValidators,
                totalStakedETH,
                totalBalanceETH,
                totalRewardsETH,
              },
            }];
          });
      });
  },
};

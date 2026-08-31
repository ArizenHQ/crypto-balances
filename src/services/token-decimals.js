const Bluebird = require("bluebird");
const post = Bluebird.promisify(require("request").post);
const NodeCache = require("node-cache");

/*
 * ERC-20 balances come back as raw integers and have to be divided by the
 * token's decimals. The Alchemy token-balance endpoint does not return that
 * number, so it used to be looked up in a static config — and every config
 * except ethereum.json is empty, so almost every token fell back to `decimals
 * = 0` and was reported multiplied by 10^18.
 *
 * Decimals are now read on-chain and cached: a token's decimals are fixed for
 * the life of the contract, so one lookup per contract is enough.
 */

// Contracts are immutable here, so entries never need to expire.
const cache = new NodeCache({ stdTTL: 0, checkperiod: 0 });

const knownDecimals = require("./configs/ethereum.json");

const cacheKey = (url, contractAddress) =>
  `${url}|${contractAddress.toLowerCase()}`;

/**
 * Reads a token's decimals from chain via alchemy_getTokenMetadata.
 * Resolves to null when the token cannot be resolved, so callers can drop the
 * balance rather than report a wrong one.
 */
const fetchDecimals = (url, contractAddress) =>
  post(url, {
    json: {
      jsonrpc: "2.0",
      id: 1,
      method: "alchemy_getTokenMetadata",
      params: [contractAddress],
    },
  })
    .timeout(10000)
    .spread((resp, json) => {
      if (resp.statusCode < 200 || resp.statusCode >= 300) return null;
      if (!json || json.error) return null;

      const decimals = json.result && json.result.decimals;
      // 0 is a legitimate value, so only null/undefined count as unresolved.
      return decimals === null || decimals === undefined
        ? null
        : parseInt(decimals, 10);
    })
    .catch(() => null);

/**
 * Resolves the decimals for one contract, preferring the static config and
 * falling back to an on-chain lookup. Resolves to null when unknown.
 */
const resolveDecimals = (url, contractAddress) => {
  const key = contractAddress.toLowerCase();

  // The static config is keyed in lower case; the previous code tested with
  // toLowerCase() but then read back with the original casing, so a mixed-case
  // address silently produced undefined.
  const configured = knownDecimals[key];
  if (configured && configured.decimals !== undefined) {
    return Bluebird.resolve(parseInt(configured.decimals, 10));
  }

  const cached = cache.get(cacheKey(url, key));
  if (cached !== undefined) {
    return Bluebird.resolve(cached);
  }

  return fetchDecimals(url, contractAddress).then((decimals) => {
    cache.set(cacheKey(url, key), decimals);
    return decimals;
  });
};

/**
 * Turns Alchemy token balances into results, dropping any token whose decimals
 * could not be resolved: an unscaled balance reads as a real holding and is
 * worse than a missing line.
 */
const buildBalances = (url, tokenBalances, blockchain) =>
  Bluebird.all(
    (tokenBalances || []).map((token) => {
      const { contractAddress, tokenBalance } = token;

      return resolveDecimals(url, contractAddress).then((decimals) => {
        if (decimals === null) {
          console.warn(
            `[${blockchain}] unknown decimals for ${contractAddress}, balance dropped`
          );
          return null;
        }

        return {
          asset: contractAddress,
          quantity: parseInt(tokenBalance, 16) / Math.pow(10, decimals),
          blockchain,
        };
      });
    })
  ).then((results) => results.filter(Boolean));

module.exports = { resolveDecimals, buildBalances, cache };

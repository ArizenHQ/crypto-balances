const Bluebird = require("bluebird");
const get = Bluebird.promisify(require("request").get);
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
    const url = `https://polygon-mainnet.g.alchemy.com/nft/v2/${process.env.alchemyKeyPolygon}/getNFTs?owner=${addr}`;
    const headers = { "Content-Type": "application/json" };
    return get(url, { json: true, headers })
      .timeout(10000)
      .cancellable()
      .spread((resp, json) => {
        if (resp.statusCode < 200 || resp.statusCode >= 300)
          throw new Error(JSON.stringify(resp));
        if (json.error) throw new Error(json.error.message);
        let results = [];
        if (json.ownedNfts) {
          json.ownedNfts.map((token) => {
            const { contract, balance, contractMetadata, id } = token;
            if(contractMetadata && (contractMetadata.tokenType === "ERC721" || contractMetadata && contractMetadata.tokenType === "ERC1155")) {
              results.push({
                asset: contract.address,
                tokenId: parseInt(id.tokenId),
                quantity: parseInt(balance),
                blockchain: "POLYGON",
                metadata: token,
              });
            }
          });
        }
        return results;
      });
  },
};

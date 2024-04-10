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
    const url = `https://eth-mainnet.g.alchemy.com/nft/v2/${process.env.alchemyKeyEthereum}/getNFTs?owner=${addr}`;
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
                blockchain: "ethereum",
                metadata: token,
              });
            }
          });
        }
        return results;
      });
  },
};

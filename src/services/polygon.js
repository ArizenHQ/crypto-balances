const config = require("./configs/polygon.json");
module.exports = {
    supported_address: ["MATIC"],
  
    check(addr) {
      return RegExp("^(0x)?[0-9a-fA-F]{40}$").test(addr);
    },
  
    symbol() {
      return "MATIC";
    },
  
    async fetch(addr) {
      const fetchURL = `https://polygon-mainnet.g.alchemy.com/v2/${process.env.alchemyKeyPolygon}`;
      const headers = { "Content-Type": "application/json" };
      let tokens = [];
  
      const makeRequest = async (method, params, cache='no-cache') => {
        const body = JSON.stringify({ jsonrpc: "2.0", method, headers, params });
        const requestOptions = {
          method: "POST",
          body,
          headers,
          cache: cache
        };
  
        const response = await fetch(fetchURL, requestOptions);
        return await response.json();
      };
  
      try {
        const ethResponse = await makeRequest("eth_getBalance", [addr]);
        if (ethResponse.result) {
          tokens.push({
            asset: "MATIC",
            quantity: parseFloat(parseInt(ethResponse.result, 16) * 10 ** -18),
          });
        }
  
        const erc20Response = await makeRequest("alchemy_getTokenBalances", [addr, "erc20"]);
        if (erc20Response.result && erc20Response.result.tokenBalances) {
          for (const token of erc20Response.result.tokenBalances) {
            const { contractAddress, tokenBalance } = token;
            let decimals = 0;
            let name = contractAddress;
            if(config[contractAddress.toLowerCase()]){
              name=config[contractAddress].name;
              decimals=config[contractAddress].decimals;
            }
            tokens.push({
              asset: name,
              quantity: parseFloat(parseInt(tokenBalance, 16)) / Math.pow(10, parseInt(decimals)|| 0),
            });

            /*
            let config = {}
            const tokenMeta = await makeRequest("alchemy_getTokenMetadata", [contractAddress], 'force-cache');
            if (tokenMeta.result && tokenMeta.result.name) {
              config[contractAddress] = {
                name: tokenMeta.result.name,
                decimals: parseInt(tokenMeta.result.decimals)|| 0
              }
              */
            /*
            const tokenMeta = await makeRequest("alchemy_getTokenMetadata", [contractAddress], 'force-cache');
            if (tokenMeta.result && tokenMeta.result.name) {
              tokens.push({
                asset: tokenMeta.result.name,
                quantity: parseFloat(parseInt(tokenBalance, 16)) / Math.pow(10, parseInt(tokenMeta.result.decimals)|| 0)
              });
              
            }*/
          }
        }
        return tokens;
      } catch (error) {
      }
    },
  };
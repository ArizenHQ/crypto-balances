module.exports = {
    supported_address: ["ARB"],
  
    check(addr) {
      return RegExp("^(0x)?[0-9a-fA-F]{40}$").test(addr);
    },
  
    symbol() {
      return "ARB";
    },
  
    async fetch(addr) {
      const fetchURL = `https://arb-mainnet.g.alchemy.com/v2/${process.env.alchemyKeyArbitrum}`;
      const headers = { "Content-Type": "application/json" };
      let tokens = [];
  
      const makeRequest = async (method, params) => {
        const body = JSON.stringify({ jsonrpc: "2.0", method, headers, params });
        const requestOptions = {
          method: "POST",
          body,
          headers,
        };
  
        const response = await fetch(fetchURL, requestOptions);
        return await response.json();
      };
  
      try {
        const ethResponse = await makeRequest("eth_getBalance", [addr]);
        if (ethResponse.result) {
          tokens.push({
            asset: "ARB",
            quantity: parseFloat(parseInt(ethResponse.result, 16) * 10 ** -18),
          });
        }
  
        const erc20Response = await makeRequest("alchemy_getTokenBalances", [addr, "erc20"]);
        if (erc20Response.result && erc20Response.result.tokenBalances) {
          for (const token of erc20Response.result.tokenBalances) {
            const { contractAddress, tokenBalance } = token;
            const tokenMeta = await makeRequest("alchemy_getTokenMetadata", [contractAddress]);
            if (tokenMeta.result && tokenMeta.result.name) {
              tokens.push({
                asset: tokenMeta.result.name,
                quantity: parseFloat(parseInt(tokenBalance, 16)) / Math.pow(10, parseInt(tokenMeta.result.decimals)|| 0)
              });
            }
          }
        }
        return tokens;
      } catch (error) {
        console.error(error);
      }
    },
  };
  
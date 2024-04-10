module.exports = {
    //ethplorer: require('./ethplorer'),
    chainso: require('./blockcypher'),
    chainz: require('./chainz'),
    
    blockonomics: require('./blockonomics'),
    blockchain: require('./blockchain'),
    blockchain_btc: require('./blockchain-btc'),
    neoscan: require('./neoscan'),
    
    ethereum: require('./ethereum'),
    ethereumERC20: require('./erc20-ethereum'),
    ethereumNFT: require('./ethereum-nft.js'),
    
    near: require('./near'),

    avalancheCChain: require('./_avalanche-c-chain'),
    avalancheCChainERC20: require('./erc20-avalanche-c-chain'),
    avalancheCChainNFT721: require('./erc721-avalanche-c-chain.js'),
    avalancheCChainNFT1155: require('./erc1155-avalanche-c-chain.js'),
    
    alchemyArbitrum: require('./arbitrum'),
    arbitrumERC20: require('./erc20-arbitrum'),

    polygon: require('./polygon'),
    polygonERC20: require('./erc20-polygon'),
    polygonNFT: require('./polygon-nft'),
    
    alchemySolana: require('./solana'),
    solanaERC20: require('./erc20-solana'),
};
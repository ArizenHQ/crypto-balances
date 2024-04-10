const Bluebird = require('bluebird');
const services = require('./services');

module.exports = (addr, coin) => {
    return Bluebird
    .settle((() => {
        const result = [];
        for (let s in services) {
            const service = services[s];
            const supported = !coin || service.supported_address.map(c => c.toLowerCase()).includes(coin.toLowerCase());
            if (supported && service.check(addr)) {
                result.push(
                    service.fetch(addr)
                    .then(data => data.map(item => ({...item, serviceSymbol: service.symbol()}))) // Ajouter le symbole du service à chaque élément
                    .catch(e => [{ error: `${s}: ${e.message}` }])
                );
            }
        }
        if(result.length === 0) return [];
        return result;
    })())
    .timeout(10000)
    .cancellable()
    .map(asset => asset.isFulfilled() && asset.value())
    .reduce((a, b) => a.concat(b), [])
    .then(items => {
        let finalResult = {};

        items.forEach(item => {
            if (item.error) {
                // Gérer l'erreur si nécessaire
                return;
            }
            const blockchain = item.blockchain || 'unknown';
            if (!finalResult[blockchain]) {
                finalResult[blockchain] = {
                    address_types: item.serviceSymbol || 'unknown', // Utiliser le symbole du service
                    balances: {},
                    nfts: {}
                };
            }
            const type = item.asset;
            if (item.quantity) {
                finalResult[blockchain].balances[type] = item.quantity;
            }
            if (item.tokenId && item.quantity) {
                if (!finalResult[blockchain].nfts[type]) {
                    finalResult[blockchain].nfts[type] = {};
                }
                finalResult[blockchain].nfts[type][item.tokenId] = item.metadata;
            }
        });

        return finalResult;
    })
    .catch(e => {
        return {
            error: e.message
        }
    });
}

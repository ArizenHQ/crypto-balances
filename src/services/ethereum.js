const Bluebird = require("bluebird");
const req = Bluebird.promisify(require("request"));
const { InvalidResponseError } = require("../errors");

module.exports = {
    check(addr) {
        return RegExp('^(0x)?[0-9a-fA-F]{40}$').test(addr);
    },

    fetch(addr) {
        const url = `http://api.etherscan.io/api?module=account&action=balance&address=${addr}&tag=latest`;
        const conversion = 1000000000000000000;

        return req(url, {json: true})
        .timeout(2000)
        .cancellable()
        .spread((resp, json) => {
            if (resp.statusCode < 200 || resp.statusCode >= 300) throw new InvalidResponseError({service: url, response: resp});
            return {
                asset: "ETH",
                quantity: json.result / conversion
            };
        })
        .catch(Bluebird.TimeoutError, e => [{status: 'error', service: url, message: e.message, raw: e}])
        .catch(InvalidResponseError, e => [{status: "error", service: e.service, message: e.message, raw: e.response}]);
    }
}
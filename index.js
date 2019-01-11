const methods = require('./methods');

module.exports = function (client = throwIfMissing('client')) {

    function generateServerSeedHash({ userId = 'none', expiresIn = 60 * 60 } = {}) {
        const { seed, hash } = methods.generateServerSeed();
        const key = `provably-fair:seed:${hash}`;
        client.set(key, JSON.stringify({ userId, seed }));
        client.expire(key, expiresIn);
        return hash;
    }

    function createAndChallenge({
        userId = 'none',
        serverSeedHash = throwIfMissing('serverSeedHash'),
        clientSeed = throwIfMissing('clientSeed'),
        guess = throwIfMissing('guess'),
        customResult,
        customValidation = function (guess, result) {
            return guess === result
        }
    }, callback = throwIfMissing('callback')) {
        const key = `provably-fair:seed:${serverSeedHash}`
        client.get(key, function (err, JSONData) {
            const data = JSON.parse(JSONData);
            /* istanbul ignore if */
            if (err) {
                callback(err);
            } else if (!data) {
                callback(new Error('Invalid serverSeedHash, probably already used.'));
            } else if (data.userId !== userId) {
                callback(new Error('Provided userId does not match token serverSeed.userId.'));
            } else {
                methods.createResult({
                    serverSeed: data.seed,
                    clientSeed,
                    customResult
                }, (err, bet) => {
                    const valid = customValidation(guess, bet.result);
                    client.del(key);
                    callback(err, valid, bet);
                });
            }
        });
    }

    function verify({
        serverSeed = throwIfMissing('serverSeed'),
        clientSeed = throwIfMissing('clientSeed'),
        customResult
    }, callback = throwIfMissing('callback')) {
        const { serverSeedHash } = methods.generateServerSeed(serverSeed);
        methods.createResult({ serverSeed, clientSeed, customResult }, (err, bet) => {
            callback(err, {
                serverSeedHash,
                result: bet.result
            });
        });
    }

    return {
        generateServerSeedHash,
        createAndChallenge,
        verify
    }
}

function throwIfMissing(param) {
    throw new Error(`Missing parameter : ${param}`);
}
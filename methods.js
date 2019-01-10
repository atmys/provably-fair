const crypto = require('crypto');
const seedrandom = require('seedrandom');

module.exports = {

  generateServerSeed: (seed = generateRandomHex(64)) => {
    const hash = crypto.createHash('sha512').update(seed).digest('hex');
    return {
      seed,
      hash
    };
  },

  createResult: ({
    serverSeed,
    clientSeed,
    customResult = function (randomNumber) {
      return randomNumber
    }
  }, callback) => {

    const seed = serverSeed + clientSeed;
    const randomNumber = seedrandom(seed)();
    const id = generateRandomHex(10);
    callback(null, { id, result: customResult(randomNumber), serverSeed, clientSeed });
  },

}

function generateRandomHex(length) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}
const redis = require('redis');
const client = redis.createClient();
const provablyFairModule = require('./index');
const provablyFair = provablyFairModule(client);

const clientSeed = 'clientSeed';
const customResult = function () {
  return 0.5
}

const customValidation = function (guess, result) {
  return guess === result * 2
}

let serverSeedHash = '';

describe('when initializing', () => {
  it('should fail if no client provided', () => {
    expect(function () {
      provablyFairModule();
    }).toThrow();
  });
});

describe('when creating a serverSeed', () => {

  it('should return a hash & a token', () => {
    serverSeedHash = provablyFair.generateServerSeedHash();
    expect(serverSeedHash).toBeTruthy();
  });

});

describe('when creating and challenging', () => {

  it('should throw if missing param', () => {

    expect(function () {
      provablyFair.createAndChallenge();
    }).toThrow();

    expect(function () {
      provablyFair.createAndChallenge({});
    }).toThrow();

    expect(function () {
      provablyFair.createAndChallenge({ serverSeedHash });
    }).toThrow();

    expect(function () {
      provablyFair.createAndChallenge({ serverSeedHash });
    }).toThrow();

    expect(function () {
      provablyFair.createAndChallenge({ serverSeedHash, clientSeed });
    }).toThrow();

    expect(function () {
      provablyFair.createAndChallenge({ serverSeedHash, clientSeed, customResult, customValidation, guess: 1 });
    }).toThrow();

  });

  it('should fail if wrong userId', done => {
    provablyFair.createAndChallenge({ userId: 'other', serverSeedHash, clientSeed, customResult, customValidation, guess: 1 }, err => {
      expect(err).toBeTruthy();
      done();
    });
  });

  it('should fail if redis errror', done => {
    provablyFair.createAndChallenge({ serverSeedHash: { fail: true }, clientSeed, customResult, customValidation, guess: 1 }, err => {
      expect(err).toBeTruthy();
      done();
    });
  });

  it('should fail if wrong guess', done => {
    provablyFair.createAndChallenge({ serverSeedHash, clientSeed, customResult, customValidation, guess: 0.5 }, (err, valid, bet) => {
      expect(err).toBe(null);
      expect(valid).toBe(false);
      expect(bet.result).toBe(0.5);
      done();
    });
  });

  it('should fail if same hash', done => {
    provablyFair.createAndChallenge({ serverSeedHash, clientSeed, customResult, customValidation, guess: 1 }, err => {
      expect(err).toBeTruthy();
      done();
    });
  });

  it('should succeed if right guess', done => {
    serverSeedHash = provablyFair.generateServerSeedHash();
    provablyFair.createAndChallenge({
      serverSeedHash,
      clientSeed,
      customResult,
      customValidation,
      guess: 1
    }, (err, valid, bet) => {
      expect(err).toBe(null);
      expect(valid).toBe(true);
      expect(bet.result).toBe(0.5);
      done();
    });
  });

});

describe('when verifying', () => {

  it('should throw if missing param', () => {

    expect(function () {
      provablyFair.verify();
    }).toThrow();

    expect(function () {
      provablyFair.verify({});
    }).toThrow();

    expect(function () {
      provablyFair.verify({ serverSeed: 'seed' });
    }).toThrow();

    expect(function () {
      provablyFair.verify({ serverSeed: 'seed', clientSeed });
    }).toThrow();

  });

  it('should return the same result & hash', done => {
    serverSeedHash = provablyFair.generateServerSeedHash();
    provablyFair.createAndChallenge({
      serverSeedHash,
      clientSeed,
      guess: 1
    }, (err, valid, bet) => {
      expect(err).toBeNull();
      provablyFair.verify({
        serverSeed: bet.serverSeed,
        clientSeed: bet.clientSeed
      }, (err, verifyBet) => {
        expect(err).toBeNull();
        expect(bet.result).toBe(verifyBet.result);
        done();
      });
    });
  })

});
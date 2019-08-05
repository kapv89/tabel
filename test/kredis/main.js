const assert = require('assert');

const Client = require('../../src/kredis');
const config = require('../config');

const testClient = require('./testClient');
const testHash = require('./testHash');
const testQueue = require('./testQueue');

const run = async () => {
  const client = new Client(config.redis);

  await client.clear();

  await testClient(assert, client);
  await testHash(assert, client);
  await testQueue(assert, client);

  await client.disconnect();
};

if (require.main === module) {
  // handle promise errors
  process.on('unhandledRejection', (err) => { throw err; });

  run(...process.argv.slice(2));
}

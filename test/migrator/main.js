const Tabel = require('../../src/Orm');
const config = require('../config');

const testWithDefaultStub = require('./testWithDefaultStub');
const testWithCustomStub = require('./testWithCustomStub');

// handle promise errors
process.on('unhandledRejection', err => { throw err; });

function run(mode) {
  if (['custom', 'default'].indexOf(mode) === -1) {
    console.log('Usage: `npm run test.migrate default|custom`');
    return Promise.resolve();
  }

  const orm = new Tabel(config);
  const {migrator} = orm.exports;

  return (() => (
    mode === 'custom' ? testWithCustomStub(orm, migrator) :
    mode === 'default' ? testWithDefaultStub(orm, migrator) :
    Promise.reject(new Error('invalid mode'))
  ))().then(() => orm.close());
}

run(...process.argv.slice(2));

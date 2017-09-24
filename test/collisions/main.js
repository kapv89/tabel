// this is the test for collison of uuids

const {range, isFinite} = require('lodash');
const faker = require('faker');

const Tabel = require('../../src/Orm');

const config = require('../config');

// handle promise errors
process.on('unhandledRejection', err => { throw err; });

runTests(...process.argv.slice(2));

function runTests(numTestCases, chunk) {
  if (!isFinite(parseInt(numTestCases, 10) || !isFinite(parseInt(chunk, 10)))) {
    console.log('Usage: `npm run test.collisions [numTestCases] [chunk]`');
    console.log('Please provide the appropriate config too in `test/config.js`');
    return Promise.resolve();
  }

  const {knex, table, orm} = new Tabel(config).exports;

  return knex.schema.dropTableIfExists('collisions')
    .then(() => knex.schema.createTable('collisions', (t) => {
      t.uuid('id').primary();
      t.text('title');
    }))
    .then(() => orm.defineTable({
      name: 'collisions',
      props: {autoId: true}
    }))
    .then(() => insert(table, parseInt(numTestCases, 10), parseInt(chunk, 10)))
    .then(() => console.log(`${parseInt(numTestCases, 10)} cases tested`))
    .then(() => knex.schema.dropTableIfExists('collisions'))
    .then(() => orm.close())
  ;
}


function insert(table, testCases, chunk, cur=0) {
  if (cur < testCases) {
    console.log(`${cur} to ${cur+chunk}`);
    return Promise.all(range(chunk).map(() => table('collisions').insert({title: faker.lorem.sentence()})))
      .then(() => insert(table, testCases, chunk, cur+chunk))
    ;
  } else {
    return Promise.resolve();
  }
}

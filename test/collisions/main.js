// this is the test for collison of uuids

import {range, isFinite} from 'lodash';
import faker from 'faker';

import Tabel from '../../src/Orm';

import config from '../config';

// handle promise errors
process.on('unhandledRejection', err => { throw err; });

runTests(...process.argv.slice(2));

async function runTests(db, numTestCases, chunk) {
  if (! (db in config) || ! isFinite(parseInt(numTestCases, 10) || ! isFinite(parseInt(chunk, 10)))) {
    console.log('Usage: `npm run test:orm [pg|mysql|sqlite] [numTestCases] [chunk]`');
    console.log('Please provide the appropriate config too in `test/config.js`');
    return;
  }

  const orm = new Tabel(config[db]);

  await orm.knex.schema.dropTableIfExists('collisions');
  await orm.knex.schema.createTable('collisions', (t) => {
    t.uuid('id').primary();
    t.text('title');
  });

  orm.defineTable({
    name: 'collisions',
    props: {autoId: true}
  });

  const TEST_CASES = parseInt(numTestCases, 10);
  const CHUNK = parseInt(chunk, 10);
  let cur = 0;

  async function insert() {
    if (cur < TEST_CASES) {
      console.log(`${cur} to ${cur+CHUNK}`);
      await* range(CHUNK).map(() => orm.table('collisions').insert({title: faker.lorem.sentence()}));
      cur = cur + CHUNK;
      return await insert();
    }
  }

  await insert();

  console.log(`${TEST_CASES} cases tested`);

  await orm.knex.schema.dropTableIfExists('collisions');
  await orm.close();
}

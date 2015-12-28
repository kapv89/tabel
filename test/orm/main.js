/**
 * The process we are gonna follow to "test" the orm layer of the system
 * is to basically construct a schema (using knex, which is a tested library)
 * which can stand against all features offered by this orm.
 *
 * The first test we run, we define our tables, so now they are available in all
 * subsequent tests.
 *
 * The second test that we run is our test for insertion, using which we populate our tables.
 * We check if tables got populated via knex. And knex is what we use to match our results
 * for all subsequent tests.
 */

import assert from 'assert';

import Tabel from '../../src/Orm';

import config from '../config';

import testTableDefinitions from './testTableDefinitions';
import testInsert from './testInsert';
import testQueryBuilding from './testQueryBuilding';
import testUpdate from './testUpdate';
import testDelete from './testDelete';
import testEagerLoads from './testEagerLoads';
import testScopesAndJoints from './testScopesAndJoints';
import testRelationJoints from './testRelationJoints';
import testBelongsToHelpers from './testBelongsToHelpers';
import testManyToManyHelpers from './testManyToManyHelpers';
import testHasManyHelpers from './testHasManyHelpers';
import testHasManyThroughHelpers from './testHasManyThroughHelpers';
import testHasOneHelpers from './testHasOneHelpers';
import testMorphManyHelpers from './testMorphManyHelpers';
import testMorphOneHelpers from './testMorphOneHelpers';
import testMorphToHelpers from './testMorphToHelpers';
import testValidator from './testValidator';

// handle promise errors
process.on('unhandledRejection', err => { throw err; });

runTests(...process.argv.slice(2));

async function runTests(db) {
  if (! (db in config)) {
    console.log('Usage: `npm run test:orm pg|mysql|sqlite`');
    console.log('Please provide the appropriate config too in `test/config.js`');
    return;
  }

  const orm = new Tabel(config[db]);

  await teardownTables(orm);
  await setupTables(orm);
  await testTableDefinitions(assert, orm);
  await testInsert(assert, orm);
  await testQueryBuilding(assert, orm);
  await testUpdate(assert, orm);
  await testDelete(assert, orm);
  await testEagerLoads(assert, orm);
  await testScopesAndJoints(assert, orm);
  await testRelationJoints(assert, orm);
  await testBelongsToHelpers(assert, orm);
  await testManyToManyHelpers(assert, orm);
  await testHasManyHelpers(assert, orm);
  await testHasManyThroughHelpers(assert, orm);
  await testHasOneHelpers(assert, orm);
  await testMorphManyHelpers(assert, orm);
  await testMorphOneHelpers(assert, orm);
  await testMorphToHelpers(assert, orm);
  await testValidator(assert, orm);

  await teardownTables(orm);

  await orm.close();
}

async function setupTables({knex}) {
  await Promise.all([
    knex.schema.createTable('users', (t) => {
      t.uuid('id').primary();
      t.string('username');
      t.string('password');
      t.timestamps();
    }),

    knex.schema.createTable('roles', (t) => {
      t.uuid('id').primary();
      t.string('name').unique();
      t.timestamps();
    }),

    knex.schema.createTable('user_role', (t) => {
      t.uuid('user_id');
      t.uuid('role_id');
      t.timestamps();

      t.primary(['user_id', 'role_id']);
    }),

    knex.schema.createTable('posts', (t) => {
      t.uuid('id').primary();
      t.uuid('user_id');
      t.string('title');
      t.text('body');
      t.timestamp('published_on').nullable().defaultTo(null);
      t.timestamps();
    }),

    knex.schema.createTable('comments', (t) => {
      t.uuid('id').primary();
      t.uuid('user_id');
      t.uuid('post_id');
      t.string('text', 500);
      t.boolean('is_flagged').defaultTo(false);
      t.timestamps();
    }),

    knex.schema.createTable('photos', (t) => {
      t.uuid('id').primary();
      t.string('doc_type');
      t.uuid('doc_id');
      t.string('url');
      t.timestamps();

      t.index(['doc_type', 'doc_id']);
    }),

    knex.schema.createTable('photo_details', (t) => {
      t.uuid('photo_id').primary();
      t.string('title');
      t.string('about', 1000);
      t.timestamps();
    }),

    knex.schema.createTable('tags', (t) => {
      t.uuid('id').primary();
      t.string('name').unique();
      t.timestamps();
    }),

    knex.schema.createTable('tagable_tag', (t) => {
      t.string('tagable_type');
      t.uuid('tagable_id');
      t.uuid('tag_id');
      t.timestamps();

      t.primary(['tagable_type', 'tagable_id', 'tag_id']);
    })
  ]);
}

async function teardownTables({knex}) {
  await Promise.all([
    'users', 'roles', 'user_role', 'posts', 'comments', 'photos',
    'photo_details', 'tags', 'tagable_tag'
  ].map((t) => knex.schema.dropTableIfExists(t)));
}

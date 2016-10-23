const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const assert = require('assert');

function run(migrate, orm, ...args) {
  return cleanup(orm)
    .then(() => testMigrate(migrate, orm, ...args))
    .then(() => testMake(migrate, orm, ...args))
    .then(() => testLatest(migrate, orm, ...args))
    .then(() => testVersion(migrate, orm, ...args))
    .then(() => testRollback(migrate, orm, ...args))
    .then(() => testRefresh(migrate, orm, ...args))
    .then(() => testReset(migrate, orm, ...args))
    .then(() => cleanup(orm))
    .then(() => orm.close())
  ;
}

function testMigrate(migrate, orm, ...args) {
  return migrate(...args);
}

function testMake(migrate, orm, ...args) {
  console.log('testing make');

  const migrationsDir = path.join(process.cwd(), 'migrations');

  return migrate(...(args.concat(['make', 'Foo'])))
    .then(() => new Promise((resolve, reject) => fs.readdir(migrationsDir, (err, files) => {
      if (err) {
        reject(err);
      } else {
        assert.ok(
          files.filter((file) => file.indexOf('Foo.js') > -1, 'migrate make creates correct file')
        );
        resolve();
      }
    })))
  ;
}

function testLatest(migrate, orm, ...args) {
  console.log('testing latest');

  const {knex} = orm.exports;
  const migrationsDir = path.join(process.cwd(), 'migrations');

  return new Promise((resolve, reject) => fs.readdir(migrationsDir, (err, files) => {
    if (err) {
      reject(err);
    } else {
      resolve(path.join(migrationsDir, files[0]));
    }
  })).then((migrationFilePath) => {
    return new Promise((resolve, reject) => fs.readFile(path.join(__dirname, 'default.migration'), (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve({data, migrationFilePath});
      }
    }));
  }).then(({data, migrationFilePath}) => {
    return new Promise((resolve, reject) => fs.writeFile(migrationFilePath, data, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    }));
  }).then(() => migrate(...(args.concat(['latest']))))
    .then(() => knex.schema.hasTable('test_default'))
    .then((result) => {
      assert.ok(result, 'migrate latest works');
    })
  ;
}

function testVersion(migrate, orm, ...args) {
  console.log('testing version');

  return migrate(...(args.concat(['version'])));
}

function testRollback(migrate, orm, ...args) {
  console.log('testing rollback');

  const {knex} = orm.exports;

  return migrate(...(args.concat(['rollback'])))
    .then(() => knex.schema.hasTable('test_default'))
    .then((result) => {
      assert.ok(!result, 'migrate rollback works');
    })
  ;
}

function testRefresh(migrate, orm, ...args) {
  console.log('testing refresh');

  const {knex} = orm.exports;

  return migrate(...(args.concat(['latest'])))
    .then(() => migrate(...args.concat(['refresh'])))
    .then(() => knex.schema.hasTable('test_default'))
    .then((result) => {
      assert.ok(result, 'migrate reset works');
    })
  ;
}

function testReset(migrate, orm, ...args) {
  console.log('testing reset');

  const {knex} = orm.exports;

  return migrate(...(args.concat(['latest'])))
    .then(() => migrate(...args.concat(['reset'])))
    .then(() => knex.schema.hasTable('test_default'))
    .then((result) => {
      assert.ok(!result, 'migrate reset works');
    })
  ;
}

function cleanup(orm) {
  console.log('cleaning up');

  const {knex} = orm.exports;

  return Promise.all([
    knex.schema.dropTableIfExists('knex_migrations'),
    new Promise((resolve) => (
      rimraf(path.join(process.cwd(), 'migrations'), () => resolve())
    ))
  ]);
}

module.exports = run;

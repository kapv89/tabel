const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const assert = require('assert');

function run(orm, migrator) {
  return cleanup(orm)
    .then(() => testMount(orm, migrator))
    .then(() => testMake(orm, migrator))
    .then(() => testLatest(orm, migrator))
    .then(() => testVersion(orm, migrator))
    .then(() => testRollback(orm, migrator))
    .then(() => testRefresh(orm, migrator))
    .then(() => testReset(orm, migrator))
    .then(() => cleanup(orm))
  ;
}

function testMount(orm, migrator) {
  console.log('testing mount');

  return migrator.mount({
    devDir: path.join(process.cwd(), 'migrations'),
    distDir: path.join(process.cwd(), 'migrations'),
    args: []
  });
}

function testMake(orm, migrator) {
  console.log('testing make');

  const migrationsDir = path.join(process.cwd(), 'migrations');
  const [devDir, distDir] = [migrationsDir, migrationsDir];

  return migrator.mount({devDir, distDir, args: ['make', 'Foo']})
    .then(() => new Promise((resolve, reject) => fs.readdir(migrationsDir, (err, files) => {
      if (err) {
        reject(err);
      } else {
        assert.ok(
          files.filter((file) => file.indexOf('Foo.js') > -1, 'migrate make creates correct file')
        );
        resolve();
      }
    })));
}

function testLatest(orm, migrator) {
  console.log('testing latest');

  const {knex} = orm.exports;
  const migrationsDir = path.join(process.cwd(), 'migrations');
  const [devDir, distDir] = [migrationsDir, migrationsDir];

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
  }).then(() => migrator.mount({devDir, distDir, args: ['latest']}))
    .then(() => knex.schema.hasTable('test_default'))
    .then((result) => {
      assert.ok(result, 'migrate latest works');
    })
  ;
}

function testVersion(orm, migrator) {
  console.log('testing version');

  const migrationsDir = path.join(process.cwd(), 'migrations');
  const [devDir, distDir] = [migrationsDir, migrationsDir];

  return migrator.mount({devDir, distDir, args: ['version']});
}

function testRollback(orm, migrator) {
  console.log('testing rollback');

  const migrationsDir = path.join(process.cwd(), 'migrations');
  const [devDir, distDir] = [migrationsDir, migrationsDir];
  const {knex} = orm.exports;

  return migrator.mount({devDir, distDir, args: ['rollback']})
    .then(() => knex.schema.hasTable('test_default'))
    .then((result) => {
      assert.ok(!result, 'migrate rollback works');
    })
  ;
}

function testRefresh(orm, migrator) {
  console.log('testing refresh');

  const migrationsDir = path.join(process.cwd(), 'migrations');
  const [devDir, distDir] = [migrationsDir, migrationsDir];
  const {knex} = orm.exports;

  return migrator.mount({devDir, distDir, args: ['latest']})
    .then(() => migrator.mount({devDir, distDir, args: ['refresh']}))
    .then(() => knex.schema.hasTable('test_default'))
    .then((result) => {
      assert.ok(result, 'migrate reset works');
    })
  ;
}

function testReset(orm, migrator) {
  console.log('testing reset');

  const migrationsDir = path.join(process.cwd(), 'migrations');
  const [devDir, distDir] = [migrationsDir, migrationsDir];
  const {knex} = orm.exports;

  return migrator.mount({devDir, distDir, args: ['latest']})
    .then(() => migrator.mount({devDir, distDir, args: ['reset']}))
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
    knex.schema.dropTableIfExists('knex_migrations_lock'),
    knex.schema.dropTableIfExists('test_default'),
    new Promise((resolve) => (
      rimraf(path.join(process.cwd(), 'migrations'), () => resolve())
    ))
  ]);
}

module.exports = run;

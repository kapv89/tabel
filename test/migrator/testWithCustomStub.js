const fs = require('fs');
const rimraf = require('rimraf');
const path = require('path');
const assert = require('assert');

function run(orm, migrator) {
  return cleanup(orm)
    .then(() => testMake(orm, migrator))
    .then(() => cleanup(orm))
  ;
}

function testMake(orm, migrator) {
  console.log('testing make');

  const migrationsDir = path.join(process.cwd(), 'migrations');
  const [devDir, distDir] = [migrationsDir, migrationsDir];

  return migrator.mount({devDir, distDir, args: ['make', 'Foo'], stub: path.join(__dirname, 'custom.stub')})
    .then(() => new Promise((resolve, reject) => fs.readdir(migrationsDir, (err, files) => {
      if (err) {
        reject(err);
      } else {
        assert.ok(
          files.filter((file) => file.indexOf('Foo.js') > -1, 'migrate make creates correct file')
        );
        resolve(files[0]);
      }
    })))
    .then((migrationFile) => Promise.all([
      new Promise((resolve, reject) => fs.readFile(path.join(migrationsDir, migrationFile), 'utf8', (err, text) => {
        if (err) {
          reject(err);
        } else {
          resolve(text);
        }
      })),
      new Promise((resolve, reject) => fs.readFile(path.join(__dirname, 'custom.stub'), 'utf8', (err, text) => {
        if (err) {
          reject(err);
        } else {
          resolve(text);
        }
      }))
    ]))
    .then(([migrationFileText, stubText]) => {
      assert.ok(migrationFileText === stubText, 'project stub is used properly');
    })
  ;
}

function cleanup(orm) {
  console.log('cleaning up');

  const {knex} = orm.exports;

  return Promise.all([
    knex.schema.dropTableIfExists('knex_migrations'),
    knex.schema.dropTableIfExists('knex_migrations_lock'),
    knex.schema.dropTableIfExists('test_custom'),
    new Promise((resolve) => (
      rimraf(path.join(process.cwd(), 'migrations'), () => resolve())
    ))
  ]);
}

module.exports = run;

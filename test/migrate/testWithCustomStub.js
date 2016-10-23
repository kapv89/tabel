const fs = require('fs');
const rimraf = require('rimraf');
const path = require('path');
const assert = require('assert');

function run(migrate, orm, ...args) {
  return cleanup(orm)
    .then(() => createProjectStub())
    .then(() => testMake(migrate, orm, ...args))
    .then(() => cleanup(orm))
    .then(() => orm.close())
  ;
}

function createProjectStub() {
  return new Promise((resolve, reject) => fs.readFile(path.join(__dirname, 'custom.stub'), (err, data) => {
    if (err) {
      reject(err);
    } else {
      resolve(data);
    }
  })).then((data) => new Promise((resolve, reject) => fs.writeFile(path.join(process.cwd(), 'migration.stub'), data, (err) => {
    if (err) {
      reject(err);
    } else {
      resolve();
    }
  })));
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
    new Promise((resolve) => (
      rimraf(path.join(process.cwd(), 'migrations'), () => resolve())
    )),
    new Promise((resolve) => (
      rimraf(path.join(process.cwd(), 'mirgation.stub'), () => resolve())
    ))
  ]);
}

module.exports = run;

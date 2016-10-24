'use strict';

var path = require('path');

var Orm = require('./Orm');

var defaultMigrationsDir = path.join(process.cwd(), 'migrations');

function run(ormConfig) {
  var migratorConfig = arguments.length <= 1 || arguments[1] === undefined ? {
    devDir: defaultMigrationsDir,
    distDir: defaultMigrationsDir,
    args: process.argv.slice(2)
  } : arguments[1];

  var orm = new Orm(ormConfig);
  var migrator = orm.exports.migrator;


  migrator.mount(migratorConfig).then(function () {
    return orm.close();
  });
}

module.exports = run;
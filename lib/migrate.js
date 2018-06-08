'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var path = require('path');

var Orm = require('./Orm');

var defaultMigrationsDir = path.join(process.cwd(), 'migrations');
var defaultMigratorConfig = {
  devDir: defaultMigrationsDir,
  distDir: defaultMigrationsDir,
  args: process.argv.slice(2)
};

function run(ormConfig) {
  var migratorConfig = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  migratorConfig = _extends({}, defaultMigratorConfig, migratorConfig);

  var orm = new Orm(ormConfig);
  var migrator = orm.exports.migrator;


  migrator.mount(migratorConfig).then(function () {
    return orm.close();
  });
}

module.exports = run;
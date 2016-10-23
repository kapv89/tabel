'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var fs = require('fs');
var path = require('path');

var migrator = require('./migrator');

function run() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  var projectStubPath = path.join('' + process.cwd(), 'migration.stub');
  var defaultStubPath = path.join('' + __dirname, 'migration.stub');

  return new Promise(function (resolve) {
    return fs.access(projectStubPath, fs.constants.R_OK, function (err) {
      return err ? resolve(projectStubPath) : resolve(defaultStubPath);
    });
  }).then(function (stubPath) {
    return migrator.mount({
      devDir: './migrations',
      distDir: './migrations',
      getArgs: function getArgs() {
        return args;
      },
      stub: stubPath
    });
  });
}

if (require.main === module) {
  var args = process.argv.slice(2);
  run.apply(undefined, _toConsumableArray(args));
}

module.exports = run;
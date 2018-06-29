'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var _require = require('lodash'),
    isString = _require.isString;

var path = require('path');

function migrator(orm) {
  return {
    mount: function mount(_ref) {
      var devDir = _ref.devDir,
          distDir = _ref.distDir,
          _ref$args = _ref.args,
          args = _ref$args === undefined ? [] : _ref$args,
          _ref$stub = _ref.stub,
          stub = _ref$stub === undefined ? path.join(__dirname, 'migration.stub') : _ref$stub;

      var knex = orm.knex;

      if (args.length === 0 || Object.keys(commands).indexOf(args[0]) === -1) {
        console.log('Available Commands:');
        console.log(Object.keys(commands).join('\n'));

        return Promise.resolve();
      } else {
        return function (cmd) {
          for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
          }

          return commands[cmd].apply(commands, [knex, { devDir: devDir, distDir: distDir, stub: stub }].concat(args));
        }.apply(undefined, _toConsumableArray(args));
      }
    }
  };
}

var commands = {
  make: function make(knex, _ref2, migration) {
    var devDir = _ref2.devDir,
        stub = _ref2.stub;

    if (!isString(migration) || migration.length === 0) {
      console.log('Usage: npm run task:migrate make MigrationName');
      return Promise.resolve({});
    }

    console.log('Making migration ' + migration);
    return knex.migrate.make(migration, {
      stub: stub,
      directory: devDir
    });
  },
  latest: function latest(knex, _ref3) {
    var distDir = _ref3.distDir;

    console.log('Migrating...');

    return knex.migrate.latest({ directory: distDir }).then(function (batch) {
      if (batch[0] === 0) {
        return;
      } else {
        console.log('Batch: ' + batch[0]);
        batch[1].forEach(function (file) {
          console.log(file);
        });
        return;
      }
    });
  },
  rollback: function rollback(knex, _ref4) {
    var distDir = _ref4.distDir;

    console.log('Rolling Back...');

    return knex.migrate.rollback({ directory: distDir }).then(function (batch) {
      if (batch[0] === 0) {
        return;
      } else {
        console.log('Batch: ' + batch[0]);
        batch[1].forEach(function (file) {
          console.log(file);
        });
      }
    });
  },
  version: function version(knex, _ref5) {
    var distDir = _ref5.distDir;

    return knex.migrate.currentVersion({ directory: distDir }).then(function (version) {
      console.log('Current Version: ' + version);
    });
  },
  reset: function reset(knex, _ref6) {
    var distDir = _ref6.distDir;

    console.log('Resetting...');

    function rollbackToBeginning() {
      return knex.migrate.rollback({ directory: distDir }).then(function (batch) {
        if (batch[0] === 0) {
          return Promise.resolve(null);
        } else {
          console.log('Batch: ' + batch[0]);
          batch[1].forEach(function (file) {
            console.log(file);
          });

          return rollbackToBeginning();
        }
      });
    }

    return rollbackToBeginning();
  },
  refresh: function refresh(knex, _ref7) {
    var _this = this;

    var distDir = _ref7.distDir;

    return this.reset(knex, { distDir: distDir }).then(function () {
      return _this.latest(knex, { distDir: distDir });
    });
  }
};

module.exports = migrator;
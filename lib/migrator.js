'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = migrator;

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function migrator(orm) {
  return {
    mount: function mount(_ref) {
      var _ref$devDir = _ref.devDir;
      var devDir = _ref$devDir === undefined ? './src/migrations' : _ref$devDir;
      var _ref$distDir = _ref.distDir;
      var distDir = _ref$distDir === undefined ? './lib/migrations' : _ref$distDir;
      var _ref$getArgs = _ref.getArgs;
      var getArgs = _ref$getArgs === undefined ? function () {
        return process.argv.slice(2);
      } : _ref$getArgs;

      var knex = orm.knex;
      var args = getArgs();

      if (args.length === 0) {
        console.log('Available Commands:');
        console.log(Object.keys(commands).join('\n'));

        return orm.close();
      } else {
        return (function (cmd, arg) {
          return commands[cmd](knex, { devDir: devDir, distDir: distDir }, arg).then(function () {
            return orm.close();
          });
        }).apply(undefined, _toConsumableArray(args));
      }
    }
  };
}

var commands = {
  make: function make(knex, _ref2, migration) {
    var devDir = _ref2.devDir;

    console.log('Making migration ' + migration);
    return knex.migrate.make(migration, {
      stub: __dirname + '/migration.babel.stub',
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
module.exports = exports['default'];
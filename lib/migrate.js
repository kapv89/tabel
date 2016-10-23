'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var path = require('path');
var fileExists = require('file-exists');

var _require = require('lodash');

var isString = _require.isString;

var isusableobject = require('isusableobject');

var Orm = require('./Orm');

function run() {
  var _extractConfigAndArgs = extractConfigAndArgs.apply(undefined, arguments);

  var config = _extractConfigAndArgs.config;
  var args = _extractConfigAndArgs.args;


  if (!('driver' in config && 'db' in config && 'host' in config && 'port' in config && 'username' in config && 'password' in config && 'migrations' in config) || ['pg', 'mysql', 'sqlite'].indexOf(config.driver) === -1) {
    console.log('\nInvalid config in package.json. Please check.\n\n"scripts": {\n  "migrate": "tabel.migrate driver=<pg|mysql|sqlite> db=<dbname> host=<dbhost> port=<port> username=<username> password=<password> migrations=<migrations_table_name>"\n}\n\nDefaults:\ndbhost: \'localhost\'\nport: \'5432\'\nmigrations: \'knex_migrations\'\n');

    return Promise.reject(new Error('invalid config'));
  }

  if (Object.keys(config).length > 7) {
    console.log('Invalid command arguments. Command arguments cannot contain \'=\'');
    return Promise.reject(new Error('invalid command'));
  }

  var orm = new Orm({
    db: {
      client: config.driver,
      connection: {
        database: config.db,
        host: config.host,
        port: config.port,
        user: config.username,
        password: config.password
      },
      migrations: config.migrations
    }
  });

  var migrator = orm.exports.migrator;


  var projectStubPath = path.join('' + process.cwd(), 'migration.stub');
  var defaultStubPath = path.join('' + __dirname, 'migration.stub');

  return migrator.mount({
    devDir: path.join(process.cwd(), 'migrations'),
    distDir: path.join(process.cwd(), 'migrations'),
    getArgs: function getArgs() {
      return args;
    },
    stub: fileExists(projectStubPath) ? projectStubPath : defaultStubPath
  });
}

function extractConfigAndArgs(first) {
  for (var _len = arguments.length, rest = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    rest[_key - 1] = arguments[_key];
  }

  var defaults = {
    host: 'localhost',
    port: 5432,
    migrations: 'knex_migrations'
  };

  if (isString(first)) {
    var _separateArgs = separateArgs([first].concat(rest));

    var configArgs = _separateArgs.configArgs;
    var commandArgs = _separateArgs.commandArgs;


    return {
      config: _extends({}, defaults, argsToConfig(configArgs)),
      args: commandArgs
    };
  } else if (isusableobject(first)) {
    return {
      config: _extends({}, defaults, first),
      args: rest
    };
  } else {
    throw new Error('invalid arguments');
  }
}

function separateArgs(args) {
  var configArgs = args.filter(function (arg) {
    return arg.indexOf('=') > -1;
  });
  var commandArgs = args.filter(function (arg) {
    return arg.indexOf('=') === -1;
  });

  return { configArgs: configArgs, commandArgs: commandArgs };
}

function argsToConfig(args) {
  return args.reduce(function (config, token) {
    var _token$split = token.split('=');

    var _token$split2 = _slicedToArray(_token$split, 2);

    var key = _token$split2[0];
    var val = _token$split2[1];

    return _extends({}, config, _defineProperty({}, key, val));
  }, {});
}

if (require.main === module) {
  var args = process.argv.slice(2);
  run.apply(undefined, _toConsumableArray(args));
}

module.exports = run;
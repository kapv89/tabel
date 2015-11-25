'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _knex = require('knex');

var _knex2 = _interopRequireDefault(_knex);

var _kredis = require('kredis');

var _kredis2 = _interopRequireDefault(_kredis);

var _lodash = require('lodash');

var _Table2 = require('./Table');

var _Table3 = _interopRequireDefault(_Table2);

var _Scope = require('./Scope');

var _Scope2 = _interopRequireDefault(_Scope);

var _Track = require('./Track');

var _Track2 = _interopRequireDefault(_Track);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Orm = (function () {
  function Orm(config) {
    _classCallCheck(this, Orm);

    if ('db' in config) {
      this.knex = (0, _knex2.default)(config.db);
    } else {
      throw new Error('no `db` config found');
    }

    if ('redis' in config) {
      this.redis = new _kredis2.default(config.redis);
    }

    // tables definitions
    this.tableClasses = new Map();

    // tables instances
    this.tables = new Map();
  }

  // raw expr helper

  _createClass(Orm, [{
    key: 'raw',
    value: function raw(expr) {
      return _knex2.default.raw(expr);
    }

    // transaction helper

  }, {
    key: 'transaction',
    value: function transaction(promiseFn) {
      return this.knex.transaction(promiseFn);
    }

    // transaction shorthand
    // usage:
    // return orm.trx((t) => {
    //   return orm('users', t).save([{}, {}, {}]);
    // }).then((users) => {
    //    ...
    // });

  }, {
    key: 'trx',
    value: function trx(promiseFn) {
      var outerResult = undefined;

      return this.transaction(function (t) {
        return promiseFn(t).then(function (result) {
          return t.commit().then(function () {
            outerResult = result;
            return result;
          });
        }).catch(function (e) {
          t.rollback();
          throw e;
        });
      }).then(function () {
        return outerResult;
      });
    }

    // method to close the database

  }, {
    key: 'close',
    value: function close() {
      var promises = [this.knex.destroy];

      if (this.redis) {
        promises.push(this.redis.quit());
      }

      return Promise.all(promises);
    }

    // here, we load the columns of all the tables that have been
    // defined via the orm, and return a promise on completion
    // cos, if people wanna do that before starting the server
    // let em do that

  }, {
    key: 'load',
    value: function load() {
      var _this = this;

      return Promise.all(Array.from(this.tables.keys).map(function (name) {
        return _this.tableClass(name).load();
      }));
    }

    // get a tableClass

  }, {
    key: 'tableClass',
    value: function tableClass(tableName) {
      return this.tableClasses.get(tableName);
    }

    // get a table object

  }, {
    key: 'table',
    value: function table(tableName) {
      return this.tables.get(tableName).fork();
    }

    // shorthand for table

  }, {
    key: 'tbl',
    value: function tbl(tableName) {
      return this.table(tableName);
    }
  }, {
    key: 'defineTable',
    value: function defineTable(tableName, params) {
      if (this.tableClasses.has(tableName)) {
        throw new Error('Table \'' + tableName + '\' already defined');
      }

      this.tableClasses.set(tableName, this.newTableClass(tableName, params));
      this.instantitateTable(tableName, params);
      return this;
    }
  }, {
    key: 'extendTable',
    value: function extendTable(tableName, params) {
      if (!this.tableClasses.has(tableName)) {
        throw new Error('Table \'' + tableName + '\' not defined yet');
      }

      var ExtendedTableClass = this.extendTableClass(this.tableClasses.get(tableName), params);
      this.tableClasses.set(tableName, ExtendedTableClass);
      this.instantitateTable(tableName, params);
      return this;
    }
  }, {
    key: 'instantitateTable',
    value: function instantitateTable(tableName, params) {
      return this.tables.set(tableName, new this.tableClasses.get(tableName)(params));
    }
  }, {
    key: 'newTableClass',
    value: function newTableClass(tableName, params) {
      var TableClass = function TableClass(orm) {
        return (function (_Table) {
          _inherits(_class, _Table);

          function _class() {
            _classCallCheck(this, _class);

            return _possibleConstructorReturn(this, Object.getPrototypeOf(_class).call(this, orm, tableName));
          }

          return _class;
        })(_Table3.default);
      };

      return this.extendTableClass(TableClass, params);
    }
  }, {
    key: 'extendTableClass',
    value: function extendTableClass(TableClass, params) {
      var _merge = (0, _lodash.merge)(
      // the defaults
      {},
      // supplied paramss
      params);

      var props = _merge.props;
      var processors = _merge.processors;
      var scopes = _merge.scopes;
      var joints = _merge.joints;
      var relations = _merge.relations;
      var methods = _merge.methods;

      var ExtendedTableClass = (function (_TableClass) {
        _inherits(ExtendedTableClass, _TableClass);

        function ExtendedTableClass() {
          _classCallCheck(this, ExtendedTableClass);

          return _possibleConstructorReturn(this, Object.getPrototypeOf(ExtendedTableClass).apply(this, arguments));
        }

        return ExtendedTableClass;
      })(TableClass);

      ExtendedTableClass.prototype.props = props;
      ExtendedTableClass.prototype.processors = processors;

      (0, _lodash.merge)(ExtendedTableClass.prototype, Object.keys(scopes).reduce(function (processed, name) {
        return (0, _lodash.merge)(processed, _defineProperty({}, name, function () {
          for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          scopes[name].apply(this, args);
          // set the label of the last pushed scope
          this.scopeTrack.relabelLastScope(name);
          return this;
        }));
      }, {}));

      (0, _lodash.merge)(ExtendedTableClass.prototype, Object.keys(scopes).reduce(function (processed, name) {
        // predefined joints never take arguments
        return (0, _lodash.merge)(processed, _defineProperty({}, name, function () {
          if (this.scopeTrack.hasJoint(name)) {
            return this;
          } else {
            joints[name].call(this);
            // set the label of the last pushed scope
            this.scopeTrack.relabelLastScope(name);
            // ensure that the last scope is a joint
            this.scopeTrack.convertLastScopeToJoint();
            return this;
          }
        }));
      }, {}));

      (0, _lodash.merge)(ExtendedTableClass.prototype, Object.keys(relations).reduce(function (processed, name) {
        // const relation = relations[name];
        return (0, _lodash.merge)(processed, _defineProperty({}, name, function (model) {
          if (model) {
            return relations[name].bind(this)().withModel(model);
          } else {
            return relations[name].bind(this)();
          }
        }));
      }, {}));

      (0, _lodash.merge)(ExtendedTableClass.prototype, Object.keys(relations).reduce(function (processed, name) {
        return (0, _lodash.merge)(processed, _defineProperty({}, name, methods[name]));
      }, {}));

      return ExtendedTableClass;
    }
  }]);

  return Orm;
})();

exports.default = Orm;
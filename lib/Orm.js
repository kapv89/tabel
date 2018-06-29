'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var knex = require('knex');
var KRedis = require('kredis');

var _require = require('lodash'),
    merge = _require.merge,
    isString = _require.isString;

var Table = require('./Table');
var Scoper = require('./Scoper');
var Shape = require('./Shape');
var migrator = require('./migrator');

var Orm = function () {
  function Orm() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Orm);

    if ('db' in config) {
      this.knex = knex(config.db);
    } else {
      throw new Error('no \'db\' config found');
    }

    if ('redis' in config) {
      this.cache = new KRedis(config.redis);
    }

    // tables definitions
    this.tableClasses = new Map();

    // tables instances
    this.tables = new Map();

    // tableColumns cache
    this.tableColumns = new Map();

    // migrator
    this.migrator = migrator(this);

    // exports which can be exported in place of orm instance
    this.exports = {
      orm: this,
      table: this.table.bind(this),
      trx: this.trx.bind(this),
      raw: this.raw.bind(this),
      migrator: this.migrator,
      cache: this.cache,
      knex: this.knex,
      scoper: this.scoper,
      shape: this.shape
    };
  }

  // raw expr helper


  _createClass(Orm, [{
    key: 'raw',
    value: function raw(expr) {
      return this.knex.raw(expr);
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
      var outerResult = void 0;

      return this.transaction(function (t) {
        return promiseFn(t).then(function (result) {
          return t.commit().then(function () {
            outerResult = result;
            return result;
          });
        }).catch(function (e) {
          t.rollback().then(function () {
            throw e;
          });
        });
      }).then(function () {
        return outerResult;
      });
    }

    // method to close the database

  }, {
    key: 'close',
    value: function close() {
      var promises = [this.knex.destroy()];

      if (this.cache) {
        promises.push(this.cache.disconnect());
      }

      return Promise.all(promises);
    }

    // here, we load the columns of all the tables that have been
    // defined via the orm, and return a promise on completion
    // cos, if people wanna do that before starting the server
    // let em do that. we also call ioredis.connect if its available

  }, {
    key: 'load',
    value: function load() {
      var _this = this;

      var promises = Array.from(this.tables.keys).map(function (name) {
        return _this.table(name).load();
      });

      if (this.cache) {
        promises.push(this.cache.connect());
      }

      return Promise.all(promises);
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
      var trx = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

      if (!this.tables.has(tableName)) {
        throw new Error('trying to access invalid table ' + tableName);
      }

      var tbl = this.tables.get(tableName).fork();

      if (trx !== null) {
        tbl.transacting(trx);
      }

      return tbl;
    }
  }, {
    key: 'scoper',
    value: function scoper(scopes) {
      return new Scoper(scopes);
    }
  }, {
    key: 'shape',
    value: function shape(checks) {
      return new Shape(checks);
    }

    // shorthand for table

  }, {
    key: 'tbl',
    value: function tbl(tableName) {
      var trx = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

      return this.table(tableName, trx);
    }
  }, {
    key: 'defineTable',
    value: function defineTable() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var tableName = params.name;

      if (!isString(tableName)) {
        throw new Error('Invalid table-name: ' + tableName + ' supplied via key \'name\'');
      }

      if (this.tableClasses.has(tableName)) {
        throw new Error('Table \'' + tableName + '\' already defined');
      }

      this.tableClasses.set(tableName, this.newTableClass(params));
      this.instantitateTable(tableName, params);
      return this;
    }
  }, {
    key: 'extendTable',
    value: function extendTable(tableName, _ref) {
      var _ref$scopes = _ref.scopes,
          scopes = _ref$scopes === undefined ? {} : _ref$scopes,
          _ref$joints = _ref.joints,
          joints = _ref$joints === undefined ? {} : _ref$joints,
          _ref$relations = _ref.relations,
          relations = _ref$relations === undefined ? {} : _ref$relations,
          _ref$methods = _ref.methods,
          methods = _ref$methods === undefined ? {} : _ref$methods;

      if (!this.tableClasses.has(tableName)) {
        throw new Error('Table \'' + tableName + '\' not defined yet');
      }

      var TableClass = this.tableClass(tableName);
      var ExtendedTableClass = function (_TableClass) {
        _inherits(ExtendedTableClass, _TableClass);

        function ExtendedTableClass() {
          _classCallCheck(this, ExtendedTableClass);

          return _possibleConstructorReturn(this, (ExtendedTableClass.__proto__ || Object.getPrototypeOf(ExtendedTableClass)).apply(this, arguments));
        }

        return ExtendedTableClass;
      }(TableClass);

      this.attachScopesToTableClass(ExtendedTableClass, scopes);
      this.attachJointsToTableClass(ExtendedTableClass, joints);
      this.attachRelationsToTableClass(ExtendedTableClass, relations);
      this.attachMethodsToTableClass(ExtendedTableClass, methods);

      this.tableClasses.set(tableName, ExtendedTableClass);
      this.instantitateTable(tableName);
      return this;
    }
  }, {
    key: 'instantitateTable',
    value: function instantitateTable(tableName) {
      var TableClass = this.tableClasses.get(tableName);

      return this.tables.set(tableName, new TableClass(this));
    }
  }, {
    key: 'newTableClass',
    value: function newTableClass(params) {
      return this.extendTableClass(Table, params);
    }
  }, {
    key: 'extendTableClass',
    value: function extendTableClass(TableClass, params) {
      var _merge = merge(
      // the defaults
      {
        // the table's name, is required
        name: null,

        // table properties
        props: {
          key: 'id',
          // default key column, can be ['user_id', 'post_id'] for composite keys
          autoId: false,
          // by default we don't assume that you use an auto generated db id
          perPage: 25,
          // standard batch size per page used by `forPage` method
          // forPage method uses offset
          // avoid that and use a keyset in prod (http://use-the-index-luke.com/no-offset)
          timestamps: false
          // set to `true` if you want auto timestamps or
          // timestamps: ['created_at', 'updated_at'] (these are defaults when `true`)
          // will be assigned in this order only
        },

        // predefined scopes on the table
        scopes: {},
        // predefined joints on the table
        joints: {},
        // relations definitions for the table
        relations: {},
        // table methods defintions
        methods: {}
      },
      // supplied params which will override the defaults
      params),
          name = _merge.name,
          props = _merge.props,
          processors = _merge.processors,
          scopes = _merge.scopes,
          joints = _merge.joints,
          relations = _merge.relations,
          methods = _merge.methods;

      // the extended table class whose objects will behave as needed


      var ExtendedTableClass = function (_TableClass2) {
        _inherits(ExtendedTableClass, _TableClass2);

        function ExtendedTableClass() {
          _classCallCheck(this, ExtendedTableClass);

          return _possibleConstructorReturn(this, (ExtendedTableClass.__proto__ || Object.getPrototypeOf(ExtendedTableClass)).apply(this, arguments));
        }

        return ExtendedTableClass;
      }(TableClass);

      // assign name to the table class
      ExtendedTableClass.prototype.name = name;

      // assign props to the table class
      ExtendedTableClass.prototype.props = props;

      // assign processors to the table class
      ExtendedTableClass.prototype.processors = processors;

      // store names of defined scopes, joints, relations, and methods
      ExtendedTableClass.prototype.definedScopes = new Set();
      ExtendedTableClass.prototype.definedJoints = new Set();
      ExtendedTableClass.prototype.definedRelations = new Set();
      ExtendedTableClass.prototype.definedMethods = new Set();

      // attach scopes, joints, relations and methods to tables
      // these are the only ones extendable after creation
      this.attachScopesToTableClass(ExtendedTableClass, scopes);
      this.attachJointsToTableClass(ExtendedTableClass, joints);
      this.attachRelationsToTableClass(ExtendedTableClass, relations);
      this.attachMethodsToTableClass(ExtendedTableClass, methods);

      // return the extended table class
      return ExtendedTableClass;
    }
  }, {
    key: 'attachScopesToTableClass',
    value: function attachScopesToTableClass(TableClass, scopes) {
      // keep a record of defined scopes
      Object.keys(scopes).forEach(function (name) {
        TableClass.prototype.definedScopes.add(name);
      });

      // process and merge scopes with table class
      merge(TableClass.prototype, Object.keys(scopes).reduce(function (processed, name) {
        return merge(processed, _defineProperty({}, name, function () {
          for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          scopes[name].apply(this, args);
          // set the label of the last pushed scope
          this.scopeTrack.relabelLastScope(name);
          return this;
        }));
      }, {}));
    }
  }, {
    key: 'attachJointsToTableClass',
    value: function attachJointsToTableClass(TableClass, joints) {
      // keep a record of defined joints
      Object.keys(joints).forEach(function (name) {
        TableClass.prototype.definedJoints.add(name);
      });

      // process and merge joints with table class
      merge(TableClass.prototype, Object.keys(joints).reduce(function (processed, name) {
        // predefined joints never take arguments
        return merge(processed, _defineProperty({}, name, function () {
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
    }
  }, {
    key: 'attachRelationsToTableClass',
    value: function attachRelationsToTableClass(TableClass, relations) {
      // keep a record of defined relations
      Object.keys(relations).forEach(function (name) {
        TableClass.prototype.definedRelations.add(name);
      });

      // process and merge relations with table class
      merge(TableClass.prototype, Object.keys(relations).reduce(function (processed, name) {
        // const relation = relations[name];
        return merge(processed, _defineProperty({}, name, function (model) {
          if (model) {
            return relations[name].bind(this)().setName(name).forModel(model);
          } else {
            return relations[name].bind(this)().setName(name);
          }
        }));
      }, {}));
    }
  }, {
    key: 'attachMethodsToTableClass',
    value: function attachMethodsToTableClass(TableClass, methods) {
      // keep a record of defined methods
      Object.keys(methods).forEach(function (name) {
        TableClass.prototype.definedMethods.add(name);
      });

      // process and merge relations with table class
      merge(TableClass.prototype, Object.keys(methods).reduce(function (processed, name) {
        return merge(processed, _defineProperty({}, name, methods[name]));
      }, {}));
    }
  }]);

  return Orm;
}();

module.exports = Orm;
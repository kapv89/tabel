'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
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
}
*/

var md5 = require('md5');
var uuid = require('uuid');
var isUsableObject = require('isusableobject');

var _require = require('lodash');

var isArray = _require.isArray;
var isString = _require.isString;
var isDate = _require.isDate;
var isNumber = _require.isNumber;
var isFunction = _require.isFunction;
var assign = _require.assign;
var merge = _require.merge;
var toPlainObject = _require.toPlainObject;


var Scope = require('./Scope');
var Track = require('./Track');

var HasOne = require('./relations/HasOne');
var HasMany = require('./relations/HasMany');
var HasManyThrough = require('./relations/HasManyThrough');
var BelongsTo = require('./relations/BelongsTo');
var ManyToMany = require('./relations/ManyToMany');
var MorphOne = require('./relations/MorphOne');
var MorphMany = require('./relations/MorphMany');
var MorphTo = require('./relations/MorphTo');

var Table = function () {
  function Table(orm) {
    _classCallCheck(this, Table);

    this.orm = orm;
    this.scopeTrack = new Track();

    if (this.orm.cache) {
      this.cache = this.orm.cache.hash(this.tableName());
    }
  }

  /**
   * get the tablename
   * @return {string} the tableName
   */


  _createClass(Table, [{
    key: 'tableName',
    value: function tableName() {
      return this.name;
    }

    /**
     * knex.raw helper
     * @param  {string} expr     raw expression
     * @param  {Array}  bindings bindings for the expression
     * @return {knex.raw}        raw expr
     */

  }, {
    key: 'raw',
    value: function raw(expr) {
      var bindings = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

      return this.orm.raw(expr, bindings);
    }

    /**
     * just return a raw knex query for this table
     * @return {knex.query} a fresh knex query for table
     */

  }, {
    key: 'rawQuery',
    value: function rawQuery() {
      return this.orm.knex(this.tableName());
    }

    /**
     * get a new query instance for this table, with a few flags
     * set on the query object used by the orm
     * @return {knex.query} a fresh knex query for table with orm flags
     */

  }, {
    key: 'newQuery',
    value: function newQuery() {
      return this.attachOrmNSToQuery(this.orm.knex(this.tableName()));
    }

    /**
     * attach _orm to knex query with required flags
     * @param  {knex.query} q knex query
     * @return {knex.query} query with namespace
     */

  }, {
    key: 'attachOrmNSToQuery',
    value: function attachOrmNSToQuery(q) {
      q._orm = {
        // used by cache processor
        cacheEnabled: false,
        cacheLifetime: null,
        destroyCache: false,

        // transaction being used on the query
        trx: null,

        // relations to be eagerloaded on the query
        eagerLoads: {}
      };

      return q;
    }

    /**
     * get a fully scoped query, with flags for whether this is a count query or not.
     * the counting function sets columns it counts on smartly
     * @return {knex.query} table's query object with scopeTrack applied
     */

  }, {
    key: 'query',
    value: function query() {
      var q = this.newQuery();

      // apply the scopeTrack on the query
      this.scopeTrack.apply(q);

      if (this.scopeTrack.hasScope('select')) {
        return q;
      } else {
        return q.select(this.c('*'));
      }
    }

    /**
     * load columns of the table
     * @return {Promise} a promise which resolves when table columns have loaded
     */

  }, {
    key: 'load',
    value: function load() {
      var _this = this;

      return this.newQuery().columnInfo().then(function (columns) {
        _this.orm.tableColumns.set(_this.tableName(), columns);
        return _this;
      });
    }

    /**
     * get a promise of columns in the table
     * @return {Promise} promise containing array of table's columnNames
     */

  }, {
    key: 'columns',
    value: function columns() {
      var _this2 = this;

      if (this.orm.tableColumns.has(this.tableName())) {
        return Promise.resolve(Object.keys(this.orm.tableColumns.get(this.tableName())));
      } else {
        return this.load().then(function () {
          return _this2.columns();
        });
      }
    }

    /**
     * qualified column name helper
     * @param  {mixed} col column or [columns]
     * @return {mixed} qualified column name(s)
     */

  }, {
    key: 'c',
    value: function c(col) {
      var _this3 = this;

      if (isArray(col)) {
        return col.map(function (c) {
          return _this3.c(c);
        });
      }

      if (isString(col)) {
        return col.indexOf('.') > -1 ? col : this.tableName() + '.' + col;
      }

      return col;
    }

    /**
     * get the key of the table
     * @return {mixed} get the key property
     */

  }, {
    key: 'key',
    value: function key() {
      return this.props.key;
    }

    /**
     * qualified column of key(s)
     * @return {mixed} qualified key column(s)
     */

  }, {
    key: 'keyCol',
    value: function keyCol() {
      return this.c(this.key());
    }

    /**
     * chain new scopes to the table's scopeTrack
     * @param  {function} closure op to be applied on the query
     * @param  {string} label label of the scope, optional
     * @return {this} current instance
     */

  }, {
    key: 'scope',
    value: function scope(closure) {
      var label = arguments.length <= 1 || arguments[1] === undefined ? 'scope' : arguments[1];

      this.scopeTrack.push(new Scope(closure, label));
      return this;
    }

    /**
     * chain a new joint to the table's scopeTrack.
     * will be run only once, if another with same label has run before
     * @param  {function} closure op to be applied on the query
     * @param  {string} label  label of the joint, optional
     * @return {this} current instance
     */

  }, {
    key: 'joint',
    value: function joint(closure) {
      var label = arguments.length <= 1 || arguments[1] === undefined ? 'joint' : arguments[1];

      this.scopeTrack.push(new Scope(closure, label, true));
      return this;
    }

    /**
     * fork the table and its scopes so that different scopes can be applied
     * to both instances further
     * @return {this.constructor} forked table instance
     */

  }, {
    key: 'fork',
    value: function fork() {
      var forkedTable = new this.constructor(this.orm);
      forkedTable.scopeTrack = this.scopeTrack.fork();

      return forkedTable;
    }

    /**
     * helper to refer to other tables. carries over transaction
     * and cache settings
     * @param  {string} tableName name of table you want
     * @return {Table} table instance for tableName
     */

  }, {
    key: 'table',
    value: function table(tableName) {
      var q = this.query();

      var tbl = this.orm.table(tableName);

      if (q._orm.trx !== null) {
        tbl.transacting(q._orm.trx);
      }

      if (q._orm.cacheEnabled) {
        tbl.cache(q._orm.cacheLifetime);
      }

      if (q._orm.destroyCache) {
        tbl.uncache();
      }

      return tbl;
    }

    /**
     * shorthand for table
     * @param  {string} tableName name of table you want
     * @return {Table} table instance for tableName
     */

  }, {
    key: 'tbl',
    value: function tbl(tableName) {
      return this.table(tableName);
    }

    /**
     * don't scope any rows
     * @return {this} current instance
     */

  }, {
    key: 'whereFalse',
    value: function whereFalse() {
      return this.scope(function (q) {
        return q.whereRaw('?', [false]);
      }, 'whereFalse');
    }

    /**
     * apply a where condition on the key(s) with scopes as planned
     * @param  {mixed} val value(s) to match the key(s) against
     * @return {this} current instance
     *
     * whereKey(1)
     * whereKey({id: 1})
     * whereKey({post_id: 1, tag_id: 2})
     * whereKey([1,2,3,4]);
     * whereKey([{post_id: 1, tag_id: 2}, {post_id: 1, tag_id:2}])
     */

  }, {
    key: 'whereKey',
    value: function whereKey(val) {
      if (isArray(val)) {
        return this.whereIn(this.key(), val);
      } else {
        if (isArray(this.key())) {
          if (isUsableObject(val)) {
            val = toPlainObject(val);
            return this.where(this.key().reduce(function (conditions, k) {
              return assign(conditions, _defineProperty({}, k, val[k]));
            }, {}));
          } else {
            return this.where(this.key().reduce(function (conditions, k) {
              return assign(conditions, _defineProperty({}, k, val));
            }, {}));
          }
        } else {
          return this.where(_defineProperty({}, this.key(), val));
        }
      }
    }

    /**
     * apply an orWhere condition on the key(s) with scopes as planned
     * @param  {mixed} val value(s) to match the key(s) against
     * @return {this} current instance
     *
     * orWhereKey(1)
     * orWhereKey({id: 1})
     * orWhereKey({post_id: 1, tag_id: 2})
     * orWhereKey([1,2,3,4]);
     * orWhereKey([{post_id: 1, tag_id: 2}, {post_id: 1, tag_id:2}])
     */

  }, {
    key: 'orWhereKey',
    value: function orWhereKey(val) {
      if (isArray(val)) {
        return this.orWhereIn(this.key(), val);
      } else {
        if (isArray(this.key())) {
          if (isUsableObject(val)) {
            val = toPlainObject(val);
            return this.orWhere(this.key().reduce(function (conditions, k) {
              return assign(conditions, _defineProperty({}, k, val[k]));
            }, {}));
          } else {
            return this.orWhere(this.key().reduce(function (conditions, k) {
              return assign(conditions, _defineProperty({}, k, val));
            }, {}));
          }
        } else {
          return this.orWhere(_defineProperty({}, this.key(), val));
        }
      }
    }

    /**
     * scope a where condition
     * @param  {mixed} args conditions
     * @return {this} current instance
     */

  }, {
    key: 'where',
    value: function where() {
      var _this4 = this;

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      if (args.length === 1) {
        if (isUsableObject(args[0])) {
          var _ret = function () {
            var conditions = toPlainObject(args[0]);

            return {
              v: Object.keys(conditions).reduce(function (table, field) {
                return table.where(field, '=', conditions[field]);
              }, _this4)
            };
          }();

          if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
        } else if (isFunction(args[0])) {
          return this.scope(function (q) {
            return q.where(args[0]);
          }, 'where');
        }
      }

      if (args.length === 2) {
        var field = args[0];
        var val = args[1];

        return this.where(field, '=', val);
      }

      if (args.length === 3) {
        var _ret2 = function () {
          var field = args[0];
          var op = args[1];
          var val = args[2];


          switch (op.toLowerCase()) {
            case 'in':
              return {
                v: _this4.whereIn(field, val)
              };
            case 'not in':
              return {
                v: _this4.whereNotIn(field, val)
              };
            case 'between':
              return {
                v: _this4.whereBetween(field, val)
              };
            case 'not between':
              return {
                v: _this4.whereNotBetween(field, val)
              };
            default:
              return {
                v: _this4.scope(function (q) {
                  return q.where(_this4.c(field), op, val);
                }, 'where')
              };
          }
        }();

        if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
      }

      return this;
    }

    /**
     * scope an orWhere condition
     * @param  {mixed} args conditions
     * @return {this} current instance
     */

  }, {
    key: 'orWhere',
    value: function orWhere() {
      var _this5 = this;

      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      if (args.length === 1) {
        if (isUsableObject(args[0])) {
          var _ret3 = function () {
            var conditions = toPlainObject(args[0]);

            return {
              v: Object.keys(conditions).reduce(function (table, field) {
                return table.orWhere(field, '=', conditions[field]);
              }, _this5)
            };
          }();

          if ((typeof _ret3 === 'undefined' ? 'undefined' : _typeof(_ret3)) === "object") return _ret3.v;
        } else if (isFunction(args[0])) {
          return this.scope(function (q) {
            return q.orWhere(args[0]);
          }, 'where');
        }
      }

      if (args.length === 2) {
        var field = args[0];
        var val = args[1];

        return this.where(field, '=', val);
      }

      if (args.length === 3) {
        var _ret4 = function () {
          var field = args[0];
          var op = args[1];
          var val = args[2];


          switch (op.toLowerCase()) {
            case 'in':
              return {
                v: _this5.orWhereIn(field, val)
              };
            case 'not in':
              return {
                v: _this5.orWhereNotIn(field, val)
              };
            case 'between':
              return {
                v: _this5.orWhereBetween(field, val)
              };
            case 'not between':
              return {
                v: _this5.orWhereNotBetween(field, val)
              };
            default:
              return {
                v: _this5.scope(function (q) {
                  return q.orWhere(_this5.c(field), op, val);
                }, 'orWhere')
              };
          }
        }();

        if ((typeof _ret4 === 'undefined' ? 'undefined' : _typeof(_ret4)) === "object") return _ret4.v;
      }

      return this;
    }

    /**
     * scope a whereNot condition
     * @param  {mixed} args conditions
     * @return {this} current instance
     */

  }, {
    key: 'whereNot',
    value: function whereNot() {
      var _this6 = this;

      for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      if (args.length === 1) {
        if (isUsableObject(args[0])) {
          var _ret5 = function () {
            var conditions = toPlainObject(args[0]);

            return {
              v: Object.keys(conditions).reduce(function (table, field) {
                return table.whereNot(field, '=', conditions[field]);
              }, _this6)
            };
          }();

          if ((typeof _ret5 === 'undefined' ? 'undefined' : _typeof(_ret5)) === "object") return _ret5.v;
        } else if (isFunction(args[0])) {
          return this.scope(function (q) {
            return q.whereNot(args[0]);
          }, 'whereNot');
        }
      }

      if (args.length === 2) {
        var field = args[0];
        var val = args[1];

        return this.whereNot(field, '=', val);
      }

      if (args.length === 3) {
        var _ret6 = function () {
          var field = args[0];
          var op = args[1];
          var val = args[2];


          switch (op.toLowerCase()) {
            case 'in':
              return {
                v: _this6.whereNotIn(field, val)
              };
            case 'not in':
              return {
                v: _this6.whereIn(field, val)
              };
            case 'between':
              return {
                v: _this6.whereNotBetween(field, val)
              };
            case 'not between':
              return {
                v: _this6.whereBetween(field, val)
              };
            default:
              return {
                v: _this6.scope(function (q) {
                  return q.whereNot(_this6.c(field), op, val);
                }, 'where')
              };
          }
        }();

        if ((typeof _ret6 === 'undefined' ? 'undefined' : _typeof(_ret6)) === "object") return _ret6.v;
      }

      return this;
    }

    /**
     * scope an orWhereNot condition
     * @param  {mixed} args conditions
     * @return {this} current instance
     */

  }, {
    key: 'orWhereNot',
    value: function orWhereNot() {
      var _this7 = this;

      for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }

      if (args.length === 1) {
        if (isUsableObject(args[0])) {
          var _ret7 = function () {
            var conditions = toPlainObject(args[0]);

            return {
              v: Object.keys(conditions).reduce(function (table, field) {
                return table.orWhereNot(field, '=', conditions[field]);
              }, _this7)
            };
          }();

          if ((typeof _ret7 === 'undefined' ? 'undefined' : _typeof(_ret7)) === "object") return _ret7.v;
        } else if (isFunction(args[0])) {
          return this.scope(function (q) {
            return q.orWhereNot(args[0]);
          }, 'orWhereNot');
        }
      }

      if (args.length === 2) {
        var field = args[0];
        var val = args[1];

        return this.orWhereNot(field, '=', val);
      }

      if (args.length === 3) {
        var _ret8 = function () {
          var field = args[0];
          var op = args[1];
          var val = args[2];


          switch (op.toLowerCase()) {
            case 'in':
              return {
                v: _this7.orWhereNotIn(field, val)
              };
            case 'not in':
              return {
                v: _this7.orWhereIn(field, val)
              };
            case 'between':
              return {
                v: _this7.orWereNotBetween(field, val)
              };
            case 'not between':
              return {
                v: _this7.orWhereBetween(field, val)
              };
            default:
              return {
                v: _this7.scope(function (q) {
                  return q.orWhereNot(_this7.c(field), op, val);
                }, 'orWhere')
              };
          }
        }();

        if ((typeof _ret8 === 'undefined' ? 'undefined' : _typeof(_ret8)) === "object") return _ret8.v;
      }

      return this;
    }

    /**
     * scope a whereIn condition
     * @param  {string} field field name
     * @param  {[mixed]} vals values to match against
     * @return {this} current instance
     *
     * whereIn('id', [1,2,3,4])
     * whereIn(['user_id', 'post_id'], [{user_id: 1, post_id: 2}, {user_id: 3, post_id: 5}])
     */

  }, {
    key: 'whereIn',
    value: function whereIn(field) {
      var _this8 = this;

      var vals = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

      if (vals.length === 0) {
        return this.whereFalse();
      } else {
        if (isArray(field)) {
          return this.whereRaw('(' + this.c(field) + ') in (' + vals.map(function () {
            return '(' + field.map(function () {
              return '?';
            }) + ')';
          }) + ')', vals.map(function (v) {
            return field.map(function (f) {
              return v[f];
            });
          }).reduce(function (all, item) {
            return all.concat(item);
          }, []));
        } else {
          return this.scope(function (q) {
            return q.whereIn(_this8.c(field), vals);
          }, 'whereIn');
        }
      }
    }

    /**
     * scope an orWhereIn condition
     * @param  {string} field field name
     * @param  {[mixed]} vals values to match against
     * @return {this} current instance
     *
     * orWhereIn('id', [1,2,3,4])
     * orWhereIn(['user_id', 'post_id'], [{user_id: 1, post_id: 2}, {user_id: 3, post_id: 5}])
     *
     */

  }, {
    key: 'orWhereIn',
    value: function orWhereIn(field) {
      var _this9 = this;

      var vals = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

      if (vals.length === 0) {
        return this;
      } else {
        if (isArray(field)) {
          return this.orWhereRaw('(' + this.c(field) + ') in (' + vals.map(function () {
            return '(' + field.map(function () {
              return '?';
            }) + ')';
          }) + ')', vals.map(function (v) {
            return field.map(function (f) {
              return v[f];
            });
          }).reduce(function (all, item) {
            return all.concat(item);
          }, []));
        } else {
          return this.scope(function (q) {
            return q.orWhereIn(_this9.c(field), vals);
          }, 'orWhereIn');
        }
      }
    }

    /**
     * scope a whereNotIn condition
     * @param  {string} field field name
     * @param  {[mixed]} vals values to match against
     * @return {this} current instance
     */

  }, {
    key: 'whereNotIn',
    value: function whereNotIn(field) {
      var _this10 = this;

      var vals = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

      if (vals.length === 0) {
        return this;
      } else {
        if (isArray(field)) {
          return this.whereRaw('(' + this.c(field) + ') not in (' + vals.map(function () {
            return '(' + field.map(function () {
              return '?';
            }) + ')';
          }) + ')', vals.map(function (v) {
            return field.map(function (f) {
              return v[f];
            });
          }).reduce(function (all, item) {
            return all.concat(item);
          }, []));
        } else {
          return this.scope(function (q) {
            return q.whereNotIn(_this10.c(field), vals);
          }, 'whereNotIn');
        }
      }
    }

    /**
     * scope a whereNotIn condition
     * @param  {string} field field name
     * @param  {[mixed]} vals values to match against
     * @return {this} current instance
     */

  }, {
    key: 'orWhereNotIn',
    value: function orWhereNotIn(field) {
      var _this11 = this;

      var vals = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

      if (vals.length === 0) {
        return this;
      } else {
        if (isArray(field)) {
          return this.orWhereRaw('(' + this.c(field) + ') not in (' + vals.map(function () {
            return '(' + field.map(function () {
              return '?';
            }) + ')';
          }) + ')', vals.map(function (v) {
            return field.map(function (f) {
              return v[f];
            });
          }).reduce(function (all, item) {
            return all.concat(item);
          }, []));
        } else {
          return this.scope(function (q) {
            return q.orWhereNotIn(_this11.c(field), vals);
          }, 'orWhereNotIn');
        }
      }
    }

    /**
     * scope a whereNull condition
     * @param  {string} field field name
     * @return {this} current instance
     */

  }, {
    key: 'whereNull',
    value: function whereNull(field) {
      var _this12 = this;

      return this.scope(function (q) {
        return q.whereNull(_this12.c(field));
      }, 'whereNull');
    }

    /**
     * scope an orWhereNull condition
     * @param  {string} field field name
     * @return {this} current instance
     */

  }, {
    key: 'orWhereNull',
    value: function orWhereNull(field) {
      var _this13 = this;

      return this.scope(function (q) {
        return q.orWhereNull(_this13.c(field));
      }, 'orWhereNull');
    }

    /**
     * scope a whereNotNull condition
     * @param  {string} field field name
     * @return {this} current instance
     */

  }, {
    key: 'whereNotNull',
    value: function whereNotNull(field) {
      var _this14 = this;

      return this.scope(function (q) {
        return q.whereNotNull(_this14.c(field));
      }, 'whereNotNull');
    }

    /**
     * scope an orWhereNotNull condition
     * @param  {string} field field name
     * @return {this} current instance
     */

  }, {
    key: 'orWhereNotNull',
    value: function orWhereNotNull(field) {
      var _this15 = this;

      return this.scope(function (q) {
        return q.whereNotNull(_this15.c(field));
      }, 'orWhereNotNull');
    }

    /**
     * scope a whereBetween condition
     * @param  {string} field field name
     * @param  {[mixed]} range range of vals
     * @return {this} current instance
     */

  }, {
    key: 'whereBetween',
    value: function whereBetween(field, _ref) {
      var _this16 = this;

      var _ref2 = _slicedToArray(_ref, 2);

      var min = _ref2[0];
      var max = _ref2[1];

      return this.scope(function (q) {
        return q.whereBetween(_this16.c(field), [min, max]);
      }, 'whereBetween');
    }

    /**
     * scope a orWhereBetween condition
     * @param  {string} field field name
     * @param  {[mixed]} range range of vals
     * @return {this} current instance
     */

  }, {
    key: 'orWhereBetween',
    value: function orWhereBetween(field, _ref3) {
      var _this17 = this;

      var _ref4 = _slicedToArray(_ref3, 2);

      var min = _ref4[0];
      var max = _ref4[1];

      return this.scope(function (q) {
        return q.orWhereBetween(_this17.c(field), [min, max]);
      }, 'orWhereBetween');
    }

    /**
     * scope a whereNotBetween condition
     * @param  {string} field field name
     * @param  {[mixed]} range range of vals
     * @return {this} current instance
     */

  }, {
    key: 'whereNotBetween',
    value: function whereNotBetween(field, _ref5) {
      var _this18 = this;

      var _ref6 = _slicedToArray(_ref5, 2);

      var min = _ref6[0];
      var max = _ref6[1];

      return this.scope(function (q) {
        return q.whereNotBetween(_this18.c(field), [min, max]);
      }, 'whereNotBetween');
    }

    /**
     * scope a orWhereNotBetween condition
     * @param  {string} field field name
     * @param  {[mixed]} range range of vals
     * @return {this} current instance
     */

  }, {
    key: 'orWhereNotBetween',
    value: function orWhereNotBetween(field, _ref7) {
      var _this19 = this;

      var _ref8 = _slicedToArray(_ref7, 2);

      var min = _ref8[0];
      var max = _ref8[1];

      return this.scope(function (q) {
        return q.orWhereNotBetween(_this19.c(field), [min, max]);
      }, 'orWhereNotBetween');
    }

    /**
     * scope a whereRaw condition
     * @param  {string} condition raw where condition
     * @param  {[mixed]} bindings condition bindings
     * @return {this} current instance
     */

  }, {
    key: 'whereRaw',
    value: function whereRaw(condition, bindings) {
      return this.scope(function (q) {
        return q.whereRaw(condition, bindings);
      }, 'whereRaw');
    }

    /**
     * scope a orWhereRaw condition
     * @param  {string} condition raw where condition
     * @param  {[mixed]} bindings condition bindings
     * @return {this} current instance
     */

  }, {
    key: 'orWhereRaw',
    value: function orWhereRaw(condition, bindings) {
      return this.scope(function (q) {
        return q.orWhereRaw(condition, bindings);
      }, 'orWhereRaw');
    }

    /**
     * scope a transaction
     * @param  {knex.transaction} trx the ongoing transaction
     * @return {this} current instance
     */

  }, {
    key: 'transacting',
    value: function transacting(trx) {
      return this.scope(function (q) {
        q._orm.trx = trx;q.transacting(trx);
      }, 'transacting');
    }

    /**
     * scope for a page number
     * @param  {int} page page number
     * @param  {int} perPage records per page
     * @return {this} current instance
     */

  }, {
    key: 'forPage',
    value: function forPage(page, perPage) {
      page = parseInt(page, 10);
      page = page < 1 ? 1 : page;
      perPage = isNumber(perPage) && perPage > 0 ? perPage : this.props.perPage;

      var limit = perPage;
      var offset = (page - 1) * perPage;


      return this.limit(limit).offset(offset);
    }

    /**
     * apply a scope which sets an offset
     * @param  {int} offset offset to be set on the query
     * @return {this} current instance
     */

  }, {
    key: 'offset',
    value: function offset(_offset) {
      return this.scope(function (q) {
        return q.offset(_offset);
      }, 'offset');
    }

    /**
     * apply a scope which sets a limit on the query
     * @param  {int} limit limit to be set on the query
     * @return {this} current instance
     */

  }, {
    key: 'limit',
    value: function limit(_limit) {
      return this.scope(function (q) {
        return q.limit(_limit);
      }, 'limit');
    }

    /**
     * apply a scope which sets an order on the query
     * @param  {string} field column by which to order
     * @param  {string} direction should be 'asc', 'desc'
     * @return {this} current instance
     */

  }, {
    key: 'orderBy',
    value: function orderBy(field, direction) {
      var _this20 = this;

      return this.scope(function (q) {
        return q.orderBy(_this20.c(field), direction);
      }, 'orderBy');
    }

    /**
     * apply a scope which sets an orderByRaw on the query
     * @param  {string} sql sql for the order by
     * @param {array} bindings bindings for orderByRaw
     * @return {this} current instance
     */

  }, {
    key: 'orderByRaw',
    value: function orderByRaw(sql, bindings) {
      return this.scope(function (q) {
        return q.orderByRaw(sql, bindings);
      }, 'orderByRaw');
    }

    /**
     * apply a scope which sets a groupBy on the query
     * @param  {...string} args columns to group by
     * @return {this} current instance
     */

  }, {
    key: 'groupBy',
    value: function groupBy() {
      var _this21 = this;

      for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
        args[_key5] = arguments[_key5];
      }

      return this.scope(function (q) {
        return q.groupBy.apply(q, _toConsumableArray(_this21.c(args)));
      }, 'groupBy');
    }

    /**
     * apply a scope which sets a groupByRaw on the query
     * @param  {string} sql sql for the group by
     * @param {array} bindings bindings for groupBy
     * @return {this} current instance
     */

  }, {
    key: 'groupByRaw',
    value: function groupByRaw(sql, bindings) {
      return this.scope(function (q) {
        return q.groupByRaw(sql, bindings);
      }, 'groupByRaw');
    }

    /**
     * apply a scope which sets a having clause on the query
     * @param  {string} col column
     * @param  {op} op  operator
     * @param  {val} val value
     * @return {this} current instance
     */

  }, {
    key: 'having',
    value: function having(col, op, val) {
      return this.scope(function (q) {
        return q.having(col, op, val);
      }, 'having');
    }

    /**
     * apply a scope which sets a having clause on the query
     * @param  {string} sql sql string for the having clause
     * @param  {array} bindings bindings for the sql
     * @return {this} current instance
     */

  }, {
    key: 'havingRaw',
    value: function havingRaw(sql, bindings) {
      return this.scope(function (q) {
        return q.havingRaw(sql, bindings);
      }, 'havingRaw');
    }

    /**
     * apply a scope which sets a distinct clause on the query
     * @return {this} current instance
     */

  }, {
    key: 'distinct',
    value: function distinct() {
      return this.scope(function (q) {
        return q.distinct();
      }, 'distinct');
    }

    /**
     * apply a scope to select some columns
     * @param  {mixed} cols the columns to select
     * @return {this} current instance
     */

  }, {
    key: 'select',
    value: function select() {
      var _this22 = this;

      for (var _len6 = arguments.length, cols = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
        cols[_key6] = arguments[_key6];
      }

      return this.scope(function (q) {
        q.select(_this22.c(cols));
      }, 'select');
    }

    /**
     * apply a scope to join a table with this Table
     * @param {string} tableName to join
     * @param {...mixed} args join conditions
     * @return {this} current instance
     */

  }, {
    key: 'join',
    value: function join(tableName) {
      var _this23 = this;

      for (var _len7 = arguments.length, args = Array(_len7 > 1 ? _len7 - 1 : 0), _key7 = 1; _key7 < _len7; _key7++) {
        args[_key7 - 1] = arguments[_key7];
      }

      if (isFunction(args[0])) {
        var _ret9 = function () {
          var joiner = args[0];
          return {
            v: _this23.joint(function (q) {
              q.join(tableName, joiner);
            }, 'join' + tableName + md5(joiner.toString()))
          };
        }();

        if ((typeof _ret9 === 'undefined' ? 'undefined' : _typeof(_ret9)) === "object") return _ret9.v;
      } else {
        return this.joint(function (q) {
          q.join.apply(q, [tableName].concat(args));
        }, 'join' + tableName + md5(args.toString()));
      }
    }

    /**
     * apply a scope to leftJoin a table with this Table
     * @param {string} tableName to join
     * @param {...mixed} args join conditions
     * @return {this} current instance
     */

  }, {
    key: 'leftJoin',
    value: function leftJoin(tableName) {
      var _this24 = this;

      for (var _len8 = arguments.length, args = Array(_len8 > 1 ? _len8 - 1 : 0), _key8 = 1; _key8 < _len8; _key8++) {
        args[_key8 - 1] = arguments[_key8];
      }

      if (isFunction(args[0])) {
        var _ret10 = function () {
          var joiner = args[0];
          return {
            v: _this24.joint(function (q) {
              q.leftJoin(tableName, joiner);
            }, 'join' + tableName + md5(joiner.toString()))
          };
        }();

        if ((typeof _ret10 === 'undefined' ? 'undefined' : _typeof(_ret10)) === "object") return _ret10.v;
      } else {
        return this.joint(function (q) {
          q.leftJoin.apply(q, [tableName].concat(args));
        }, 'join' + tableName + md5(args.toString()));
      }
    }

    /**
     * apply a scope which enables a cache on the current query
     * @param  {int} lifetime lifetime in milliseconds
     * @return {this} current instance
     */

  }, {
    key: 'cache',
    value: function cache(lifetime) {
      return this.scope(function (q) {
        q._orm.cacheEnabled = true;q._orm.cacheLifetime = lifetime;
      }, 'cache');
    }

    /**
     * apply a scope which sets the flag for destruction of cache
     * @return {this} current instance
     */

  }, {
    key: 'uncache',
    value: function uncache() {
      return this.scope(function (q) {
        q._orm.destroyCache = true;
      }, 'uncache');
    }

    /**
     * apply a debug scope on the query
     * @param {Boolean} flag true/false
     * @return {this} current instance
     */

  }, {
    key: 'debug',
    value: function debug() {
      var flag = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

      return this.scope(function (q) {
        return q.debug(flag);
      });
    }

    /**
     * add a scope to eager-load various relations
     * @param  {...mixed} eagerLoads relations to eager-load with constraints
     * @return {this} current instance
     */

  }, {
    key: 'eagerLoad',
    value: function eagerLoad() {
      for (var _len9 = arguments.length, eagerLoads = Array(_len9), _key9 = 0; _key9 < _len9; _key9++) {
        eagerLoads[_key9] = arguments[_key9];
      }

      eagerLoads = this.parseEagerLoads(eagerLoads);
      return this.scope(function (q) {
        assign(q._orm.eagerLoads, eagerLoads);
      }, 'eagerLoad');
    }

    /**
     * parse and eagerLoads argument
     * @param  {mixed} eagerLoads eagerLoads to be parsed, {} or []
     * @return {this} current instance
     */

  }, {
    key: 'parseEagerLoads',
    value: function parseEagerLoads(eagerLoads) {
      // if eagerLoads is of the form ['foo', 'foo.bar', {'foo.baz': (t) => { t.where('active', true); }}]
      // then use a place-holder constraint for 'foo' & 'foo.bar'
      // and reduce to form {'rel1': constraint1, 'rel2': constraint2}
      if (isArray(eagerLoads)) {
        return this.parseEagerLoads(eagerLoads.map(function (eagerLoad) {
          if (isUsableObject(eagerLoad)) {
            return toPlainObject(eagerLoad);
          } else {
            return _defineProperty({}, eagerLoad, function () {});
          }
        }).reduce(function (eagerLoadsObject, eagerLoad) {
          return assign(eagerLoadsObject, eagerLoad);
        }, {}));
      }

      // processing the object form of eagerLoads
      return Object.keys(eagerLoads).reduce(function (allRelations, relation) {
        if (relation.indexOf('.') === -1) {
          return allRelations.concat([relation]);
        } else {
          // foo.bar.baz
          // ->
          // foo
          // foo.bar
          // foo.bar.baz
          return allRelations.concat(relation.split('.').reduce(function (relationParts, part) {
            return relationParts.concat([relationParts.slice(-1).concat([part]).join('.')]);
          }, []));
        }
      }, []).reduce(function (parsedEagerLoads, relation) {
        if (relation in eagerLoads) {
          return assign(parsedEagerLoads, _defineProperty({}, relation, eagerLoads[relation]));
        } else {
          return assign(parsedEagerLoads, _defineProperty({}, relation, function () {}));
        }
      }, {});
    }

    /**
     * clear table's cache
     * @return {Promise} promise for clearing table's cache
     */

  }, {
    key: 'clearCache',
    value: function clearCache() {
      var _this25 = this;

      return this.cache.clear().then(function () {
        return _this25;
      });
    }

    /**
     * returns key which will be used to cache a query's result
     * @param  {knex.query} q the query which is being used to fetch result
     * @return {string} md5 hash of the query
     */

  }, {
    key: 'queryCacheKey',
    value: function queryCacheKey(q) {
      return md5(q.toString());
    }

    /**
     * uncaches results of a query if needed
     * @param  {knex.query} q query being used to fetch result
     * @return {Promise} a promise of the query destroyCache disabled
     */

  }, {
    key: 'uncacheQueryIfNeeded',
    value: function uncacheQueryIfNeeded(q) {
      if (q._orm.destroyCache) {
        return this.cache.del(this.queryCacheKey(q)).then(function () {
          q._orm.destroyCache = false;
          return q;
        });
      } else {
        return Promise.resolve(q);
      }
    }

    /**
     * fetches results for the query from cache or database
     * @param  {knex.query} q query being used to fetch the result
     * @return {Promise} promise of object {q, result}
     */

  }, {
    key: 'fetchResultsFromCacheOrDatabase',
    value: function fetchResultsFromCacheOrDatabase(q) {
      var _this26 = this;

      if (q._orm.cacheEnabled) {
        var _ret11 = function () {
          var key = _this26.queryCacheKey(q);

          return {
            v: _this26.cache.get(key).then(function (result) {
              if (result !== null) {
                return result;
              } else {
                return q.then(function (result) {
                  return _this26.cache(key, result, q._orm.cacheLifetime).then(function () {
                    return result;
                  });
                });
              }
            })
          };
        }();

        if ((typeof _ret11 === 'undefined' ? 'undefined' : _typeof(_ret11)) === "object") return _ret11.v;
      } else {
        return q.then(function (result) {
          return result;
        });
      }
    }

    /**
     * process the result of a query, strip table's name,
     * replace '.' with '__' in columns with different table-prefix,
     * parse count if the query is a count query
     * @param  {mixed} result result fetched for the query
     * @param  {options} options whether we are fetching count results
     * @return {mixed} the processed result
     */

  }, {
    key: 'processResult',
    value: function processResult(result, options) {
      var _this27 = this;

      var _ref10 = isUsableObject(options) ? toPlainObject(options) : { count: false };

      var count = _ref10.count;


      if (count === true) {
        // result[0].count is how knex gives count query results
        return parseInt(result[0].count, 10);
      } else if (isArray(result)) {
        // processing an array of response
        return result.map(function (row) {
          return _this27.processResult(row, { count: count });
        });
      } else if (isUsableObject(result)) {
        // processing individual model results
        result = toPlainObject(result);
        return Object.keys(result).reduce(function (processed, key) {
          if (key.indexOf('.') > -1) {
            if (key.indexOf(_this27.tableName()) === 0) {
              return assign(processed, _defineProperty({}, key.split('.')[1], result[key]));
            } else {
              return assign(processed, _defineProperty({}, key.split('.').join('__'), result[key]));
            }
          } else {
            return assign(processed, _defineProperty({}, key, result[key]));
          }
        }, { __table: this.tableName() });
      } else {
        // processing other random values
        return result;
      }
    }

    /**
     * eager load relations for an array of models
     * @param  {array} models of models
     * @param  {object} eagerLoads a processed eagerLoads with constraints
     * @return {Promise} promise which resilves when all relations have loaded
     */

  }, {
    key: 'loadRelations',
    value: function loadRelations(models, eagerLoads) {
      var _this28 = this;

      if (isArray(models) && models.length === 0) {
        // don't do anything for empty values
        return Promise.resolve(models);
      }

      return Promise.all(Object.keys(eagerLoads)
      // filter all top level relations
      .filter(function (relation) {
        return relation.indexOf('.') === -1;
      }).map(function (relation) {
        // check for the relation actually being there
        if (!_this28.definedRelations.has(relation)) {
          throw new Error('invalid relation ' + relation);
        }

        return _this28[relation]().eagerLoad(_this28.subEagerLoads(relation, eagerLoads)).constrain(eagerLoads[relation]).load(models);
      })).then(function (results) {
        return results.reduce(function (mergedResult, result) {
          return merge(mergedResult, result);
        }, models);
      });
    }

    /**
     * get the subEagerLoads for a relation, given a set of eagerLoads
     * @param  {string} relation name of the relation
     * @param  {object} eagerLoads {relationName: cosntraint} form eagerLoads
     * @return {object} subEagerLoads of relation with constraints
     */

  }, {
    key: 'subEagerLoads',
    value: function subEagerLoads(relation, eagerLoads) {
      return Object.keys(eagerLoads).filter(function (relationName) {
        return relationName.indexOf(relation) === 0 && relationName !== relation;
      }).map(function (relationName) {
        return relationName.split('.').slice(1).join('.');
      }).reduce(function (subEagerLoads, subRelationName) {
        return assign(subEagerLoads, _defineProperty({}, subRelationName, eagerLoads[relation + '.' + subRelationName]));
      }, {});
    }

    /**
     * get the first row for the scoped query
     * @param  {...mixed} args conditions for scoping the query
     * @return {Promise} promise which resolves the result
     */

  }, {
    key: 'first',
    value: function first() {
      var _limit2;

      return (_limit2 = this.limit(1)).all.apply(_limit2, arguments).then(function (result) {
        return result.length > 0 ? result[0] : null;
      });
    }

    /**
     * get all rows from the scoped query
     * @param  {...mixed} args conditions for scoping the query
     * @return {Promise} promise which resolves the result
     */

  }, {
    key: 'all',
    value: function all() {
      var _this29 = this;

      if (arguments.length === 1) {
        return this.where(arguments.length <= 0 ? undefined : arguments[0]).all();
      } else if (arguments.length >= 2) {
        return this.where.apply(this, arguments).all();
      }

      var q = this.query();

      return this.uncacheQueryIfNeeded(q).then(function () {
        return _this29.fetchResultsFromCacheOrDatabase(q);
      }).then(function (models) {
        return _this29.processResult(models);
      }).then(function (models) {
        return _this29.loadRelations(models, q._orm.eagerLoads);
      });
    }

    /**
     * get count of the scoped result set. works well
     * even when you have groupBy etc in your queries
     * @param  {...mixed} args conditions for scoping the query
     * @return {int} count of the result set
     */

  }, {
    key: 'count',
    value: function count() {
      var _this30 = this;

      if (arguments.length === 1) {
        return this.where(arguments.length <= 0 ? undefined : arguments[0]).count();
      } else if (arguments.length >= 2) {
        return this.where.apply(this, arguments).count();
      }

      var q = this.attachOrmNSToQuery(this.orm.knex.count('*').from(function (q) {
        q.from(_this30.tableName());

        _this30.scopeTrack.apply(q);

        if (!_this30.scopeTrack.hasScope('select')) {
          q.select(_this30.c('*'));
        }

        q.as('t1');
      }));

      return this.uncacheQueryIfNeeded(q).then(function () {
        return _this30.fetchResultsFromCacheOrDatabase(q);
      }).then(function (result) {
        return _this30.processResult(result, { count: true });
      });
    }

    /**
     * perform a reduce operation on your scoped rows in batches
     * @param {int} batchSize number of rows fetched per batch
     * @param {function} reducer reducer of a batch
     * @param {mixed} initialVal inital value for the reduce operation
     * @return {mixed} result of the batchReduce operation
     */

  }, {
    key: 'batchReduce',
    value: function batchReduce() {
      var batchSize = arguments.length <= 0 || arguments[0] === undefined ? 1000 : arguments[0];

      var _this31 = this;

      var reducer = arguments.length <= 1 || arguments[1] === undefined ? function () {} : arguments[1];
      var initialVal = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

      var reduceBatchN = function reduceBatchN(batchNum, batchInitialVal) {
        return _this31.fork().limit(batchSize).offset((batchNum - 1) * batchSize).all().then(function (models) {
          try {
            var batchResult = reducer(batchInitialVal, models);
            if (models.length < batchSize) {
              return batchResult;
            } else {
              return reduceBatchN(batchNum + 1, batchResult);
            }
          } catch (err) {
            throw err;
          }
        });
      };

      return reduceBatchN(1, initialVal);
    }

    /**
     * find a single model for supplied conditions
     * @param  {...mixed} args conditions for finding the model
     * @return {Promise} promise for found model
     */

  }, {
    key: 'find',
    value: function find() {
      var _this32 = this;

      switch (arguments.length) {
        case 0:
          return this.first();
        case 1:
          return function (val) {
            if (isUsableObject(val)) {
              return _this32.where(val).first();
            } else {
              return _this32.whereKey(val).first();
            }
          }.apply(undefined, arguments);
        default:
          return this.where.apply(this, arguments).first();
      }
    }

    /**
     * delete the scoped data set
     * @param  {...mixed} args further conditions for deletion
     * @return {Promise} promise for when deletion has completed
     */

  }, {
    key: 'del',
    value: function del() {
      var _this33 = this;

      switch (arguments.length) {
        case 0:
          return this.query().del();
        case 1:
          return function (condition) {
            if (isUsableObject(condition)) {
              return _this33.where(condition).del();
            } else {
              // else we are deleting based on a key
              return _this33.whereKey(condition).del();
            }
          }.apply(undefined, arguments);
        default:
          return this.where.apply(this, arguments).del();
      }
    }

    /**
     * truncate the table
     * @return {Promise} promise for when truncate has completed
     */

  }, {
    key: 'truncate',
    value: function truncate() {
      return this.newQuery().truncate();
    }

    /**
     * get timestamp cols being used by the table
     * @return {array} [createdAtCol, updatedAtCol]
     */

  }, {
    key: 'timestampsCols',
    value: function timestampsCols() {
      var timestamps = isArray(this.props.timestamps) ? this.props.timestamps : ['created_at', 'updated_at'];
      if (timestamps.length === 1) {
        return [timestamps[0], timestamps[0]];
      } else {
        return timestamps;
      }
    }

    /**
     * attach timestamp to values
     * @param  {mixed} values values to be timestamped
     * @param  {options} options.op operation being performed (insert/update)
     * @return {mixed} timestamped
     */

  }, {
    key: 'attachTimestampToValues',
    value: function attachTimestampToValues(values, _ref11) {
      var _this34 = this;

      var op = _ref11.op;

      if (isArray(values)) {
        return values.map(function (val) {
          return _this34.attachTimestampToValues(val);
        });
      }

      if (this.props.timestamps !== false) {
        var timestamp = new Date();

        var _timestampsCols = this.timestampsCols();

        var _timestampsCols2 = _slicedToArray(_timestampsCols, 2);

        var createdAtCol = _timestampsCols2[0];
        var updatedAtCol = _timestampsCols2[1];


        if (!isDate(values[createdAtCol]) && op === 'insert') {
          assign(values, _defineProperty({}, createdAtCol, timestamp));
        }

        if (!isDate(values[updatedAtCol]) && ['insert', 'update'].indexOf(op) > -1) {
          assign(values, _defineProperty({}, updatedAtCol, timestamp));
        }
      }

      return values;
    }

    /**
     * check if db is postgres
     * @return {Boolean} true/false
     */

  }, {
    key: 'isPostgresql',
    value: function isPostgresql() {
      return ['postgresql', 'pg', 'postgres'].indexOf(this.orm.knex.client.config.client) > -1;
    }

    /**
     * generate a new key-val if autoId true
     * @return {Promise} uuid
     */

  }, {
    key: 'genKeyVal',
    value: function genKeyVal() {
      var _this35 = this;

      if (!this.props.autoId) {
        return Promise.resolve({});
      }

      var key = isArray(this.key()) ? this.key() : [this.key()];

      var newKey = key.reduce(function (condition, part) {
        return assign(condition, _defineProperty({}, part, uuid.v4()));
      }, {});

      return this.newQuery().where(newKey).first().then(function (model) {
        if (isUsableObject(model)) {
          return _this35.genKeyVal();
        } else {
          return newKey;
        }
      });
    }

    /**
     * pick only those {key: val} where key is a table
     * column. useful for table insertion and updation
     * @param  {array} columns an array of column-names
     * @param  {mixed} values array or object of values
     * @return {mixed} array or object of values
     */

  }, {
    key: 'pickColumnValues',
    value: function pickColumnValues(columns, values, _ref12) {
      var _this36 = this;

      var op = _ref12.op;

      if (isArray(values)) {
        return values.map(function (v) {
          return _this36.pickColumnValues(columns, v);
        });
      }

      var keys = isArray(this.key()) ? this.key() : [this.key];

      return columns.filter(function (col) {
        if (op === 'update' && keys.indexOf(col) > -1) {
          return false;
        } else {
          return true;
        }
      }).reduce(function (parsed, col) {
        if (col in values) {
          return assign(parsed, _defineProperty({}, col, values[col]));
        } else {
          return parsed;
        }
      }, {});
    }

    /**
     * insert values in the table
     * @param  {object} model model or array of models to be inserted
     * @return {Promise} promise for when insert has completed
     */

  }, {
    key: 'insertModel',
    value: function insertModel(model) {
      var _this37 = this;

      var opFlags = { op: 'insert' };

      return Promise.all([this.columns(), this.genKeyVal()]).then(function (_ref13) {
        var _ref14 = _slicedToArray(_ref13, 2);

        var columns = _ref14[0];
        var keyVal = _ref14[1];

        model = assign({}, keyVal, _this37.attachTimestampToValues(_this37.pickColumnValues(columns, model, opFlags), opFlags));

        return _this37.newQuery().returning('*').insert(model).then(function (_ref15) {
          var _ref16 = _slicedToArray(_ref15, 1);

          var model = _ref16[0];
          return model;
        });
      });
    }
  }, {
    key: 'insertAll',
    value: function insertAll() {
      var _this38 = this;

      var models = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

      return Promise.all(models.map(function (m) {
        return _this38.insertModel(m);
      }));
    }
  }, {
    key: 'insert',
    value: function insert(values) {
      if (isArray(values)) {
        return this.insertAll(values);
      } else {
        return this.insertModel(values);
      }
    }

    /**
     * update the scoped data set
     * @param  {...mixed} args data for updation, or key and data for updation
     * @return {Promise} promise for when updation has completed
     */

  }, {
    key: 'update',
    value: function update() {
      for (var _len10 = arguments.length, args = Array(_len10), _key10 = 0; _key10 < _len10; _key10++) {
        args[_key10] = arguments[_key10];
      }

      if (args.length === 0) {
        throw new Error('Invalid update');
      } else if (args.length >= 2) {
        // that means we have been provided a key, and values to update
        // against it
        var keyCondition = args[0];
        var values = args[1];

        return this.whereKey(keyCondition).rawUpdate(values, { returning: true });
      } else if (args.length === 1) {
        // if we reach here then we can safely say that an object has
        // been provided to the update call
        return this.rawUpdate(args[0], {});
      }
    }

    /**
     * Perform an update operation, can be used for batch updates.
     * @param  {object}  values values to be used to perform an update
     * @param  {Boolean} options.returning whether the results should be returned
     * @return {Promise} promise for when update has finished
     */

  }, {
    key: 'rawUpdate',
    value: function rawUpdate(values, _ref17) {
      var _this39 = this;

      var _ref17$returning = _ref17.returning;
      var returning = _ref17$returning === undefined ? false : _ref17$returning;

      var opFlags = { op: 'update' };

      return this.columns().then(function (columns) {
        values = _this39.attachTimestampToValues(_this39.pickColumnValues(columns, values, opFlags), opFlags);

        if (returning === true) {
          // we return the first object when returning is true
          // use update method uses this, useful for handpicked updates
          // which is mostly the case with business logic
          return _this39.query().returning('*').update(values).then(function (_ref18) {
            var _ref19 = _slicedToArray(_ref18, 1);

            var model = _ref19[0];
            return model;
          });
        } else {
          // use this for batch updates. we don't return anything
          // in batch updates. if you want returning batch updates,
          // just use knex!
          return _this39.query().update(values);
        }
      });
    }

    /**
     * get a new hasOne relation
     * @param  {string}  related related table name
     * @param  {string}  foreignKey foreign-key on related table
     * @param  {string}  key key to match with on this table
     * @return {HasOne}  HasOne relation instance
     */

  }, {
    key: 'hasOne',
    value: function hasOne(related, foreignKey, key) {
      key = key || this.key();

      return new HasOne(this, this.table(related), foreignKey, key);
    }

    /**
     * get a new hasMany relation
     * @param  {string}  related related table name
     * @param  {string}  foreignKey foreign-key on related table
     * @param  {string}  key key to match with on this table
     * @return {HasMany} HasMany relation instance
     */

  }, {
    key: 'hasMany',
    value: function hasMany(related, foreignKey, key) {
      key = key || this.key();

      return new HasMany(this, this.table(related), foreignKey, key);
    }

    /**
     * get a new hasManyThrough relation
     * @param  {string}  related related table name
     * @param  {string}  through through table name
     * @param  {string}  firstKey foreign-key on through table
     * @param  {string}  secondKey foreign-key on related table
     * @return {HasManyThrough} HasManyThrough relation instance
     */

  }, {
    key: 'hasManyThrough',
    value: function hasManyThrough(related, through, firstKey, secondKey) {
      return new HasManyThrough(this, this.table(related), this.table(through), firstKey, secondKey);
    }

    /**
     * get a new BelongsTo relation
     * @param  {string} related related table name
     * @param  {string} foreignKey foreign-key on this table
     * @param  {string} otherKey key to match on other table
     * @return {BelongsTo} BelongsTo relation instance
     */

  }, {
    key: 'belongsTo',
    value: function belongsTo(related, foreignKey, otherKey) {
      related = this.table(related);
      otherKey = otherKey || related.key();

      return new BelongsTo(this, related, foreignKey, otherKey);
    }

    /**
     * get a new ManyToMany relation
     * @param  {string} related related table name
     * @param  {string} pivot pivot table name
     * @param  {string} foreignKey foreign-key on this table
     * @param  {string} otherKey other-key on this table
     * @param  {function} joiner extra join conditions
     * @return {ManyToMany} BelongsToMany relation instance
     */

  }, {
    key: 'manyToMany',
    value: function manyToMany(related, pivot, foreignKey, otherKey) {
      var joiner = arguments.length <= 4 || arguments[4] === undefined ? function () {} : arguments[4];

      return new ManyToMany(this, this.table(related), this.table(pivot), foreignKey, otherKey, joiner);
    }

    /**
     * get a new MorphOne relation
     * @param  {string} related related table name
     * @param  {string} inverse inverse relation ship name
     * @return {MorphOne} MorphOne relation instance
     */

  }, {
    key: 'morphOne',
    value: function morphOne(related, inverse) {
      related = this.table(related);

      return new MorphOne(this, related, related[inverse]());
    }

    /**
     * get a new MorphMany relation
     * @param  {string} related related table name
     * @param  {string} inverse inverse relation ship name
     * @return {MorphMany} MorphMany relation instance
     */

  }, {
    key: 'morphMany',
    value: function morphMany(related, inverse) {
      related = this.table(related);

      return new MorphMany(this, related, related[inverse]());
    }

    /**
     * get a new MorphTo relation
     * @param  {array} tables array of table names this relation morph's to
     * @param  {string} typeField  type-field name
     * @param  {string} foreignKey foreign-key name
     * @return {MorphTo} MorphTo relation instance
     */

  }, {
    key: 'morphTo',
    value: function morphTo(tables, typeField, foreignKey) {
      var _this40 = this;

      tables = tables.map(function (t) {
        return _this40.table(t);
      });

      return new MorphTo(this, tables, typeField, foreignKey);
    }
  }]);

  return Table;
}();

module.exports = Table;
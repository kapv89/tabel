'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('lodash');

var assign = _require.assign;
var isString = _require.isString;


var Relation = require('./Relation');

var MorphTo = function (_Relation) {
  _inherits(MorphTo, _Relation);

  function MorphTo(ownerTable, toTables, typeField, foreignKey) {
    _classCallCheck(this, MorphTo);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(MorphTo).call(this, ownerTable));

    assign(_this, { fromTable: ownerTable.fork(), toTables: toTables, typeField: typeField, foreignKey: foreignKey });
    return _this;
  }

  _createClass(MorphTo, [{
    key: 'initRelation',
    value: function initRelation() {
      var _this2 = this;

      var fromModels = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

      return fromModels.map(function (m) {
        return assign(m, _defineProperty({}, _this2.relationName, null));
      });
    }
  }, {
    key: 'getRelated',
    value: function getRelated() {
      var _this3 = this;

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      if (args.length === 0) {
        if (this.activeModel !== null) {
          return this.getRelated([this.activeModel]).then(function (results) {
            return results.filter(function (r) {
              return r.type === _this3.activeModel[_this3.typeField];
            }).map(function (_ref) {
              var models = _ref.models;
              return models;
            });
          }).then(function (_ref2) {
            var _ref3 = _slicedToArray(_ref2, 1);

            var relatedModel = _ref3[0];
            return relatedModel;
          });
        } else {
          return Promise.resolve(null);
        }
      }

      var fromModels = args[0];
      var toTables = this.toTables;
      var typeField = this.typeField;
      var foreignKey = this.foreignKey;


      if (fromModels.length === 0) {
        return Promise.resolve([]);
      } else {
        return Promise.all(toTables.map(function (table) {
          var fromKeys = fromModels.filter(function (m) {
            return m[typeField] === table.tableName();
          }).map(function (m) {
            return m[foreignKey];
          });

          return _this3.constraints.apply(table.fork()).whereIn(table.key(), fromKeys).all().then(function (models) {
            return { type: table.tableName(), models: models };
          });
        }));
      }
    }
  }, {
    key: 'matchModels',
    value: function matchModels() {
      var fromModels = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
      var relatedModels = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];
      var relationName = this.relationName;
      var toTables = this.toTables;
      var typeField = this.typeField;
      var foreignKey = this.foreignKey;


      var tableKeyDict = relatedModels.reduce(function (dict, _ref4) {
        var type = _ref4.type;
        var models = _ref4.models;

        var table = toTables.filter(function (t) {
          return t.tableName() === type;
        })[0];

        return assign(dict, _defineProperty({}, type, models.reduce(function (keyDict, model) {
          return assign(keyDict, _defineProperty({}, model[table.key()], model));
        }, {})));
      }, {});

      return fromModels.map(function (m) {
        if (m[typeField] in tableKeyDict && m[foreignKey] in tableKeyDict[m[typeField]]) {
          return assign(m, _defineProperty({}, relationName, tableKeyDict[m[typeField]][m[foreignKey]]));
        } else {
          return assign(m, _defineProperty({}, relationName, null));
        }
      });
    }
  }, {
    key: 'associate',
    value: function associate() {
      var _fromTable$fork$where;

      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      if (args.length < 2) {
        throw new Error('bad method call');
      }

      if (args.length === 2) {
        return this.associate.apply(this, [this.activeModel].concat(args));
      }

      var fromModel = args[0];
      var relatedModel = args[1];
      var tableName = args[2];

      var table = this.toTables.filter(function (t) {
        return t.tableName() === tableName;
      })[0];

      return this.fromTable.fork().whereKey(fromModel).update((_fromTable$fork$where = {}, _defineProperty(_fromTable$fork$where, this.typeField, tableName), _defineProperty(_fromTable$fork$where, this.foreignKey, relatedModel[table.key()]), _fromTable$fork$where));
    }
  }, {
    key: 'dissociate',
    value: function dissociate() {
      var _fromTable$fork$where2;

      for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      if (args.length === 0) {
        return this.dissociate(this.activeModel);
      }

      var fromModel = args[0];


      return this.fromTable.fork().whereKey(fromModel).update((_fromTable$fork$where2 = {}, _defineProperty(_fromTable$fork$where2, this.typeField, null), _defineProperty(_fromTable$fork$where2, this.foreignKey, null), _fromTable$fork$where2));
    }
  }, {
    key: 'update',
    value: function update() {
      var _this4 = this;

      for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }

      if (args.length === 0) {
        throw new Error('bad method call');
      }

      if (args.length === 1) {
        return this.update.apply(this, [this.activeModel].concat(args));
      }

      var fromModel = args[0];
      var values = args[1];

      var table = this.toTables.filter(function (t) {
        return t.tableName() === fromModel[_this4.typeField];
      })[0];

      return this.constraints.apply(table.fork()).whereKey(fromModel[this.foreignKey]).update(values);
    }
  }, {
    key: 'del',
    value: function del() {
      var _this5 = this;

      for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
        args[_key5] = arguments[_key5];
      }

      if (args.length === 0) {
        return this.del(this.activeModel);
      }

      var fromModel = args[0];

      var table = this.toTables.filter(function (t) {
        return t.tableName() === fromModel[_this5.typeField];
      })[0];

      return this.constraints.apply(table.fork()).whereKey(fromModel[this.foreignKey]).del();
    }
  }, {
    key: 'join',
    value: function join(tableName) {
      var joiner = arguments.length <= 1 || arguments[1] === undefined ? function () {} : arguments[1];
      var label = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

      if (this.toTables.map(function (t) {
        return t.tableName();
      }).indexOf(tableName) === -1) {
        return this.ownerTable;
      }

      label = this.jointLabel('' + tableName + (isString(label) ? '.' + label : ''), {});
      var toTable = this.toTables.filter(function (t) {
        return t.tableName() === tableName;
      })[0];
      var fromTable = this.fromTable;
      var typeField = this.typeField;
      var foreignKey = this.foreignKey;


      if (this.ownerTable.scopeTrack.hasJoint(label)) {
        return this.ownerTable;
      } else {
        return this.ownerTable.joint(function (q) {
          q.join(toTable.tableName(), function (j) {
            j.on(fromTable.c(typeField), '=', toTable.raw('?', [toTable.tableName()])).on(fromTable.c(foreignKey), '=', toTable.keyCol());

            joiner(j);
          });
        });
      }
    }
  }, {
    key: 'leftJoin',
    value: function leftJoin(tableName) {
      var joiner = arguments.length <= 1 || arguments[1] === undefined ? function () {} : arguments[1];
      var label = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

      if (this.toTables.map(function (t) {
        return t.tableName();
      }).indexOf(tableName) === -1) {
        return this.ownerTable;
      }

      label = this.jointLabel('' + tableName + (isString(label) ? '.' + label : ''), {
        isLeftJoin: true
      });
      var toTable = this.toTables.filter(function (t) {
        return t.tableName() === tableName;
      })[0];
      var fromTable = this.fromTable;
      var typeField = this.typeField;
      var foreignKey = this.foreignKey;


      if (this.ownerTable.scopeTrack.hasJoint(label)) {
        return this.ownerTable;
      } else {
        return this.ownerTable.joint(function (q) {
          q.leftJoin(toTable.tableName(), function (j) {
            j.on(fromTable.c(typeField), '=', toTable.raw('?', [toTable.tableName()])).on(fromTable.c(foreignKey), '=', toTable.keyCol());

            joiner(j);
          });
        });
      }
    }
  }]);

  return MorphTo;
}(Relation);

module.exports = MorphTo;
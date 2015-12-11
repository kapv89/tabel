'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x13, _x14, _x15) { var _again = true; _function: while (_again) { var object = _x13, property = _x14, receiver = _x15; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x13 = parent; _x14 = property; _x15 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _lodash = require('lodash');

var _isUsableObject = require('../isUsableObject');

var _isUsableObject2 = _interopRequireDefault(_isUsableObject);

var _Relation2 = require('./Relation');

var _Relation3 = _interopRequireDefault(_Relation2);

var BelongsToMany = (function (_Relation) {
  _inherits(BelongsToMany, _Relation);

  function BelongsToMany(ownerTable, toTable, pivotTable, foreignKey, otherKey) {
    var _this = this;

    var joiner = arguments.length <= 5 || arguments[5] === undefined ? function () {} : arguments[5];

    _classCallCheck(this, BelongsToMany);

    _get(Object.getPrototypeOf(BelongsToMany.prototype), 'constructor', this).call(this, ownerTable);
    (0, _lodash.assign)(this, { fromTable: ownerTable.fork(), toTable: toTable, pivotTable: pivotTable, foreignKey: foreignKey, otherKey: otherKey });

    this.pivotFields = [foreignKey, otherKey];

    this.constrain(function (t) {
      t.scope(function (q) {
        return q.join(_this.pivotTable.tableName(), function (j) {
          j.on(_this.pivotTable.c(_this.otherKey), '=', toTable.keyCol());
          joiner(j);
        });
      });
    });
  }

  _createClass(BelongsToMany, [{
    key: 'withPivot',
    value: function withPivot() {
      for (var _len = arguments.length, pivotFields = Array(_len), _key = 0; _key < _len; _key++) {
        pivotFields[_key] = arguments[_key];
      }

      this.pivotFields = pivotFields.concat([this.foreignKey, this.otherKey]);
      return this;
    }
  }, {
    key: 'initRelation',
    value: function initRelation() {
      var _this2 = this;

      var fromModels = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

      return fromModels.map(function (model) {
        return (0, _lodash.assign)(model, _defineProperty({}, _this2.relationName, []));
      });
    }
  }, {
    key: 'getRelated',
    value: function getRelated() {
      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      if (args.length === 0) {
        if (this.activeModel !== null) {
          return this.getRelated([this.activeModel]);
        } else {
          return Promise.resolve([]);
        }
      }

      var fromModels = args[0];
      var fromTable = this.fromTable;
      var pivotTable = this.pivotTable;
      var foreignKey = this.foreignKey;

      var toTable = this.constraints.apply(this.toTable.fork());

      var fromKeys = fromModels.map(function (m) {
        return m[fromTable.key()];
      });

      var cols = ['*'].concat(this.pivotFields.map(function (field) {
        return pivotTable.c(field) + ' as ' + pivotTable.tableName() + '__' + field;
      }));

      return toTable.whereIn(pivotTable.c(foreignKey), fromKeys).select(cols).all().then(function (relatedModels) {
        return relatedModels.map(function (model) {
          var pivot = Object.keys(model).filter(function (field) {
            return field.indexOf(pivotTable.tableName() + '__') > -1;
          }).reduce(function (pivotModel, field) {
            var strippedField = field.slice((pivotTable.tableName() + '__').length);
            return (0, _lodash.assign)({}, pivotModel, _defineProperty({}, strippedField, model[field]));
          }, {});

          return (0, _lodash.assign)(Object.keys(model).filter(function (field) {
            return field.indexOf(pivotTable.tableName() + '__') === -1;
          }).reduce(function (modelWithoutPivots, field) {
            return (0, _lodash.assign)({}, modelWithoutPivots, _defineProperty({}, field, model[field]));
          }, {}), { pivot: pivot });
        });
      });
    }
  }, {
    key: 'matchModels',
    value: function matchModels() {
      var fromModels = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
      var relatedModels = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];
      var relationName = this.relationName;
      var foreignKey = this.foreignKey;
      var fromTable = this.fromTable;

      var keyDict = relatedModels.reduce(function (dict, m) {
        var key = m.pivot[foreignKey];

        if (!(0, _lodash.isArray)(dict[key])) {
          return (0, _lodash.assign)(dict, _defineProperty({}, key, [m]));
        } else {
          return (0, _lodash.assign)(dict, _defineProperty({}, key, dict[key].concat([m])));
        }
      }, {});

      return fromModels.map(function (m) {
        return (0, _lodash.assign)(m, _defineProperty({}, relationName, keyDict[m[fromTable.key()]]));
      });
    }
  }, {
    key: 'sync',
    value: function sync() {
      for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      // if args length is 1 that means we have only values
      // if args length is 2 and fromModel is an
      // array, that means fromModel has not been provided.
      // if args length is 3 that means we have all 3 args
      if (args.length === 1) {
        return this.sync(this.activeModel, args[0], {});
      }

      if (args.length === 2) {
        if ((0, _lodash.isArray)(args[0])) {
          return this.sync.apply(this, [this.activeModel].concat(args));
        } else if ((0, _lodash.isArray)(args[1])) {
          return this.sync(args[0], args[1], {});
        } else {
          throw new Error('bad method call');
        }
      }

      var fromTable = this.fromTable;
      var pivotTable = this.pivotTable;
      var toTable = this.toTable;
      var foreignKey = this.foreignKey;
      var otherKey = this.otherKey;
      var fromModel = args[0];
      var relatedModels = args[1];
      var extraFields = args[2];

      return pivotTable.fork().where(foreignKey, fromModel[fromTable.key()]).del().then(function () {
        if (relatedModels.length === 0) {
          return Promise.resolve([]);
        }

        var relatedKeys = relatedModels.map(function (m) {
          return (0, _isUsableObject2['default'])(m) ? m[toTable.key()] : m;
        });
        var fromKey = fromModel[fromTable.key()];

        var pivots = relatedKeys.map(function (k) {
          var _assign7;

          return (0, _lodash.assign)({}, extraFields, (_assign7 = {}, _defineProperty(_assign7, foreignKey, fromKey), _defineProperty(_assign7, otherKey, k), _assign7));
        });

        return pivotTable.insert(pivots);
      });
    }
  }, {
    key: 'attach',
    value: function attach() {
      var _pivot,
          _this3 = this;

      for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }

      if (args.length === 0) {
        throw new Error('bad method call');
      }

      if (args.length === 1) {
        return this.attach(this.activeModel, args[0], {});
      }

      if (args.length === 2) {
        return this.attach.apply(this, [this.activeModel].concat(args));
      }

      var fromModel = args[0];
      var relatedModel = args[1];
      var extraFields = args[2];

      if ((0, _lodash.isArray)(relatedModel)) {
        return Promise.all(relatedModel.map(function (m) {
          return _this3.attach(fromModel, m, extraFields);
        }));
      }

      var fromTable = this.fromTable;
      var pivotTable = this.pivotTable;
      var toTable = this.toTable;
      var foreignKey = this.foreignKey;
      var otherKey = this.otherKey;

      var pivot = (_pivot = {}, _defineProperty(_pivot, foreignKey, fromModel[fromTable.key()]), _defineProperty(_pivot, otherKey, relatedModel[toTable.key()]), _pivot);

      return pivotTable.insert((0, _lodash.assign)({}, extraFields, pivot));
    }
  }, {
    key: 'detach',
    value: function detach() {
      var _this4 = this;

      for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
        args[_key5] = arguments[_key5];
      }

      if (args.length === 0) {
        throw new Error('bad method call');
      }

      if (args.length === 1) {
        return this.detach(this.activeModel, args[0]);
      }

      if (args.length === 2) {
        return this.detach.apply(this, [this.activeModel].concat(args));
      }

      var fromModel = args[0];
      var relatedModel = args[1];
      var fromTable = this.fromTable;
      var pivotTable = this.pivotTable;
      var toTable = this.toTable;
      var foreignKey = this.foreignKey;
      var otherKey = this.otherKey;

      if ((0, _lodash.isArray)(relatedModel)) {
        return Promise.all(relatedModel.map(function (m) {
          return _this4.detach(fromModel, m);
        }));
      } else {
        var _pivotTable$fork$where;

        return pivotTable.fork().where((_pivotTable$fork$where = {}, _defineProperty(_pivotTable$fork$where, foreignKey, fromModel[fromTable.key()]), _defineProperty(_pivotTable$fork$where, otherKey, relatedModel[toTable.key()]), _pivotTable$fork$where)).del();
      }
    }
  }, {
    key: 'insert',
    value: function insert() {
      for (var _len6 = arguments.length, args = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
        args[_key6] = arguments[_key6];
      }

      if (args.length === 0) {
        throw new Error('bad method call');
      }

      if (args.length === 1) {
        return this.insert.apply(this, [this.activeModel].concat(args));
      }

      var fromTable = this.fromTable;
      var pivotTable = this.pivotTable;
      var toTable = this.toTable;
      var foreignKey = this.foreignKey;
      var otherKey = this.otherKey;
      var fromModel = args[0];
      var values = args[1];

      return toTable.insert(values).then(function (relatedModel) {
        var newPivots = (function () {
          if ((0, _lodash.isArray)(relatedModel)) {
            return relatedModel.map(function (m) {
              var _pivotFields;

              var pivotFields = (_pivotFields = {}, _defineProperty(_pivotFields, foreignKey, fromModel[fromTable.key()]), _defineProperty(_pivotFields, otherKey, m[toTable.key()]), _pivotFields);

              if ('pivot' in m) {
                return (0, _lodash.assign)({}, pivotFields, m.pivot);
              } else {
                return pivotFields;
              }
            });
          } else {
            var _pivotFields2;

            var pivotFields = (_pivotFields2 = {}, _defineProperty(_pivotFields2, foreignKey, fromModel[fromTable.key()]), _defineProperty(_pivotFields2, otherKey, relatedModel[toTable.key()]), _pivotFields2);

            if ('pivot' in relatedModel) {
              return (0, _lodash.assign)({}, pivotFields, relatedModel.pivot);
            } else {
              return pivotFields;
            }
          }
        })();

        return pivotTable.insert(newPivots);
      });
    }
  }, {
    key: 'update',
    value: function update() {
      var _this5 = this;

      for (var _len7 = arguments.length, args = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
        args[_key7] = arguments[_key7];
      }

      if (args.length === 0) {
        throw new Error('bad method call');
      }

      if (args.length === 1) {
        return this.update.apply(this, [this.activeModel].concat(args));
      }

      var fromTable = this.fromTable;
      var pivotTable = this.pivotTable;
      var foreignKey = this.foreignKey;
      var otherKey = this.otherKey;

      var toTable = this.constraints.apply(this.toTable.fork());
      var fromModel = args[0];
      var values = args[1];

      if ((0, _lodash.isArray)(values)) {
        return Promise.all(values.map(function (v) {
          return _this5.update(fromModel, v);
        }));
      } else {
        if ('pivot' in values) {
          var _pivotCondition;

          var pivotCondition = (_pivotCondition = {}, _defineProperty(_pivotCondition, foreignKey, fromModel[fromTable.key()]), _defineProperty(_pivotCondition, otherKey, values[toTable.key()]), _pivotCondition);

          return Promise.all([pivotTable.fork().where(pivotCondition).update(values.pivot), toTable.fork().whereKey(values).update(values)]);
        } else {
          return toTable.fork().whereKey(values).update(values);
        }
      }
    }
  }, {
    key: 'del',
    value: function del() {
      for (var _len8 = arguments.length, args = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
        args[_key8] = arguments[_key8];
      }

      if (args.length === 0) {
        return this.del(this.activeModel);
      }

      var fromTable = this.fromTable;
      var pivotTable = this.pivotTable;
      var toTable = this.toTable;
      var foreignKey = this.foreignKey;
      var fromModel = args[0];

      return this.constraints.apply(toTable.fork()).where(pivotTable.c(foreignKey), fromModel[fromTable.key()]).del().then(function () {
        return pivotTable.fork().where(foreignKey, fromModel[fromTable.key()]).del();
      });
    }
  }, {
    key: 'join',
    value: function join() {
      var joiner = arguments.length <= 0 || arguments[0] === undefined ? function () {} : arguments[0];
      var label = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

      label = this.jointLabel(label, {});
      var pivotTable = this.pivotTable;
      var toTable = this.toTable;
      var otherKey = this.otherKey;

      if (this.ownerTable.hasJoint(label)) {
        return this.ownerTable;
      } else {
        return this.joinPivot().joint(function (q) {
          q.join(toTable.tableName(), function (j) {
            j.on(toTable.keyCol(), '=', pivotTable.c(otherKey));
            joiner(j);
          });
        });
      }
    }
  }, {
    key: 'joinPivot',
    value: function joinPivot() {
      var joiner = arguments.length <= 0 || arguments[0] === undefined ? function () {} : arguments[0];
      var label = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

      label = this.pivotJointLabel(label, {});
      var pivotTable = this.pivotTable;
      var fromTable = this.fromTable;
      var foreignKey = this.foreignKey;

      if (this.ownerTable.hasJoint(label)) {
        return this.ownerTable;
      } else {
        return this.ownerTable.joint(function (q) {
          q.join(pivotTable.tableName(), function (j) {
            j.on(fromTable.keyCol(), '=', pivotTable.c(foreignKey));
            joiner(j);
          });
        }, label);
      }
    }
  }, {
    key: 'leftJoin',
    value: function leftJoin() {
      var joiner = arguments.length <= 0 || arguments[0] === undefined ? function () {} : arguments[0];
      var label = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

      label = this.jointLabel(label, { isLeftJoin: true });
      var pivotTable = this.pivotTable;
      var toTable = this.toTable;
      var otherKey = this.otherKey;

      if (this.ownerTable.hasJoint(label)) {
        return this.ownerTable;
      } else {
        return this.leftJoinPivot().joint(function (q) {
          q.leftJoin(toTable.tableName(), function (j) {
            j.on(toTable.keyCol(), '=', pivotTable.c(otherKey));
            joiner(j);
          });
        });
      }
    }
  }, {
    key: 'leftJoinPivot',
    value: function leftJoinPivot() {
      var joiner = arguments.length <= 0 || arguments[0] === undefined ? function () {} : arguments[0];
      var label = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

      label = this.pivotJointLabel(label, { isLeftJoin: true });
      var pivotTable = this.pivotTable;
      var fromTable = this.fromTable;
      var foreignKey = this.foreignKey;

      if (this.ownerTable.hasJoint(label)) {
        return this.ownerTable;
      } else {
        return this.ownerTable.joint(function (q) {
          q.leftJoin(pivotTable.tableName(), function (j) {
            j.on(fromTable.keyCol(), '=', pivotTable.c(foreignKey));
            joiner(j);
          });
        }, label);
      }
    }
  }]);

  return BelongsToMany;
})(_Relation3['default']);

exports['default'] = BelongsToMany;
module.exports = exports['default'];
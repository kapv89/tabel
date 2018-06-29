'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('lodash'),
    assign = _require.assign,
    isArray = _require.isArray;

var isUsableObject = require('isusableobject');

var Relation = require('./Relation');

var ManyToMany = function (_Relation) {
  _inherits(ManyToMany, _Relation);

  function ManyToMany(ownerTable, toTable, pivotTable, foreignKey, otherKey) {
    var joiner = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : function () {};

    _classCallCheck(this, ManyToMany);

    var _this = _possibleConstructorReturn(this, (ManyToMany.__proto__ || Object.getPrototypeOf(ManyToMany)).call(this, ownerTable));

    assign(_this, { fromTable: ownerTable.fork(), toTable: toTable, pivotTable: pivotTable, foreignKey: foreignKey, otherKey: otherKey });

    _this.pivotFields = [foreignKey, otherKey];

    _this.constrain(function (t) {
      t.scope(function (q) {
        return q.join(_this.pivotTable.tableName(), function (j) {
          j.on(_this.pivotTable.c(_this.otherKey), '=', toTable.keyCol());
          joiner(j);
        });
      });
    });
    return _this;
  }

  _createClass(ManyToMany, [{
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

      var fromModels = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

      return fromModels.map(function (model) {
        return assign(model, _defineProperty({}, _this2.relationName, []));
      });
    }
  }, {
    key: 'getRelated',
    value: function getRelated() {
      var _toTable$whereIn;

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
      var fromTable = this.fromTable,
          pivotTable = this.pivotTable,
          foreignKey = this.foreignKey;

      var toTable = this.constraints.apply(this.toTable.fork());

      var fromKeys = fromModels.map(function (m) {
        return m[fromTable.key()];
      });

      var cols = ['*'].concat(this.pivotFields.map(function (field) {
        return pivotTable.c(field) + ' as ' + pivotTable.tableName() + '__' + field;
      }));

      return (_toTable$whereIn = toTable.whereIn(pivotTable.c(foreignKey), fromKeys)).select.apply(_toTable$whereIn, _toConsumableArray(cols)).all().then(function (relatedModels) {
        return relatedModels.map(function (model) {
          var pivot = Object.keys(model).filter(function (field) {
            return field.indexOf(pivotTable.tableName() + '__') > -1;
          }).reduce(function (pivotModel, field) {
            var strippedField = field.slice((pivotTable.tableName() + '__').length);
            return assign({}, pivotModel, _defineProperty({}, strippedField, model[field]));
          }, {});

          return assign(Object.keys(model).filter(function (field) {
            return field.indexOf(pivotTable.tableName() + '__') === -1;
          }).reduce(function (modelWithoutPivots, field) {
            return assign({}, modelWithoutPivots, _defineProperty({}, field, model[field]));
          }, {}), { pivot: pivot });
        });
      });
    }
  }, {
    key: 'matchModels',
    value: function matchModels() {
      var fromModels = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      var relatedModels = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
      var relationName = this.relationName,
          foreignKey = this.foreignKey,
          fromTable = this.fromTable;


      var keyDict = relatedModels.reduce(function (dict, m) {
        var key = m.pivot[foreignKey];

        if (!isArray(dict[key])) {
          return assign(dict, _defineProperty({}, key, [m]));
        } else {
          return assign(dict, _defineProperty({}, key, dict[key].concat([m])));
        }
      }, {});

      return fromModels.map(function (m) {
        return assign(m, _defineProperty({}, relationName, isArray(keyDict[m[fromTable.key()]]) ? keyDict[m[fromTable.key()]] : []));
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
        if (isArray(args[0])) {
          return this.sync.apply(this, [this.activeModel].concat(args));
        } else if (isArray(args[1])) {
          return this.sync(args[0], args[1], {});
        } else {
          throw new Error('bad method call');
        }
      }

      var fromTable = this.fromTable,
          pivotTable = this.pivotTable,
          toTable = this.toTable,
          foreignKey = this.foreignKey,
          otherKey = this.otherKey;
      var fromModel = args[0],
          relatedModels = args[1],
          extraFields = args[2];


      return pivotTable.fork().where(foreignKey, fromModel[fromTable.key()]).del().then(function () {
        if (relatedModels.length === 0) {
          return Promise.resolve([]);
        }

        var relatedKeys = relatedModels.map(function (m) {
          return isUsableObject(m) ? m[toTable.key()] : m;
        });
        var fromKey = fromModel[fromTable.key()];

        var pivots = relatedKeys.map(function (k) {
          var _assign7;

          return assign({}, extraFields, (_assign7 = {}, _defineProperty(_assign7, foreignKey, fromKey), _defineProperty(_assign7, otherKey, k), _assign7));
        });

        return pivotTable.insert(pivots);
      });
    }
  }, {
    key: 'attach',
    value: function attach() {
      var _this3 = this,
          _pivot;

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

      var fromModel = args[0],
          relatedModel = args[1],
          extraFields = args[2];


      if (isArray(relatedModel)) {
        return Promise.all(relatedModel.map(function (m) {
          return _this3.attach(fromModel, m, extraFields);
        }));
      }

      var fromTable = this.fromTable,
          pivotTable = this.pivotTable,
          toTable = this.toTable,
          foreignKey = this.foreignKey,
          otherKey = this.otherKey;


      var pivot = (_pivot = {}, _defineProperty(_pivot, foreignKey, fromModel[fromTable.key()]), _defineProperty(_pivot, otherKey, relatedModel[toTable.key()]), _pivot);

      return pivotTable.insert(assign({}, extraFields, pivot));
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

      var fromModel = args[0],
          relatedModel = args[1];
      var fromTable = this.fromTable,
          pivotTable = this.pivotTable,
          toTable = this.toTable,
          foreignKey = this.foreignKey,
          otherKey = this.otherKey;


      if (isArray(relatedModel)) {
        return Promise.all(relatedModel.map(function (m) {
          return _this4.detach(fromModel, m);
        }));
      } else {
        var _pivotTable$fork$wher;

        return pivotTable.fork().where((_pivotTable$fork$wher = {}, _defineProperty(_pivotTable$fork$wher, foreignKey, fromModel[fromTable.key()]), _defineProperty(_pivotTable$fork$wher, otherKey, relatedModel[toTable.key()]), _pivotTable$fork$wher)).del();
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

      var fromTable = this.fromTable,
          pivotTable = this.pivotTable,
          toTable = this.toTable,
          foreignKey = this.foreignKey,
          otherKey = this.otherKey;
      var fromModel = args[0],
          values = args[1];


      return toTable.insert(values).then(function (relatedModel) {
        var newPivots = function () {
          if (isArray(relatedModel)) {
            return relatedModel.map(function (m) {
              var _pivotFields;

              var pivotFields = (_pivotFields = {}, _defineProperty(_pivotFields, foreignKey, fromModel[fromTable.key()]), _defineProperty(_pivotFields, otherKey, m[toTable.key()]), _pivotFields);

              if ('pivot' in m) {
                return assign({}, pivotFields, m.pivot);
              } else {
                return pivotFields;
              }
            });
          } else {
            var _pivotFields3;

            var _pivotFields2 = (_pivotFields3 = {}, _defineProperty(_pivotFields3, foreignKey, fromModel[fromTable.key()]), _defineProperty(_pivotFields3, otherKey, relatedModel[toTable.key()]), _pivotFields3);

            if ('pivot' in relatedModel) {
              return assign({}, _pivotFields2, relatedModel.pivot);
            } else {
              return _pivotFields2;
            }
          }
        }();

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

      var fromTable = this.fromTable,
          pivotTable = this.pivotTable,
          foreignKey = this.foreignKey,
          otherKey = this.otherKey;

      var toTable = this.constraints.apply(this.toTable.fork());
      var fromModel = args[0],
          values = args[1];


      if (isArray(values)) {
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

      var fromTable = this.fromTable,
          pivotTable = this.pivotTable,
          toTable = this.toTable,
          foreignKey = this.foreignKey;
      var fromModel = args[0];


      return this.constraints.apply(toTable.fork()).where(pivotTable.c(foreignKey), fromModel[fromTable.key()]).del().then(function () {
        return pivotTable.fork().where(foreignKey, fromModel[fromTable.key()]).del();
      });
    }
  }, {
    key: 'join',
    value: function join() {
      var joiner = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function () {};
      var label = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

      label = this.jointLabel(label, {});
      var pivotTable = this.pivotTable,
          toTable = this.toTable,
          otherKey = this.otherKey;


      if (this.ownerTable.scopeTrack.hasJoint(label)) {
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
      var joiner = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function () {};
      var label = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

      label = this.pivotJointLabel(label, {});
      var pivotTable = this.pivotTable,
          fromTable = this.fromTable,
          foreignKey = this.foreignKey;


      if (this.ownerTable.scopeTrack.hasJoint(label)) {
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
      var joiner = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function () {};
      var label = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

      label = this.jointLabel(label, { isLeftJoin: true });
      var pivotTable = this.pivotTable,
          toTable = this.toTable,
          otherKey = this.otherKey;


      if (this.ownerTable.scopeTrack.hasJoint(label)) {
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
      var joiner = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function () {};
      var label = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

      label = this.pivotJointLabel(label, { isLeftJoin: true });
      var pivotTable = this.pivotTable,
          fromTable = this.fromTable,
          foreignKey = this.foreignKey;


      if (this.ownerTable.scopeTrack.hasJoint(label)) {
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

  return ManyToMany;
}(Relation);

module.exports = ManyToMany;
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('lodash');

var assign = _require.assign;
var isArray = _require.isArray;


var Relation = require('./Relation');

var HasManyThrough = function (_Relation) {
  _inherits(HasManyThrough, _Relation);

  function HasManyThrough(ownerTable, toTable, throughTable, firstKey, secondKey) {
    var joiner = arguments.length <= 5 || arguments[5] === undefined ? function () {} : arguments[5];

    _classCallCheck(this, HasManyThrough);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(HasManyThrough).call(this, ownerTable));

    assign(_this, { fromTable: ownerTable.fork(), toTable: toTable, throughTable: throughTable, firstKey: firstKey, secondKey: secondKey });

    _this.throughFields = [throughTable.key(), firstKey];

    _this.constrain(function (t) {
      t.scope(function (q) {
        q.join(_this.throughTable.tableName(), function (j) {
          j.on(_this.throughTable.keyCol(), '=', _this.toTable.c(secondKey));
          joiner(j);
        });
      });
    });
    return _this;
  }

  _createClass(HasManyThrough, [{
    key: 'withThrough',
    value: function withThrough() {
      for (var _len = arguments.length, throughFields = Array(_len), _key = 0; _key < _len; _key++) {
        throughFields[_key] = arguments[_key];
      }

      this.throughFields = throughFields.concat([this.throughTable.key(), this.firstKey]);
      return this;
    }
  }, {
    key: 'initRelation',
    value: function initRelation(fromModels) {
      var _this2 = this;

      return fromModels.map(function (m) {
        return assign(m, _defineProperty({}, _this2.relationName, []));
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
      var fromTable = this.fromTable;
      var throughTable = this.throughTable;
      var firstKey = this.firstKey;

      var toTable = this.constraints.apply(this.toTable.fork());

      var fromKeys = fromModels.map(function (m) {
        return m[fromTable.key()];
      });

      var cols = ['*'].concat(this.throughFields.map(function (field) {
        return throughTable.c(field) + ' as ' + throughTable.tableName() + '__' + field;
      }));

      return (_toTable$whereIn = toTable.whereIn(throughTable.c(firstKey), fromKeys)).select.apply(_toTable$whereIn, _toConsumableArray(cols)).all().then(function (relatedModels) {
        return relatedModels.map(function (model) {
          var through = Object.keys(model).filter(function (field) {
            return field.indexOf(throughTable.tableName() + '__') > -1;
          }).reduce(function (throughModel, field) {
            var strippedField = field.slice((throughTable.tableName() + '__').length);
            return assign({}, throughModel, _defineProperty({}, strippedField, model[field]));
          }, {});

          return assign(Object.keys(model).filter(function (field) {
            return field.indexOf(throughTable.tableName() + '__') === -1;
          }).reduce(function (modelWithoutThroughs, field) {
            return assign({}, modelWithoutThroughs, _defineProperty({}, field, model[field]));
          }, {}), { through: through });
        });
      });
    }
  }, {
    key: 'matchModels',
    value: function matchModels() {
      var fromModels = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
      var relatedModels = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];
      var relationName = this.relationName;
      var firstKey = this.firstKey;
      var fromTable = this.fromTable;


      var keyDict = relatedModels.reduce(function (dict, m) {
        var key = m.through[firstKey];

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
    key: 'join',
    value: function join() {
      var joiner = arguments.length <= 0 || arguments[0] === undefined ? function () {} : arguments[0];
      var label = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

      label = this.jointLabel(label, {});
      var throughTable = this.throughTable;
      var toTable = this.toTable;
      var secondKey = this.secondKey;


      if (this.ownerTable.scopeTrack.hasJoint(label)) {
        return this.ownerTable;
      } else {
        return this.joinThrough().joint(function (q) {
          q.join(toTable.tableName(), function (j) {
            j.on(throughTable.keyCol(), '=', toTable.c(secondKey));
            joiner(j);
          });
        }, label);
      }
    }
  }, {
    key: 'joinThrough',
    value: function joinThrough() {
      var joiner = arguments.length <= 0 || arguments[0] === undefined ? function () {} : arguments[0];
      var label = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

      label = this.throughJointLabel(label, {});
      var fromTable = this.fromTable;
      var throughTable = this.throughTable;
      var firstKey = this.firstKey;


      if (this.ownerTable.scopeTrack.hasJoint(label)) {
        return this.ownerTable;
      } else {
        return this.ownerTable.joint(function (q) {
          q.join(throughTable.tableName(), function (j) {
            j.on(fromTable.keyCol(), '=', throughTable.c(firstKey));
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
      var throughTable = this.throughTable;
      var toTable = this.toTable;
      var secondKey = this.secondKey;


      if (this.ownerTable.scopeTrack.hasJoint(label)) {
        return this.ownerTable;
      } else {
        return this.leftJoinThrough().joint(function (q) {
          q.leftJoin(toTable.tableName(), function (j) {
            j.on(throughTable.keyCol(), '=', toTable.c(secondKey));
            joiner(j);
          });
        }, label);
      }
    }
  }, {
    key: 'leftJoinThrough',
    value: function leftJoinThrough() {
      var joiner = arguments.length <= 0 || arguments[0] === undefined ? function () {} : arguments[0];
      var label = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

      label = this.throughJointLabel(label, { isLeftJoin: true });
      var fromTable = this.fromTable;
      var throughTable = this.throughTable;
      var firstKey = this.firstKey;


      if (this.ownerTable.scopeTrack.hasJoint(label)) {
        return this.ownerTable;
      } else {
        return this.ownerTable.joint(function (q) {
          q.leftJoin(throughTable.tableName(), function (j) {
            j.on(fromTable.keyCol(), '=', throughTable.c(firstKey));
            joiner(j);
          });
        }, label);
      }
    }
  }]);

  return HasManyThrough;
}(Relation);

module.exports = HasManyThrough;
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('lodash');

var assign = _require.assign;
var isArray = _require.isArray;


var Relation = require('./Relation');

var HasMany = function (_Relation) {
  _inherits(HasMany, _Relation);

  function HasMany(ownerTable, toTable, foreignKey, key) {
    _classCallCheck(this, HasMany);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(HasMany).call(this, ownerTable));

    assign(_this, { fromTable: ownerTable.fork(), toTable: toTable, foreignKey: foreignKey, key: key });
    return _this;
  }

  _createClass(HasMany, [{
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
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      if (args.length === 0) {
        if (this.activeModel !== null) {
          return this.getRelated([this.activeModel]);
        } else {
          return Promise.resolve([]);
        }
      }

      var fromModels = args[0];
      var toTable = this.toTable;
      var foreignKey = this.foreignKey;
      var key = this.key;


      return this.constraints.apply(toTable.fork()).whereIn(foreignKey, fromModels.map(function (m) {
        return m[key];
      })).all();
    }
  }, {
    key: 'matchModels',
    value: function matchModels() {
      var fromModels = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
      var relatedModels = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];
      var relationName = this.relationName;
      var foreignKey = this.foreignKey;
      var key = this.key;


      var keyDict = relatedModels.reduce(function (dict, m) {
        var key = m[foreignKey];

        if (!isArray(dict[key])) {
          return assign(dict, _defineProperty({}, key, [m]));
        } else {
          return assign(dict, _defineProperty({}, key, dict[key].concat(m)));
        }
      }, {});

      return fromModels.map(function (m) {
        return assign(m, _defineProperty({}, relationName, isArray(keyDict[m[key]]) ? keyDict[m[key]] : []));
      });
    }
  }, {
    key: 'insert',
    value: function insert() {
      var _this3 = this;

      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      if (args.length === 0) {
        throw new Error('bad method call');
      }

      if (args.length === 1) {
        return this.insert.apply(this, [this.activeModel].concat(args));
      }

      var fromModel = args[0];
      var values = args[1];


      return this.toTable.insert(function () {
        if (isArray(values)) {
          return values.map(function (v) {
            return assign(v, _defineProperty({}, _this3.foreignKey, fromModel[_this3.key]));
          });
        } else {
          return assign(values, _defineProperty({}, _this3.foreignKey, fromModel[_this3.key]));
        }
      }());
    }
  }, {
    key: 'update',
    value: function update() {
      for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      if (args.length === 0) {
        throw new Error('bad method call');
      }

      if (args.length === 1) {
        return this.update.apply(this, [this.activeModel].concat(args));
      }

      var fromModel = args[0];
      var values = args[1];


      return this.constraints.apply(this.toTable.fork()).where(this.foreignKey, fromModel[this.key]).update(assign(values, _defineProperty({}, this.foreignKey, fromModel[this.key])));
    }
  }, {
    key: 'del',
    value: function del() {
      for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }

      if (args.length === 0) {
        return this.del(this.activeModel);
      }

      var fromModel = args[0];


      return this.constraints.apply(this.toTable.fork()).where(this.foreignKey, fromModel[this.key]).del();
    }
  }, {
    key: 'join',
    value: function join() {
      var joiner = arguments.length <= 0 || arguments[0] === undefined ? function () {} : arguments[0];
      var label = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

      label = this.jointLabel(label, {});
      var fromTable = this.fromTable;
      var toTable = this.toTable;
      var foreignKey = this.foreignKey;
      var key = this.key;


      if (this.ownerTable.scopeTrack.hasJoint(label)) {
        return this.ownerTable;
      } else {
        return this.ownerTable.joint(function (q) {
          q.join(toTable.tableName(), function (j) {
            j.on(toTable.c(foreignKey), '=', fromTable.c(key));
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
      var fromTable = this.fromTable;
      var toTable = this.toTable;
      var foreignKey = this.foreignKey;
      var key = this.key;


      if (this.ownerTable.scopeTrack.hasJoint(label)) {
        return this.ownerTable;
      } else {
        return this.ownerTable.joint(function (q) {
          q.leftJoin(toTable.tableName(), function (j) {
            j.on(toTable.c(foreignKey), '=', fromTable.c(key));
            joiner(j);
          });
        }, label);
      }
    }
  }]);

  return HasMany;
}(Relation);

module.exports = HasMany;
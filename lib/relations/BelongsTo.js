'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x8, _x9, _x10) { var _again = true; _function: while (_again) { var object = _x8, property = _x9, receiver = _x10; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x8 = parent; _x9 = property; _x10 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _lodash = require('lodash');

var _Relation2 = require('./Relation');

var _Relation3 = _interopRequireDefault(_Relation2);

var BelongsTo = (function (_Relation) {
  _inherits(BelongsTo, _Relation);

  function BelongsTo(ownerTable, toTable, foreignKey, otherKey) {
    _classCallCheck(this, BelongsTo);

    _get(Object.getPrototypeOf(BelongsTo.prototype), 'constructor', this).call(this, ownerTable);
    (0, _lodash.assign)(this, { fromTable: ownerTable.fork(), toTable: toTable, foreignKey: foreignKey, otherKey: otherKey });
  }

  _createClass(BelongsTo, [{
    key: 'initRelation',
    value: function initRelation() {
      var _this = this;

      var fromModels = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

      return fromModels.map(function (model) {
        return (0, _lodash.assign)(model, _defineProperty({}, _this.relationName, null));
      });
    }
  }, {
    key: 'getRelated',
    value: function getRelated() {
      var _this2 = this;

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      if (args.length === 0) {
        if (this.activeModel !== null) {
          return this.getRelated([this.activeModel]).then(function (_ref) {
            var _ref2 = _slicedToArray(_ref, 1);

            var relatedModel = _ref2[0];
            return relatedModel;
          });
        } else {
          return Promise.resolve(null);
        }
      }

      var fromModels = args[0];

      if (fromModels.length === 0) {
        return Promise.resolve([]);
      } else {
        var foreignKeys = fromModels.filter(function (m) {
          return !!m;
        }).map(function (m) {
          return m[_this2.foreignKey];
        });

        return this.constraints.apply(this.toTable.fork()).whereIn(this.otherKey, foreignKeys).all();
      }
    }
  }, {
    key: 'matchModels',
    value: function matchModels() {
      var _this3 = this;

      var fromModels = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
      var relatedModels = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

      var keyDict = relatedModels.reduce(function (dict, m) {
        return (0, _lodash.assign)(dict, _defineProperty({}, m[_this3.otherKey], m));
      }, {});

      return fromModels.map(function (m) {
        return (0, _lodash.assign)(m, _defineProperty({}, _this3.relationName, keyDict[m[_this3.foreignKey]]));
      });
    }
  }, {
    key: 'associate',
    value: function associate() {
      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      if (args.length === 0) {
        throw new Error('bad method call');
      }

      if (args.length === 1) {
        return this.associate.apply(this, [this.activeModel].concat(args));
      }

      var fromModel = args[0];
      var toModel = args[1];

      return this.fromTable.whereKey(fromModel).update(_defineProperty({}, this.foreignKey, toModel[this.otherKey]));
    }
  }, {
    key: 'dissociate',
    value: function dissociate() {
      for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      if (args.length === 0) {
        return this.dissociate(this.activeModel);
      }

      var fromModel = args[0];

      return this.fromTable.whereKey(fromModel).update(_defineProperty({}, this.foreignKey, null));
    }
  }, {
    key: 'update',
    value: function update() {
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

      return this.constraints.apply(this.toTable.fork()).where(this.otherKey, fromModel[this.foreignKey]).update(values);
    }
  }, {
    key: 'del',
    value: function del() {
      for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
        args[_key5] = arguments[_key5];
      }

      if (args.length === 0) {
        return this.del(this.activeModel);
      }

      var fromModel = args[0];

      return this.constraints.apply(this.toTable.fork()).where(this.otherKey, fromModel[this.foreignKey]).del();
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
      var otherKey = this.otherKey;

      if (this.ownerTable.hasJoint(label)) {
        return this.ownerTable;
      } else {
        return this.ownerTable.joint(function (q) {
          q.join(toTable.tableName(), function (j) {
            j.on(fromTable.c(foreignKey), '=', toTable.c(otherKey));
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
      var otherKey = this.otherKey;

      if (this.ownerTable.hasJoint(label)) {
        return this.ownerTable;
      } else {
        return this.ownerTable.joint(function (q) {
          q.leftJoin(toTable.tableName(), function (j) {
            j.on(fromTable.c(foreignKey), '=', toTable.c(otherKey));
            joiner(j);
          });
        }, label);
      }
    }
  }]);

  return BelongsTo;
})(_Relation3['default']);

exports['default'] = BelongsTo;
module.exports = exports['default'];
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('lodash'),
    assign = _require.assign;

var isUsableObject = require('isusableobject');

var Relation = require('./Relation');

var HasOne = function (_Relation) {
  _inherits(HasOne, _Relation);

  function HasOne(ownerTable, toTable, foreignKey, key) {
    _classCallCheck(this, HasOne);

    var _this = _possibleConstructorReturn(this, (HasOne.__proto__ || Object.getPrototypeOf(HasOne)).call(this, ownerTable));

    assign(_this, { fromTable: ownerTable.fork(), toTable: toTable, foreignKey: foreignKey, key: key });
    return _this;
  }

  _createClass(HasOne, [{
    key: 'initRelation',
    value: function initRelation(fromModels) {
      var _this2 = this;

      return fromModels.map(function (m) {
        return assign(m, _defineProperty({}, _this2.relationName, null));
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
          return this.getRelated([this.activeModel]).then(function (_ref) {
            var _ref2 = _slicedToArray(_ref, 1),
                relatedModel = _ref2[0];

            return relatedModel;
          });
        } else {
          return Promise.resolve(null);
        }
      }

      var fromModels = args[0];
      var toTable = this.toTable,
          foreignKey = this.foreignKey,
          key = this.key;


      return this.constraints.apply(toTable.fork()).whereIn(foreignKey, fromModels.map(function (m) {
        return m[key];
      })).all();
    }
  }, {
    key: 'matchModels',
    value: function matchModels() {
      var fromModels = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      var relatedModels = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
      var relationName = this.relationName,
          foreignKey = this.foreignKey,
          key = this.key;


      var keyDict = relatedModels.reduce(function (dict, m) {
        return assign(dict, _defineProperty({}, m[foreignKey], m));
      }, {});

      return fromModels.map(function (m) {
        return assign(m, _defineProperty({}, relationName, isUsableObject(keyDict[m[key]]) ? keyDict[m[key]] : null));
      });
    }
  }, {
    key: 'insert',
    value: function insert() {
      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      if (args.length === 0) {
        throw new Error('bad method call');
      }

      if (args.length === 1) {
        return this.insert.apply(this, [this.activeModel].concat(args));
      }

      var fromModel = args[0],
          values = args[1];


      return this.toTable.insert(assign(values, _defineProperty({}, this.foreignKey, fromModel[this.key])));
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

      var fromModel = args[0],
          values = args[1];


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


      return this.constraints.apply(this.toTable.fork()).where(this.foreignKey, fromModel).del();
    }
  }, {
    key: 'join',
    value: function join() {
      var joiner = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function () {};
      var label = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

      label = this.jointLabel(label, {});
      var fromTable = this.fromTable,
          toTable = this.toTable,
          foreignKey = this.foreignKey,
          key = this.key;


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
      var joiner = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function () {};
      var label = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

      label = this.jointLabel(label, { isLeftJoin: true });
      var fromTable = this.fromTable,
          toTable = this.toTable,
          foreignKey = this.foreignKey,
          key = this.key;


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

  return HasOne;
}(Relation);

module.exports = HasOne;
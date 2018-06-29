'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Already used methods:
 * - setName
 * - forModel
 * - constrain
 * - eagerLoad
 * - load
 */

var _require = require('lodash'),
    isString = _require.isString;

var Scope = require('../Scope');
var Track = require('../Track');

var Relation = function () {
  function Relation(ownerTable) {
    _classCallCheck(this, Relation);

    this.ownerTable = ownerTable;
    this.constraints = new Track();
    this.activeModel = null;
    this.relationName = null;
  }

  _createClass(Relation, [{
    key: 'setName',
    value: function setName(relationName) {
      this.relationName = relationName;
      return this;
    }
  }, {
    key: 'forModel',
    value: function forModel(model) {
      this.activeModel = model;
      return this;
    }
  }, {
    key: 'constrain',
    value: function constrain(constraint) {
      var label = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'constraint';

      this.constraints.push(new Scope(constraint, label));
      return this;
    }
  }, {
    key: 'eagerLoad',
    value: function eagerLoad() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return this.constrain(function (t) {
        return t.eagerLoad.apply(t, args);
      }, 'eagerLoad');
    }
  }, {
    key: 'load',
    value: function load() {
      var _this = this;

      var fromModels = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

      if (fromModels.length === 0) {
        return Promise.resolve(fromModels);
      }

      return this.getRelated(fromModels).then(function (relatedModels) {
        return _this.matchModels(_this.initRelation(fromModels), relatedModels);
      });
    }
  }, {
    key: 'initRelation',
    value: function initRelation() {
      var fromModels = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

      throw new Error('not implemented');
    }
  }, {
    key: 'getRelated',
    value: function getRelated() {
      var fromModels = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

      throw new Error('not implemented');
    }
  }, {
    key: 'matchModels',
    value: function matchModels() {
      var fromModels = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      var relatedModels = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

      throw new Error('not implemented');
    }
  }, {
    key: 'jointLabel',
    value: function jointLabel(label, _ref) {
      var _ref$isLeftJoin = _ref.isLeftJoin,
          isLeftJoin = _ref$isLeftJoin === undefined ? false : _ref$isLeftJoin;

      return (isLeftJoin ? 'leftJoin' : 'join') + '.' + this.constructor.name + '.' + this.relationName + (isString(label) ? '.' + label : '');
    }
  }, {
    key: 'pivotJointLabel',
    value: function pivotJointLabel(label, _ref2) {
      var _ref2$isLeftJoin = _ref2.isLeftJoin,
          isLeftJoin = _ref2$isLeftJoin === undefined ? false : _ref2$isLeftJoin;

      return this.jointLabel(label, { isLeftJoin: isLeftJoin }) + '.pivot' + (isString(label) ? '.' + label : '');
    }
  }, {
    key: 'throughJointLabel',
    value: function throughJointLabel(label, _ref3) {
      var _ref3$isLeftJoin = _ref3.isLeftJoin,
          isLeftJoin = _ref3$isLeftJoin === undefined ? false : _ref3$isLeftJoin;

      return this.jointLabel(label, { isLeftJoin: isLeftJoin }) + '.through' + (isString(label) ? '.' + label : '');
    }
  }, {
    key: 'join',
    value: function join() {
      throw new Error('not implemented');
    }
  }, {
    key: 'joinPivot',
    value: function joinPivot() {
      throw new Error('not imeplemented');
    }
  }, {
    key: 'joinThrough',
    value: function joinThrough() {
      throw new Error('not imeplemented');
    }
  }]);

  return Relation;
}();

module.exports = Relation;
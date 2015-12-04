/**
 * Already used methods:
 * - setName
 * - forModel
 * - constrain
 * - eagerLoad
 * - load
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _lodash = require('lodash');

var _Scope = require('../Scope');

var _Scope2 = _interopRequireDefault(_Scope);

var _Track = require('../Track');

var _Track2 = _interopRequireDefault(_Track);

var Relation = (function () {
  function Relation() {
    _classCallCheck(this, Relation);

    this.constraints = new _Track2['default']();
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
      var label = arguments.length <= 1 || arguments[1] === undefined ? 'constraint' : arguments[1];

      this.constraints.push(new _Scope2['default'](constraint, label));
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

      var fromModels = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

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
      var fromModels = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

      throw new Error('not implemented');
    }
  }, {
    key: 'getRelated',
    value: function getRelated() {
      var fromModels = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

      throw new Error('not implemented');
    }
  }, {
    key: 'matchModels',
    value: function matchModels() {
      var fromModels = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
      var relatedModels = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

      throw new Error('not implemented');
    }
  }, {
    key: 'jointLabel',
    value: function jointLabel(label, _ref) {
      var _ref$isLeftJoin = _ref.isLeftJoin;
      var isLeftJoin = _ref$isLeftJoin === undefined ? false : _ref$isLeftJoin;

      return (isLeftJoin ? 'leftJoin' : 'join') + '.' + this.constructor.name + '.' + this.relationName + ((0, _lodash.isString)(label) ? '.' + label : '');
    }
  }, {
    key: 'pivotJointLabel',
    value: function pivotJointLabel(label, _ref2) {
      var _ref2$isLeftJoin = _ref2.isLeftJoin;
      var isLeftJoin = _ref2$isLeftJoin === undefined ? false : _ref2$isLeftJoin;

      return this.jointLabel(label, { isLeftJoin: isLeftJoin }) + '.pivot' + ((0, _lodash.isString)(label) ? '.' + label : '');
    }
  }, {
    key: 'throughJointLabel',
    value: function throughJointLabel(label, _ref3) {
      var _ref3$isLeftJoin = _ref3.isLeftJoin;
      var isLeftJoin = _ref3$isLeftJoin === undefined ? false : _ref3$isLeftJoin;

      return this.jointLabel(label, { isLeftJoin: isLeftJoin }) + '.through' + ((0, _lodash.isString)(label) ? '.' + label : '');
    }
  }, {
    key: 'join',
    value: function join(tableContext) {
      throw new Error('not implemented');
    }
  }, {
    key: 'joinPivot',
    value: function joinPivot(tableContext) {
      throw new Error('not imeplemented');
    }
  }, {
    key: 'joinThrough',
    value: function joinThrough(tableContext) {
      throw new Error('not imeplemented');
    }
  }]);

  return Relation;
})();

exports['default'] = Relation;
module.exports = exports['default'];
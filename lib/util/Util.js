/**
 * An orm utils manager
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _Scoper = require('./Scoper');

var _Scoper2 = _interopRequireDefault(_Scoper);

var _Transformer = require('./Transformer');

var _Transformer2 = _interopRequireDefault(_Transformer);

var _Validator = require('./Validator');

var _Validator2 = _interopRequireDefault(_Validator);

var Util = (function () {
  function Util(orm) {
    _classCallCheck(this, Util);

    this.orm = orm;
    this.scopers = new Map();
    this.transformers = new Map();
    this.validators = new Map();
  }

  _createClass(Util, [{
    key: 'newScoper',
    value: function newScoper(scopes) {
      return new _Scoper2['default'](scopes);
    }
  }, {
    key: 'defineScoper',
    value: function defineScoper(name, scopes) {
      this.scopers.set(name, this.newScoper(scopes));
      return this;
    }
  }, {
    key: 'scoper',
    value: function scoper(name) {
      return this.scopers.get(name);
    }
  }, {
    key: 'newTransformer',
    value: function newTransformer(transformations) {
      return new _Transformer2['default'](transformations);
    }
  }, {
    key: 'defineTransformer',
    value: function defineTransformer(name, transformations) {
      this.transformers.set(name, this.newTransformer(transformations));
      return this;
    }
  }, {
    key: 'transformer',
    value: function transformer(name) {
      return this.transformers.get(name);
    }
  }, {
    key: 'newValidator',
    value: function newValidator(validations) {
      return new _Validator2['default'](validations);
    }
  }, {
    key: 'defineValidator',
    value: function defineValidator(name, validations) {
      this.validators.set(name, this.newValidator(validations));
      return this;
    }
  }, {
    key: 'validator',
    value: function validator(name) {
      return this.validators.get(name);
    }
  }]);

  return Util;
})();

exports['default'] = Util;
module.exports = exports['default'];
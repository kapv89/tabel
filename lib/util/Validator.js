/**
 * Promise based validation of input
 *
 * Usage
 *
 * orm.util.defineValidator(
 *   'posts.new',
 *   {
 *     ['user_id'](userId, input) {
 *       return orm.table('users').find(userId)
 *         .then((user) => {
 *           if (user) {
 *             return null;
 *           } else {
 *             return 'invalid user'
 *           }
 *         });
 *     },
 *     ['title'](title, input) {
 *       return Promise.all([
 *         ! isString(title) ? 'title is required' : null,
 *         orm.tbl('posts').find({title}).then((existing) => {
 *           return !!existing ? 'title should be unique' : null;
 *         })
 *       ]).then((errors) => compact(errors));
 *     },
 *     ['meta'](meta, input) {
 *       if (! isUsableObject(meta)) {
 *         return ['meta should be an object'];
 *       } else {
 *         return compact(['target_country', 'twitter:og'].map((k) => {
 *           return ! isString(meta[k]) ? 'you need to provide meta info' : null;
 *         }));
 *       }
 *     }
 *   }
 * )
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _lodash = require('lodash');

var _isUsableObject = require('../isUsableObject');

var _isUsableObject2 = _interopRequireDefault(_isUsableObject);

var Validator = (function () {
  function Validator(container) {
    var validations = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

    _classCallCheck(this, Validator);

    this.container = container;
    this.validations = new Map();

    this.addValidations(validations);
  }

  _createClass(Validator, [{
    key: 'validator',
    value: function validator(name) {
      return this.container.validator(name);
    }
  }, {
    key: 'addValidations',
    value: function addValidations() {
      var _this = this;

      var validations = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

      if ((0, _isUsableObject2['default'])(validations)) {
        validations = (0, _lodash.toPlainObject)(validations);
        validations = Object.keys(validations).map(function (k) {
          return { key: k, validation: validations[k] };
        });
      }

      validations.forEach(function (_ref) {
        var key = _ref.key;
        var validation = _ref.validation;

        _this.validations.set(key, validation);
      });

      return this;
    }
  }, {
    key: 'addValidation',
    value: function addValidation(_ref2) {
      var key = _ref2.key;
      var validation = _ref2.validation;

      this.validations.set(key, validation);
      return this;
    }
  }, {
    key: 'merge',
    value: function merge(validator) {
      var _this2 = this;

      Array.from(validator.validation.keys()).forEach(function (k) {
        _this2.validations.set(k, validator.validations.get(k));
      });

      return this;
    }
  }, {
    key: 'findErrors',
    value: function findErrors() {
      var _this3 = this;

      var input = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var keys = Array.from(this.validations.keys());

      return Promise.all(keys.map(function (k) {
        return _this3.validations.get(k).bind(_this3)(input[k], input, k);
      })).then(function (errorMessages) {
        return errorMessages.filter(function (msg) {
          return (0, _lodash.isArray)(msg) ? msg.length > 0 : !!msg;
        });
      }).then(function (errorMessages) {
        if (errorMessages.length === 0) {
          return null;
        } else {
          return errorMessages.reduce(function (errors, msg, index) {
            return (0, _lodash.assign)(_defineProperty({}, keys[index], (0, _lodash.isArray)(msg) ? msg : (0, _isUsableObject2['default'])(msg) ? (0, _lodash.toPlainObject)(msg) : [msg]));
          }, {});
        }
      });
    }
  }]);

  return Validator;
})();

exports['default'] = Validator;
module.exports = exports['default'];
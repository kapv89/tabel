'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = isUsableObject;

var _lodash = require('lodash');

function isUsableObject(val) {
  return (0, _lodash.isObject)(val) && !((0, _lodash.isArray)(val) || (0, _lodash.isFunction)(val) || (0, _lodash.isRegExp)(val) || (0, _lodash.isNumber)(val) || (0, _lodash.isString)(val) || (0, _lodash.isElement)(val) || (0, _lodash.isDate)(val));
}

module.exports = exports['default'];
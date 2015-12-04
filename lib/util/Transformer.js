/**
 * Promise based transformation of data from one form to another
 *
 * Usage:
 *
 * orm.util.defineTransformer(
 *   'posts.list',
 *   {
 *     ['filters'](filters, input) {
 *       return this.transformer('posts.filters').run(filters);
 *     },
 *     ['sortings'](sortings, input) {
 *       return this.transformer('posts.sortings').run(sortings);
 *     },
 *     ['eagerLoads'](eagerLoads, input) {
 *       return this.transformer(posts.eagerLoads').run(eagerLoads);
 *     }
 *   }
 * );
 *
 * orm.util.defineTransformer(
 *   'posts.filters',
 *   {
 *     ['tag.ids'](ids, input) {
 *       if (! isArray(ids)) {
 *         return Promise.resolve([]);
 *       } else {
 *         return orm.tbl('tags').whereIn('id', ids).all()
 *           .then((tags) => tags.id);
 *       }
 *     }
 *   }
 * );
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _lodash = require('lodash');

var Transformer = (function () {
  function Transformer(container) {
    var transformations = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

    _classCallCheck(this, Transformer);

    this.container = container;
    this.transformations = new Map();

    this.addTransformations(transformations);
  }

  _createClass(Transformer, [{
    key: 'transformer',
    value: function transformer(name) {
      return this.container.transformer(name);
    }
  }, {
    key: 'addTransformations',
    value: function addTransformations() {
      var _this = this;

      var transformations = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

      if ((0, _lodash.isPlainObject)(transformations)) {
        transformations = Object.keys(transformations).map(function (k) {
          return { key: k, transformation: transformations[k] };
        });
      }

      transformations.forEach(function (_ref) {
        var key = _ref.key;
        var transformation = _ref.transformation;

        _this.transformations.set(key, transformation);
      });

      return this;
    }
  }, {
    key: 'addTransformation',
    value: function addTransformation(_ref2) {
      var key = _ref2.key;
      var transformation = _ref2.transformation;

      this.transformations.set(key, transformation);
      return this;
    }
  }, {
    key: 'run',
    value: function run() {
      var _this2 = this;

      var input = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var keys = Object.keys(input).filter(function (key) {
        return _this2.transformations.has(key);
      });

      return Promise.all(keys.map(function (key) {
        return _this2.transformations.get(key).bind(_this2)(input[key], input, key);
      })).then(function (outValues) {
        return outValues.reduce(function (output, value, index) {
          return (0, _lodash.assign)(output, _defineProperty({}, keys[index], value));
        }, {});
      });
    }
  }]);

  return Transformer;
})();

exports['default'] = Transformer;
module.exports = exports['default'];
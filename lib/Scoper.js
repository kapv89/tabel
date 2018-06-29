'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Usage:
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * 'eagerLoader'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * new Scoper([
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *   {key: 'posts', scope(t) { t.eagerLoad(['posts']); }}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *   {key: 'posts.tags', scope(t) { t.eagerLoad['posts.tags']; }}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *   {key: 'posts.comments', scope(t) { t.eagerLoad['posts.comments']; }}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *   {key: 'posts.tags.posts', scope(t) { t.eagerLoad['posts.tags.posts']; }}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * ]);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * 'filterer'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * new Scoper([
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *   {key: 'posts.ids', scope(t, ids=[]) {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *     if (ids.length > 0) {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *       t.posts().join(t).whereIn('posts.id', ids);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *     }
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *   }},
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *   {key: 'name', scope(t, val) { t.where('name', like, val); }}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *   {key: 'posts.count.gte', scope(t, val) {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *     val = parseInt(val, 10);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *     if (isFinite(val)) {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *       t.posts().join(t).groupBy(t.keyCol()).having(t.raw('count(posts.id)'), '>=', val)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *     }
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *   }}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * ]);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

var _lodash = require('lodash');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Scoper = function () {
  function Scoper() {
    var scopes = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

    _classCallCheck(this, Scoper);

    this.scopes = new Map();

    this.addScopes(scopes);
  }

  _createClass(Scoper, [{
    key: 'addScopes',
    value: function addScopes() {
      var _this = this;

      var scopes = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

      if ((0, _lodash.isObject)(scopes) && !(0, _lodash.isArray)(scopes)) {
        scopes = Object.keys(scopes).map(function (k) {
          return { key: k, scope: scopes[k] };
        });
      }

      scopes.forEach(function (_ref) {
        var key = _ref.key,
            scope = _ref.scope;

        _this.scopes.set(key, scope);
      });

      return this;
    }
  }, {
    key: 'addScope',
    value: function addScope(_ref2) {
      var key = _ref2.key,
          scope = _ref2.scope;

      return this.addScopes([{ key: key, scope: scope }]);
    }
  }, {
    key: 'merge',
    value: function merge(scoper) {
      var _this2 = this;

      Array.from(scoper.scopes.keys()).forEach(function (k) {
        _this2.scopes.set(k, scoper.scopes.get(k));
      });

      return this;
    }
  }, {
    key: 'apply',
    value: function apply(table, params) {
      var _this3 = this;

      var actionableParams = this.actionableParams(params);

      return actionableParams.filter(function (_ref3) {
        var key = _ref3.key;
        return _this3.scopes.has(key);
      }).reduce(function (t, _ref4) {
        var key = _ref4.key,
            val = _ref4.val;

        var scope = _this3.scopes.get(key);
        if (scope instanceof Scoper) {
          scope.run(t, val, key);
        } else {
          scope.bind(_this3)(t, val, key);
        }
        return t;
      }, table);
    }
  }, {
    key: 'actionableParams',
    value: function actionableParams() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      if ((0, _lodash.isArray)(params)) {
        return params.reduce(function (actionableParams, param) {
          return actionableParams.concat([{
            key: param, val: null
          }]);
        }, []);
      } else if ((0, _lodash.isObject)(params)) {
        return Object.keys(params).reduce(function (actionableParams, param) {
          return actionableParams.concat([{
            key: param, val: params[param]
          }]);
        }, []);
      } else {
        throw new Error('invalid params');
      }
    }
  }]);

  return Scoper;
}();

module.exports = Scoper;
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('lodash');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Track = (function () {
  function Track(scopes) {
    _classCallCheck(this, Track);

    if (!(0, _lodash.isArray)(scopes)) {
      scopes = [];
    }
  }

  _createClass(Track, [{
    key: 'apply',
    value: function apply(q) {
      return this.scopes.reduce(function (q, scope) {
        return scope.apply(q);
      }, q);
    }
  }, {
    key: 'hasJoint',
    value: function hasJoint(label) {
      var i = this.scopes.map(function (scope) {
        return scope.label;
      }).indexOf(label);
      return i > -1 && this.scopes[i].isJoint;
    }
  }, {
    key: 'push',
    value: function push(scope) {
      if (scope.isJoint && this.hasJoint(scope.label)) {
        return this;
      } else {
        this.scopes.push(scope);
        return this;
      }
    }
  }, {
    key: 'rewind',
    value: function rewind() {
      this.scopes.pop();
      return this;
    }
  }, {
    key: 'merge',
    value: function merge(track) {
      var _this = this;

      track.scopes.forEach(function (scope) {
        _this.scopes.push(scope);
      });

      return this;
    }
  }, {
    key: 'relabelLastScope',
    value: function relabelLastScope(name) {
      if (this.scopes.length === 0) {
        return this;
      }

      this.scopes.slice(-1)[0].label = name;
      return this;
    }
  }, {
    key: 'convertLastScopeToJoint',
    value: function convertLastScopeToJoint() {
      if (this.scopes.length === 0) {
        return this;
      }

      this.scopes.slice(-1)(0).isJoint = true;
      return this;
    }
  }]);

  return Track;
})();

exports.default = Track;
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Scope = function () {
  function Scope(closure, label) {
    var isJoint = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

    _classCallCheck(this, Scope);

    this.closure = closure;
    this.label = label;
    this.isJoint = !!isJoint;
  }

  _createClass(Scope, [{
    key: "apply",
    value: function apply(q) {
      this.closure(q);
      return q;
    }
  }]);

  return Scope;
}();

module.exports = Scope;
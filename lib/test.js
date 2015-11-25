'use strict';

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _lodash = require('lodash');

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Foo = (function () {
  function Foo() {
    _classCallCheck(this, Foo);
  }

  _createClass(Foo, [{
    key: 'bar',
    value: function bar() {
      return 'bar';
    }
  }, {
    key: 'fizz',
    value: function fizz() {
      return 'fizz';
    }
  }]);

  return Foo;
})();

Foo.prototype.testVar = 'test';

var Bar = (function (_Foo) {
  _inherits(Bar, _Foo);

  function Bar() {
    _classCallCheck(this, Bar);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Bar).apply(this, arguments));
  }

  _createClass(Bar, [{
    key: 'fizz',
    value: function fizz() {
      return _get(Object.getPrototypeOf(Bar.prototype), 'fizz', this).call(this) + '.extended';
    }
  }], [{
    key: 'extend',
    value: function extend(props) {
      (0, _lodash.assign)(Bar.prototype, props);
    }
  }]);

  return Bar;
})(Foo);

Bar.extend({
  baz: function baz() {
    return 'baz.' + this.bar();
  }
});

Bar.extendMethod = function (method, fn) {
  Bar.prototype[method] = fn.bind(Bar.prototype);
};

Bar.extendMethod('baz', function () {
  return this.fizz() + '.something';
});

console.log(new Bar().baz(), new Foo().baz, new Bar().fizz(), new Bar().testVar, new Bar().baz());

var m = new Map();
m.set('foo', 1);
m.set('bar', 2);
m.set('baz', 3);
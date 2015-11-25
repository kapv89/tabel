import {assign} from 'lodash';

class Foo {
  bar() {
    return 'bar';
  }

  fizz() {
    return 'fizz';
  }
}

Foo.prototype.testVar = 'test';

class Bar extends Foo {
  fizz() {
    return `${super.fizz()}.extended`;
  }

  static extend(props) {
    assign(Bar.prototype, props);
  }
}

Bar.extend({
  baz() {
    return `baz.${this.bar()}`;
  }
});

Bar.extendMethod = (method, fn) => {
  Bar.prototype[method] = fn.bind(Bar.prototype);
};

Bar.extendMethod('baz', function () {
  return `${this.fizz()}.something`;
});

console.log(
  new Bar().baz(),
  new Foo().baz,
  new Bar().fizz(),
  new Bar().testVar,
  new Bar().baz()
);

const m = new Map();
m.set('foo', 1);
m.set('bar', 2);
m.set('baz', 3);

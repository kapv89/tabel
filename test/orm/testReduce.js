const {isString} = require('lodash');

function testReduce(assert, orm) {
  console.log('testing reduce');

  const {table} = orm.exports;

  return table('posts').reduce((str, p) => {
    return `${p.title}-${str}`;
  }, '').then((str) => {
    console.log(str);
    assert.ok(isString(str));
  });
}

module.exports = testReduce;

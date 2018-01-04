const {isString} = require('lodash');

function testMap(assert, orm) {
  console.log('testing map');

  const {table} = orm.exports;

  return table('posts').map((p) => p.title).all().then((titles) => {
    console.log(titles);
    assert.ok(titles.reduce((areValid, t) => areValid && isString(t), true));
  });
}

module.exports = testMap;

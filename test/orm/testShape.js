module.exports = async (assert, orm) => {
  console.log('testing shape');

  const {shape} = orm.exports;

  const validData = {
    x: 1,
    y: 2
  };

  const dataWithExtraKey = {
    x: 1,
    y: 2,
    z: 3
  };

  const invalidData = {
    x: 1,
    y: 1
  };

  const validation = shape({
    x: (x) => x === 1 ? null : 'invalid',
    y: (y) => new Promise((resolve) => {
      setTimeout(() => resolve(2), 300);
    }).then((val) => y === val ? null : 'invalid')
  });

  console.log('testing valid data');
  const noErr = await validation.errors(validData);
  assert.ok(noErr === null);

  console.log('testing data with extra key');
  const extraKeyErr = await validation.errors(dataWithExtraKey);
  assert.ok(extraKeyErr.x === null);
  assert.ok(extraKeyErr.y === null);
  assert.ok(extraKeyErr.z === 'invalid key');

  console.log('testing invalid data');
  const invalidDataErr = await validation.errors(invalidData);
  assert.ok(invalidDataErr.x === null);
  assert.ok(invalidDataErr.y === 'invalid');
};

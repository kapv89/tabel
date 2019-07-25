const run = async (assert, client) => {
  console.log('testing hash');

  const testHash = client.hash('test');

  await testHash.set('foo', 'bar');
  await testHash.set('fizz', {x: 1});

  assert.deepEqual(await testHash.get('foo'), 'bar');
  assert.deepEqual((await testHash.get('fizz')).x, 1);

  await testHash.del(['foo', 'fizz']);

  await testHash.set('foo', 'bar', 500);

  assert.deepEqual(await testHash.has('foo'), true);

  await new Promise((resolve) => setTimeout(async () => {
    assert.deepEqual(await testHash.has('foo'), false);
    resolve();
  }, 1000));
};

module.exports = run;

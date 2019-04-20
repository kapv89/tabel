module.exports = async (assert, client) => {
  console.log('testing client');

  await (async () => {
    console.log('testing get');

    const val = await client.get('o');
    const count = await client.get('count', 0);

    assert.deepEqual(val, null);
    assert.deepEqual(count, 0);
  })();

  await (async () => {
    console.log('testing set with lifetime');

    const o = {x: 1, y: 2};

    await client.set('o', o, 500);
    const retrievedO = await client.get('o');

    assert.deepEqual(o.x, retrievedO.x, 'correct prop x');
    assert.deepEqual(o.y, retrievedO.y, 'correct prop y');

    await new Promise((resolve) => setTimeout(async () => {
      const retrievedO = await client.get('o');
      assert.deepEqual(retrievedO, null);
      resolve();
    }, 1000));
  })();

  await (async () => {
    console.log('testing exists');

    assert.deepEqual(await client.exists('foo'), false);

    await client.set('foo', 'bar', 500);
    assert.deepEqual(await client.exists('foo'), true);

    await new Promise((resolve) => setTimeout(async () => {
      assert.deepEqual(await client.exists('foo'), false);
      resolve();
    }, 1000));
  })();

  await (async () => {
    console.log('testing set without lifetime, and get');

    await client.set('foo', 'bar');
    assert.deepEqual(await client.get('foo'), 'bar');
    await client.del('foo');
    assert.deepEqual(await client.exists('foo'), false);
  })();

  await (async () => {
    console.log('testing clear');

    await Promise.all(['foo', 'bar', 'baz'].map((str) => client.set(str, str)));

    assert.deepEqual(await client.get('foo'), 'foo');
    assert.deepEqual(await client.get('bar'), 'bar');
    assert.deepEqual(await client.get('baz'), 'baz');

    await client.clear();

    assert.deepEqual(await client.exists('foo'), false);
    assert.deepEqual(await client.exists('bar'), false);
    assert.deepEqual(await client.exists('baz'), false);
  })();

  await (async () => {
    console.log('testing clear with prefix');

    await Promise.all(['foo.fizz', 'foo.buzz', 'baz'].map((str) => client.set(str, str)));

    assert.deepEqual(await client.get('foo.fizz'), 'foo.fizz');
    assert.deepEqual(await client.get('foo.buzz'), 'foo.buzz');
    assert.deepEqual(await client.get('baz'), 'baz');

    await client.clear('foo');

    assert.deepEqual(await client.exists('foo.fizz'), false);
    assert.deepEqual(await client.exists('foo.buzz'), false);
    assert.deepEqual(await client.exists('baz'), true);

    await client.del('baz');
  })();

  await (async () => {
    console.log('testing nq & dq');

    await client.nq('q', {x: 1});
    await client.nq('q', [{x: 2}, {x: 3}]);

    const o1 = await client.dq('q');
    assert.deepEqual(o1.x, 1);

    const o2 = await client.dq('q');
    assert.deepEqual(o2.x, 2);

    const o3 = await client.dq('q');
    assert.deepEqual(o3.x, 3);

    const o4 = await client.dq();
    assert.deepEqual(o4, null);
  })();
};

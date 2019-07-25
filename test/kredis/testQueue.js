const run = async (assert, client) => {
  console.log('testing queue');

  const q = client.queue('q');

  await q.nq({x: 1}, {x: 2});
  await q.nq([{x: 3}, {x: 4}]);

  const items = await q.range();

  items.forEach(({x}) => assert.ok([1, 2, 3, 4].indexOf(x) > -1));

  assert.deepEqual((await q.dq()).x, 1);
  assert.deepEqual((await q.dq()).x, 2);
  assert.deepEqual((await q.dq()).x, 3);
  assert.deepEqual((await q.dq()).x, 4);
  assert.deepEqual(await q.dq(), null);
};

module.exports = run;

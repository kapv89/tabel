export default async function testScopesAndJoints(assert, orm) {
  const {table} = orm.exports;

  console.log('test scopes');
  await (async () => {
    const comments = await table('comments').all();

    await* comments.map(async ({id}, i) => {
      if (i % 2 === 0) {
        await table('comments').update(id, {is_flagged: true});
      }
    });

    const flaggedComments = await table('comments').whereFlagged().all();
    const unflaggedComments = await table('comments').whereNotFlagged().all();

    assert.deepEqual(comments.filter((_, i) => i % 2 === 0).length, flaggedComments.length);

    comments.filter((_, i) => i % 2 === 0).forEach((comment) => {
      assert.ok(flaggedComments.map(({id}) => id).indexOf(comment.id) > -1);
    });

    comments.filter((_, i) => i % 2 !== 0).forEach((comment) => {
      assert.ok(unflaggedComments.map(({id}) => id).indexOf(comment.id) > -1);
    });
  })();

  console.log('test joints');
}

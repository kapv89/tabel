function testScopesAndJoints(assert, orm) {
  const {table} = orm.exports;

  return (() => {
    console.log('test scopes');
    return Promise.resolve();
  })().then(() => table('comments').all()).then((comments) => Promise.all(comments.map(({id}, i) => {
    return i % 2 === 0 ? table('comments').update(id, {is_flagged: true}) : table('comments').find(id);
  }))).then((comments) => Promise.all([
    comments,
    table('comments').whereFlagged().all(),
    table('comments').whereNotFlagged().all()
  ])).then(([comments, flaggedComments, unflaggedComments]) => {
    assert.deepEqual(comments.filter((_, i) => i % 2 === 0).length, flaggedComments.length);

    comments.filter((_, i) => i % 2 === 0).forEach((comment) => {
      assert.ok(flaggedComments.map(({id}) => id).indexOf(comment.id) > -1);
    });

    comments.filter((_, i) => i % 2 !== 0).forEach((comment) => {
      assert.ok(unflaggedComments.map(({id}) => id).indexOf(comment.id) > -1);
    });
  }).then(() => {
    console.log('test joints');
  });
}

module.exports = testScopesAndJoints;

module.exports = async (assert, orm) => {
  console.log('testing cache story');

  const {table} = orm.exports;

  const commentsTable = table('comments').eagerLoad('post').where('is_flagged', false);

  const comments = await commentsTable.remember(2000).all();

  await table('comments').delete(comments[0].id);

  const cachedComments = await commentsTable.all();

  await commentsTable.forget();
  const actualComments = await commentsTable.all();

  assert.ok(comments.length === cachedComments.length);
  assert.ok(comments.length === actualComments.length+1);

  await table('comments').insert(comments[0]);
};

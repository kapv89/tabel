export default async function testUpdate(assert, orm) {
  console.log('testing update');

  const {table} = orm.exports;

  await (async () => {
    const yesterday = (() => {
      const d = new Date();
      d.setUTCSeconds(d.getUTCSeconds() - 86400);
      return d;
    })();

    const allPosts = await table('posts').all();

    const post = await table('posts').update(
      allPosts[0].id,
      {created_at: yesterday}
    );

    assert.deepEqual(post.id, allPosts[0].id);
  })();
}

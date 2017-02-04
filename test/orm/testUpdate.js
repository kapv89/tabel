function testUpdate(assert, orm) {
  console.log('testing update');

  const {table} = orm.exports;

  return table('posts').all()
    .then((allPosts) => {
      const yesterday = (() => {
        const d = new Date();
        d.setUTCSeconds(d.getUTCSeconds() - 86400);
        return d;
      })();

      return table('posts').update(allPosts[0].id, {created_at: yesterday})
        .then((post) => {
          assert.deepEqual(post.id, allPosts[0].id);
          console.log('update test passed');
        })
      ;
    })
  ;
}


module.exports = testUpdate;

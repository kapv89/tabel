function testUpdate(assert, orm) {
  console.log('testing update');

  const {table} = orm.exports;

  return table('posts').all()
    .then((allPosts) => {
      const post0 = allPosts[0];
      const newTitle = post0.title.slice(0, Math.floor(post0.title.length / 2));

      return table('posts').update(post0.id, {title: newTitle})
        .then((post) => {
          assert.deepEqual(post.id, post0.id);
          assert.deepEqual(post.title, newTitle);
          console.log('update test passed');
        })
      ;
    })
  ;
}


module.exports = testUpdate;

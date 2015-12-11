import {assign} from 'lodash';

export default async function testEagerLoads(assert, orm) {
  const {table} = orm.exports;

  const all = await Promise.all(Array.from(orm.tables.keys()).map((tableName) => (
    table(tableName).all().then((models) => ({tableName, models}))
  ))).then((results) => results.reduce((all, {tableName, models}) => (
    assign(all, {[tableName]: models})
  ), {}));

  console.log('testing one level eagerLoads');
  await (async () => {
    console.log('testing belongsTo, hasMany, morphMany');
    const posts = await table('posts').eagerLoad([
      'author',
      'comments',
      'photos'
    ]).all();

    posts.forEach((post) => {
      assert.deepEqual(post.user_id, post.author.id, 'related author loaded');
      assert.ok(all.users.map(({id}) => id).indexOf(post.author.id) > -1, 'valid author loaded');

      post.comments.forEach((comment) => {
        assert.deepEqual(comment.post_id, post.id, 'related comment loaded');
        assert.ok(all.comments.map(({id}) => id).indexOf(comment.id) > -1, 'valid comment loaded');
      });

      post.photos.forEach((photo) => {
        assert.ok(
          photo.doc_type === 'posts' && photo.doc_id === post.id,
          'related photo loaded'
        );
        assert.ok(all.photos.map(({id}) => id).indexOf(photo.id) > -1, 'valid photo loaded');
      });
    });

    console.log('testing hasManyThrough, belongsToMany, morphOne');
    const users = await table('users').eagerLoad([
      'receivedComments',
      'roles',
      'profilePhoto'
    ]).all();

    users.forEach((user) => {
      user.receivedComments.forEach((comment) => {
        assert.ok(
          comment.through.user_id === user.id && comment.through.id === comment.post_id,
          'related comment loaded'
        );
        assert.ok(all.comments.map(({id}) => id).indexOf(comment.id) > -1, 'valid comment loaded');
      });

      user.roles.forEach((role) => {
        assert.ok(
          role.pivot.user_id === user.id && role.pivot.role_id === role.id,
          'related roles loaded'
        );
        assert.ok(all.roles.map(({id}) => id).indexOf(role.id) > -1, 'valid role loaded');
      });

      assert.ok(
        user.profilePhoto.doc_type === 'users' && user.profilePhoto.doc_id === user.id,
        'related photo loaded'
      );
      assert.ok(all.photos.map(({id}) => id).indexOf(user.profilePhoto.id) > -1, 'valid photo loaded');
    });

    console.log('testing morphTo, hasOne');
    const photos = await table('photos').eagerLoad([
      'doc', 'detail'
    ]).all();

    photos.forEach((photo) => {
      assert.ok(
        photo.doc_type === photo.doc.__table && photo.doc_id === photo.doc.id,
        'related doc loaded'
      );

      assert.ok(
        all[photo.doc.__table].map(({id}) => id).indexOf(photo.doc.id) > -1,
        'valid doc loaded'
      );

      assert.ok(
        photo.id === photo.detail.photo_id,
        'related photo_detail loaded'
      );
      assert.ok(
        all.photo_details.map(({photo_id}) => photo_id).indexOf(photo.detail.photo_id) > -1,
        'valid photo_detail loaded'
      );
    });
  })();

  console.log('testing one level eagerLoads with constraints');
  await (async () => {
    await table('posts').whereKey(all.posts.slice(0, 2).map(({id}) => id))
      .update({published_on: new Date()})
    ;

    console.log('testing hasMany');
    const users = await table('users').eagerLoad([
      {['posts'](t) { t.whereNotNull('published_on'); }}
    ]).all();

    users.forEach((user) => {
      user.posts.forEach((post) => {
        assert.ok(
          post.published_on instanceof Date,
          'valid post eagerLoaded'
        );
      });
    });

    await table('posts').whereKey(all.posts.slice(0, 2).map(({id}) => id))
      .update({published_on: null})
    ;
    console.log('we will be lazy and not test any more of this, and just move on to nested eagerLoads');
  })();

  console.log('testing nested eagerLoads');
  await (async () => {
    const users = await table('users').eagerLoad([
      'posts.comments.user',
      'profilePhoto'
    ]).all();

    users.forEach((user) => {
      assert.ok(user.profilePhoto.__table === 'photos', 'correct profile photo loaded');
      user.posts.forEach((post) => {
        assert.ok(post.__table === 'posts', 'correct post loaded');
        post.comments.forEach((comment) => {
          assert.ok(comment.__table === 'comments', 'correct comment loaded');
          assert.ok(comment.user.__table === 'users', 'correct comment-user loaded');
        });
      });
    });
  })();

  console.log('we will again be lazy and not test constrained nested eagerLoads');
}

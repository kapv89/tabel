const {assign, isArray} = require('lodash');

function testEagerLoads(assert, orm) {
  const {table} = orm.exports;

  return Promise.all(Array.from(orm.tables.keys()).map((tableName) => (
    table(tableName).all().then((models) => ({tableName, models}))
  ))).then((results) => results.reduce((all, {tableName, models}) => (
    assign(all, {[tableName]: models})
  ), {})).then((all) => {
    return (() => {
      console.log('testing belongsTo, hasMany, morphMany eagerload');

      return table('posts').eagerLoad('author', 'comments', 'photos').all()
        .then((posts) => posts.forEach((post) => {
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
        }))
      ;
    })().then(() => {
      console.log('testing hasManyThrough, manyToMany, morphOne eagerload');

      return table('users').eagerLoad('receivedComments', 'roles', 'profilePhoto').all().then((users) => {
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
      });
    }).then(() => {
      console.log('testing morphTo, hasOne eagerload');

      return table('photos').eagerLoad('doc', 'detail').all().then((photos) => photos.forEach((photo) => {
        assert.ok(
          photo.doc_id === photo.doc.id,
          'related doc loaded'
        );

        assert.ok(
          all[photo.doc_type].map(({id}) => id).indexOf(photo.doc.id) > -1,
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
      }));
    }).then(() => {
      console.log('testing one level eagerLoads with constraints');
    }).then(() => {
      console.log('testing hasMany');

      return table('posts').whereKey(all.posts.slice(0, 2).map(({id}) => id)).update({published_on: new Date()})
        .then(() => table('users').eagerLoad({posts(t) { t.whereNotNull('published_on'); }}).all())
        .then((users) => users.forEach((user) => {
          user.posts.forEach((post) => {
            assert.ok(
              post.published_on instanceof Date,
              'valid post eagerLoaded'
            );
          });
        }))
        .then(() => table('posts').whereKey(all.posts.slice(0, 2).map(({id}) => id)).update({published_on: null}))
      ;
    }).then(() => {
      console.log('testing belongsTo');

      return table('posts').eagerLoad({author: (t) => t.where('id', 'in', all.users.slice(0, 2).map(({id}) => id))}).all()
        .then((posts) => posts.forEach((post) => {
          assert.ok(
            post.author === null ||
            all.users.slice(0, 2).map(({id}) => id).indexOf(post.author.id) > -1
          );
        }))
      ;
    }).then(() => {
      console.log('testing hasOne');

      return table('photos').eagerLoad(
        {detail: (t) => t.where('photo_id', 'in', all.photo_details.slice(0, 2).map(({photo_id}) => photo_id))}
      ).all().then((photos) => photos.forEach((photo) => {
        assert.ok(
          photo.detail === null ||
          all.photo_details.slice(0, 2).map(({photo_id}) => photo_id).indexOf(photo.detail.photo_id) > -1
        );
      }));
    }).then(() => {
      console.log('testing hasManyThrough');

      return table('posts').whereKey(all.posts.slice(0, 2).map(({id}) => id)).update({published_on: new Date()})
        .then(() => table('users').eagerLoad({receivedComments: (t) => t.whereNotNull('posts.published_on')}).all())
        .then((users) => users.forEach((user) => {
          assert.ok(isArray(user.receivedComments), 'receivedComments should be an array');
          user.receivedComments.forEach((comment) => {
            assert.ok(all.posts.map(({id}) => id).indexOf(comment.through.id) > -1);
          });
        }))
        .then(() => table('posts').whereKey(all.posts.slice(0, 2).map(({id}) => id)).update({published_on: null}))
      ;
    }).then(() => {
      console.log('testing manyToMany');

      return table('users').eagerLoad({roles: (t) => t.where('id', 'in', all.roles.slice(0, 2).map(({id}) => id))}).all()
        .then((users) => users.forEach((user) => {
          assert.ok(isArray(user.roles), 'roles are an array');
          user.roles.forEach((role) => {
            assert.ok(all.roles.slice(0, 2).map(({id}) => id).indexOf(role.id) > -1);
          });
        }))
      ;
    }).then(() => {
      console.log('testing morphMany');

      return table('posts').eagerLoad(
        {photos: (t) => t.where('id', 'in', all.photos.filter(({doc_type}) => doc_type === 'posts').slice(0, 2).map(({id}) => id))}
      ).all().then((posts) => posts.forEach((post) => {
        assert.ok(isArray(post.photos), 'photos are an array');
        post.photos.forEach((photo) => {
          assert.ok(
            all.photos.filter(({doc_type}) => doc_type === 'posts')
              .slice(0, 2).map(({id}) => id).indexOf(photo.id) > -1
          );
        });
      }));
    }).then(() => {
      console.log('testing morphOne');

      return table('users').eagerLoad(
        {profilePhoto: (t) => t.where('id', 'in', all.photos.filter(({doc_type}) => doc_type === 'users').slice(0, 2).map(({id}) => id))}
      ).all().then((users) => users.forEach((user) => {
        assert.ok(
          user.profilePhoto === null ||
          all.photos.filter(({doc_type}) => doc_type === 'users')
            .slice(0, 2).map(({id}) => id).indexOf(user.profilePhoto.id) > -1
        );
      }));
    }).then(() => {
      console.log('testing nested eagerLoads');
    }).then(() => {
      return table('users').eagerLoad('posts.comments.user', 'profilePhoto').all()
        .then((users) => users.forEach((user) => {
          assert.ok(user.profilePhoto, 'correct profile photo loaded');
          user.posts.forEach((post) => {
            assert.ok(post, 'correct post loaded');
            post.comments.forEach((comment) => {
              assert.ok(comment, 'correct comment loaded');
              assert.ok(comment.user, 'correct comment-user loaded');
            });
          });
        }))
      ;
    }).then(() => {
      return table('posts').eagerLoad(
        {'comments.user': (t) => t.where('id', 'in', all.users.slice(0, 2).map(({id}) => id))},
        'photos'
      ).all().then((posts) => posts.forEach((post) => {
        post.comments.forEach((comment) => {
          assert.ok(comment);
          assert.ok(
            comment.user === null ||
            all.users.slice(0, 2).map(({id}) => id).indexOf(comment.user.id) > -1
          );
        });
      }));
    });
  }).then(() => console.log('we will be lazy and not test constrained nested eagerLoads anymore'));
}

module.exports = testEagerLoads;

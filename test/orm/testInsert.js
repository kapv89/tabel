const {isString, range} = require('lodash');
const faker = require('faker');

function testInsert(assert, orm) {
  const knex = orm.knex;

  return (() => {
    console.log('testing insert one');
    return Promise.resolve();
  })().then(() => {
    return orm.tbl('users').insert({
      username: faker.internet.userName(),
      password: orm.tbl('users').hashPassword(faker.internet.password())
    }).then((user) => knex('users').where('id', user.id).first().then((knexUser) => ({user, knexUser})))
      .then(({user, knexUser}) => {
        assert.ok(user.hasOwnProperty('id'), 'insertion appends id automatically in tables with autoId true');
        assert.deepEqual(knexUser.id, user.id, 'the inserted record exists in db');
        assert.deepEqual(knexUser.username, user.username, 'with same fields');
        assert.deepEqual(knexUser.password, user.password, '...checking another field');
        assert.ok(user.created_at instanceof Date, 'timestamps work for created_at');
        assert.ok(user.updated_at instanceof Date, 'timestamps work for updated_at');
        assert.ok(isString(user.id));
      })
    ;
  }).then(() => {
    console.log('testing insert many');
    return Promise.resolve();
  }).then(() => {
    return knex('users').first()
      .then((user) => orm.tbl('posts').insert(range(4).map(() => ({
        user_id: user.id,
        title: faker.lorem.sentence(),
        body: faker.lorem.paragraphs(3)
      }))))
      .then((posts) => Promise.all(posts.map((post) => {
        return knex('posts').where('id', post.id).first().then((knexPost) => ({post, knexPost}))
          .then(({post, knexPost}) => {
            assert.ok('id' in post, 'insertion appends id automatically in tables with autoId true');
            assert.deepEqual(knexPost.id, post.id, 'the inserted record exists in db');
            assert.deepEqual(knexPost.title, post.title, 'with same fields');
            assert.deepEqual(knexPost.body, post.body, '...checking another field');
            assert.ok(post.created_at instanceof Date, 'timestamps work for created_at');
            assert.ok(post.updated_at instanceof Date, 'timestamps work for updated_at');
            assert.ok(isString(post.id));
          })
        ;
      }), Promise.resolve({})))
    ;
  }).then(() => {
    console.log('');
    console.log('now we are just going to insert things in order to fill up the db');
    console.log('and hope that shit works');
    console.log('if it doesn\'t, then we follow the stacktrace and fix broken shit');
    console.log('');
  }).then(() => {
    return orm.tbl('roles').insert(range(3).map(() => ({
      name: faker.name.jobTitle()
    }))).then((roles) => knex('users').first().then((user) => ({user, roles}))).then(({user, roles}) => {
      return orm.tbl('user_role').insert(roles.map((role) => ({
        role_id: role.id, user_id: user.id
      }))).then((userRolePivots) => ({user, roles, userRolePivots}));
    }).then(({user, roles, userRolePivots}) => {
      userRolePivots.forEach((pivot) => {
        assert.deepEqual(pivot.user_id, user.id, 'pivot has proper user_id');
        assert.ok(roles.map(({id}) => id).indexOf(pivot.role_id) > -1, 'pivot has proper role_id');
        assert.ok(pivot.created_at instanceof Date, 'pivot timestamps work for created_at');
        assert.ok(pivot.updated_at instanceof Date, 'pivot timestamps work for updated_at');
      });
    }).then(() => Promise.all([knex('users').first(), knex('posts').select('*')])).then(([user, posts]) => {
      return Promise.all(posts.map((post) => {
        return orm.tbl('comments').insert(range(3).map(() => ({
          user_id: user.id,
          post_id: post.id,
          text: faker.lorem.paragraphs(1),
          is_flagged: false
        })));
      }));
    }).then(() => Promise.all([knex('users').first(), knex('posts').select('*')])).then(([user, posts]) => {
      return orm.tbl('photos').insert({
        doc_type: 'users',
        doc_id: user.id,
        url: faker.image.imageUrl()
      }).then((photo) => orm.tbl('photo_details').insert({
        photo_id: photo.id,
        title: faker.name.title(),
        about: faker.lorem.paragraphs(1)
      })).then(() => Promise.all(posts.map((post) => {
        return orm.tbl('photos').insert(range(2).map(() => ({
          doc_type: 'posts',
          doc_id: post.id,
          url: faker.image.imageUrl()
        }))).then((photos) => orm.tbl('photo_details').insert(
          photos.map((photo) => ({
            photo_id: photo.id,
            title: faker.name.title(),
            about: faker.lorem.paragraphs(1)
          })
        )));
      })));
    }).then(() => {
      return orm.tbl('tags').insert(range(4).map(() => ({
        name: faker.name.title()
      }))).then((tags) => {
        return Promise.all([
          knex('posts').select('*'),
          knex('photos').select('*')
        ]).then(([posts, photos]) => ({tags, posts, photos}));
      }).then(({tags, posts, photos}) => {
        return Promise.all(tags.slice(2).map((tag) => {
          return orm.tbl('tagable_tag').insert(posts.map((post) => ({
            tagable_type: 'posts',
            tagable_id: post.id,
            tag_id: tag.id
          })));
        })).then(() => Promise.all(tags.slice(0, 2).map((tag) => {
          return orm.tbl('tagable_tag').insert(photos.map((photo) => ({
            tagable_type: 'photos',
            tagable_id: photo.id,
            tag_id: tag.id
          })));
        })));
      });
    });
  });
}

module.exports = testInsert;

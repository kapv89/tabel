import {isString, range} from 'lodash';
import faker from 'faker';

export default async function testInsert(assert, orm) {
  const knex = orm.knex;

  console.log('testing insert one');
  await (async () => {
    const user = await orm.tbl('users').insert({
      username: faker.internet.userName(),
      password: orm.tbl('users').hashPassword(faker.internet.password())
    });

    const knexUser = await knex('users').where('id', user.id).first();

    assert.ok(user.hasOwnProperty('id'), 'insertion appends id automatically in tables with autoId true');
    assert.deepEqual(knexUser.id, user.id, 'the inserted record exists in db');
    assert.deepEqual(knexUser.username, user.username, 'with same fields');
    assert.deepEqual(knexUser.password, user.password, '...checking another field');
    assert.ok(user.created_at instanceof Date, 'timestamps work for created_at');
    assert.ok(user.updated_at instanceof Date, 'timestamps work for updated_at');
    assert.ok(isString(user.id));
  })();

  console.log('testing insert many');
  await (async () => {
    const user = await knex('users').first();

    const posts = await orm.tbl('posts').insert(range(4).map(() => ({
      user_id: user.id,
      title: faker.lorem.sentence(),
      body: faker.lorem.paragraphs(3)
    })));

    await Promise.all(posts.map(async (post) => {
      const knexPost = await knex('posts').where('id', post.id).first();

      assert.ok('id' in post, 'insertion appends id automatically in tables with autoId true');
      assert.deepEqual(knexPost.id, post.id, 'the inserted record exists in db');
      assert.deepEqual(knexPost.title, post.title, 'with same fields');
      assert.deepEqual(knexPost.body, post.body, '...checking another field');
      assert.ok(post.created_at instanceof Date, 'timestamps work for created_at');
      assert.ok(post.updated_at instanceof Date, 'timestamps work for updated_at');
      assert.ok(isString(post.id));
    }), Promise.resolve({}));

  })();

  console.log('');
  console.log('now we are just going to insert things in order to fill up the db');
  console.log('and hope that shit works');
  console.log('if it doesn\'t, then we follow the stacktrace and fix broken shit');
  console.log('');

  await (async () => {
    const roles = await orm.tbl('roles').insert(range(3).map(() => ({
      name: faker.name.jobTitle()
    })));

    const user = await knex('users').first();

    const userRolePivots = await orm.tbl('user_role').insert(roles.map((role) => ({
      role_id: role.id, user_id: user.id
    })));

    userRolePivots.forEach((pivot) => {
      assert.deepEqual(pivot.user_id, user.id, 'pivot has proper user_id');
      assert.ok(roles.map(({id}) => id).indexOf(pivot.role_id) > -1, 'pivot has proper role_id');
      assert.ok(pivot.created_at instanceof Date, 'pivot timestamps work for created_at');
      assert.ok(pivot.updated_at instanceof Date, 'pivot timestamps work for updated_at');
    });
  })();

  await (async () => {
    const user = await knex('users').first();
    const posts = await knex('posts').select('*');

    await Promise.all(posts.map((post) => {
      return orm.tbl('comments').insert(range(3).map(() => ({
        user_id: user.id,
        post_id: post.id,
        text: faker.lorem.paragraphs(1),
        is_flagged: false
      })));
    }));
  })();

  await (async () => {
    const user = await knex('users').first();
    const posts = await knex('posts').select('*');

    await orm.tbl('photos').insert({
      doc_type: 'users',
      doc_id: user.id,
      url: faker.image.imageUrl()
    }).then((photo) => orm.tbl('photo_details').insert({
      photo_id: photo.id,
      title: faker.name.title(),
      about: faker.lorem.paragraphs(1)
    }));

    await Promise.all(posts.map(async (post) => {
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
    }));
  })();

  await (async () => {
    const tags = await orm.tbl('tags').insert(range(4).map(() => ({
      name: faker.name.title()
    })));

    const posts = await knex('posts').select('*');
    const photos = await knex('photos').select('*');

    await Promise.all(tags.slice(2).map((tag) => {
      return orm.tbl('tagable_tag').insert(posts.map((post) => ({
        tagable_type: 'posts',
        tagable_id: post.id,
        tag_id: tag.id
      })));
    }));

    await Promise.all(tags.slice(0, 2).map((tag) => {
      return orm.tbl('tagable_tag').insert(photos.map((photo) => ({
        tagable_type: 'photos',
        tagable_id: photo.id,
        tag_id: tag.id
      })));
    }));
  })();
}

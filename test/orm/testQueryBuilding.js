/**
 * the strategy we follow is fetch results from a query using Tabel,
 * and then fetch results using knex, and compare these results
 */

import {range} from 'lodash';

export default async function testQueryBuilding(assert, orm) {
  const knex = orm.knex;
  const {table} = orm.exports;
  console.log('testing query-building');

  const [
    allUsers, allPhotos, allPosts,
    allTagableTagPivots, allUserRolePivots
  ] = await Promise.all([
    knex('users').select('*'),
    knex('photos').select('*'),
    knex('posts').select('*'),
    knex('tagable_tag').select('*'),
    knex('user_role').select('*')
  ]);

  await (async () => {
    console.log('testing all');

    const users = await table('users').all();

    assert.deepEqual(users.length, allUsers.length, 'same number of users fetched');

    range(users.length).forEach((i) => {
      ['id', 'username', 'password'].forEach((field) => {
        assert.deepEqual(users[i][field], allUsers[i][field], 'same users fetched');
      });
    });
  })();

  await (async () => {
    console.log('testing first');

    const user = await table('users').first();

    assert.ok(allUsers.map(({id}) => id).indexOf(user.id) > -1, 'same users fetched');
  });

  await (async () => {
    console.log('testing find');

    const user = await table('users').find(allUsers[0].id);

    assert.ok(allUsers.map(({id}) => id).indexOf(user.id) > -1, 'same users fetched');
  });

  await (async () => {
    console.log('testing whereFalse');

    const users = await table('users').whereFalse().all();

    assert.deepEqual(users.length, 0);
  })();

  await (async () => {
    console.log('testing whereKey');

    const photo = await table('photos').whereKey(allPhotos[0].id).first();
    assert.deepEqual(photo.id, allPhotos[0].id, 'correct photo fetched');

    const tagableTagPivot = await table('tagable_tag').whereKey(allTagableTagPivots[0]).first();
    assert.deepEqual(
      tagableTagPivot.tagable_id, allTagableTagPivots[0].tagable_id, 'tagable_id matches'
    );
    assert.deepEqual(
      tagableTagPivot.tagable_type, allTagableTagPivots[0].tagable_type,
      'tagable_type matches'
    );
    assert.deepEqual(
      tagableTagPivot.tag_id, allTagableTagPivots[0].tag_id, 'tag_id matches'
    );

    const posts = await table('posts').whereKey(allPosts.slice(1, 2).map(({id}) => id)).all();
    assert.deepEqual(posts.length, 1, 'correct number of posts fetched');
    allPosts.slice(1, 2).forEach((post) => {
      assert.ok(posts.map(({id}) => id).indexOf(post.id) > -1, 'correct posts fetched');
    });

    const userRolePivots = await table('user_role').whereKey(allUserRolePivots.slice(0, 2)).all();
    allUserRolePivots.slice(0, 2).forEach((pivot) => {
      assert.ok(
        userRolePivots.filter((p) => (p.user_id === pivot.user_id && p.role_id === pivot.role_id))
          .length > 0,
        'correct pivots fetched'
      );
    });
  })();

  await (async () => {
    console.log('test orWhereKey');

    const photos = await table('photos').whereKey(allPhotos[0].id).orWhereKey(allPhotos[1].id).all();

    assert.deepEqual(photos.length, 2, 'correct number of photos fetched');
    allPhotos.slice(0, 2).forEach((photo) => {
      assert.ok(photos.map(({id}) => id).indexOf(photo.id) > -1, 'correct photos fetched');
    });

    const posts = await table('posts').whereKey(allPosts[0].id)
      .orWhereKey(allPosts.slice(1, 3).map(({id}) => id))
      .all()
    ;

    assert.deepEqual(posts.length, 3, 'correct number of posts fetched');
    allPosts.slice(1, 3).forEach((post) => {
      assert.ok(posts.map(({id}) => id).indexOf(post.id) > -1, 'correct posts fetched');
    });

    const userRolePivots = await table('user_role').whereKey(allUserRolePivots[0])
      .orWhereKey(allUserRolePivots.slice(1, 3))
      .all()
    ;

    allUserRolePivots.slice(0, 3).forEach((pivot) => {
      assert.ok(
        userRolePivots.filter((p) => (p.user_id === pivot.user_id && p.role_id === pivot.role_id))
          .length > 0,
        'correct pivots fetched'
      );
    });
  })();

  await (async () => {
    console.log(
      'test where, whereNot, whereIn, whereNotIn, whereBetween, whereNotBetween, whereNull, whereNotNull'
    );
    console.log('to test these, we just compare the sql queries');

    const now = new Date();
    const yesterday = (() => {
      const d = new Date();
      d.setUTCSeconds(d.getUTCSeconds() - 86400);
      return d;
    })();

    assert.deepEqual(
      table('photos').where('id', allPhotos[0].id).query().toString(),
      knex('photos').select('photos.*').where('photos.id', allPhotos[0].id).toString(),
      'where handles 2 args properly'
    );

    assert.deepEqual(
      table('photos').whereNot('id', allPhotos[0].id).query().toString(),
      knex('photos').select('photos.*').whereNot('photos.id', allPhotos[0].id).toString(),
      'where handles 2 args properly'
    );

    assert.deepEqual(
      table('photos').where('created_at', '<', now).query().toString(),
      knex('photos').select('photos.*').where('photos.created_at', '<', now).toString(),
      'where handles (field, op, val) args properly'
    );

    assert.deepEqual(
      table('photos').where('id', 'in', allPhotos.map(({id}) => id)).query().toString(),
      knex('photos').select('photos.*').where('photos.id', 'in', allPhotos.map(({id}) => id)).toString(),
      'where handles `in` operator properly'
    );

    assert.deepEqual(
      table('photos').where(['doc_type', 'doc_id'], 'in', [{doc_type: 'users', doc_id: allUsers[0].id}])
        .query().toString(),
      knex('photos').select('photos.*').whereRaw(
        `(${['photos.doc_type', 'photos.doc_id']}) in ((?,?))`,
        ['users', allUsers[0].id]
      ).toString(),
      'where handles `in` for multiple columns well'
    );

    assert.deepEqual(
      table('photos').where('id', 'not in', allPhotos.map(({id}) => id)).query().toString(),
      knex('photos').select('photos.*').where('photos.id', 'not in', allPhotos.map(({id}) => id)).toString(),
      'where handles `not in` operator properly'
    );

    assert.deepEqual(
      table('photos').where(['doc_type', 'doc_id'], 'not in', [{doc_type: 'users', doc_id: allUsers[0].id}])
        .query().toString(),
      knex('photos').select('photos.*').whereRaw(
        `(${['photos.doc_type', 'photos.doc_id']}) not in ((?,?))`,
        ['users', allUsers[0].id]
      ).toString(),
      'where handles `not in` for multiple columns well'
    );

    assert.deepEqual(
      table('photos').where('created_at', 'between', [yesterday, now]).query().toString(),
      knex('photos').select('photos.*').where('photos.created_at', 'between', [yesterday, now]).toString(),
      'where handles `between` operator properly'
    );

    assert.deepEqual(
      table('photos').where('created_at', 'not between', [yesterday, now]).query().toString(),
      knex('photos').select('photos.*').where('photos.created_at', 'not between', [yesterday, now]).toString(),
      'where handles `not between` operator properly'
    );
  })();

  await (async () => {
    console.log('test offset, limit, orderBy, orderByRaw, groupBy, groupByRaw, havingRaw');

    assert.deepEqual(
      table('photos').offset(2).query().toString(),
      knex('photos').select('photos.*').offset(2).toString(),
      'offset works'
    );

    assert.deepEqual(
      table('photos').offset(2).limit(1).query().toString(),
      knex('photos').select('photos.*').offset(2).limit(1).toString(),
      'limit works'
    );

    assert.deepEqual(
      table('photos').orderBy('created_at').query().toString(),
      knex('photos').select('photos.*').orderBy('photos.created_at').toString(),
      'orderBy works'
    );

    assert.deepEqual(
      table('photos').groupBy('doc_type').query().toString(),
      knex('photos').select('photos.*').groupBy('photos.doc_type').toString(),
      'groupBy works'
    );

    assert.deepEqual(
      table('photos').orderByRaw('?', ['created_at']).query().toString(),
      knex('photos').select('photos.*').orderByRaw('?', ['created_at']).toString(),
      'orderByRaw works'
    );

    assert.deepEqual(
      table('photos').groupByRaw('?', ['doc_type']).query().toString(),
      knex('photos').select('photos.*').groupByRaw('?', ['doc_type']).toString(),
      'groupByRaw works'
    );

    assert.deepEqual(
      table('photos').groupBy('doc_type').havingRaw('count(photos.id) > ?', [1]).query().toString(),
      knex('photos').select('photos.*').groupBy('photos.doc_type')
        .havingRaw('count(photos.id) > ?', [1]).toString(),
      'havingRaw works'
    );
  })();

  await (async () => {
    console.log('test select and forPage');

    assert.deepEqual(
      table('photos').select(['id', 'url', 'foo.bar']).query().toString(),
      knex('photos').select(['photos.id', 'photos.url', 'foo.bar']).toString(),
      'select works as expected'
    );

    assert.deepEqual(
      table('photos').forPage(2, 5).query().toString(),
      knex('photos').select('photos.*').limit(5).offset(5).toString(),
      'forPage works with supplied batchSize'
    );

    assert.deepEqual(
      table('photos').forPage(2).query().toString(),
      knex('photos').select('photos.*')
        .limit(table('photos').props.perPage)
        .offset(table('photos').props.perPage * (2-1))
        .toString()
    );
  })();

  await (async () => {
    console.log('testing count');

    assert.deepEqual(
      await table('photos').count(),
      await knex.count('*').from((q) => {
        q.from('photos').select('photos.*').distinct().as('t1');
      }).then((result) => parseInt(result[0].count, 10)),
      'count works and creates a subquery'
    );
  })();

}

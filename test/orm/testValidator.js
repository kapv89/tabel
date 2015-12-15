import faker from 'faker';
import {isString} from 'lodash';

export default async function testValidator(assert, orm) {
  const {isUsableObject, table} = orm.exports;

  console.log('testing validator');

  const postValidator = orm.util.newValidator({
    ['post'](post) {
      if (! isUsableObject(post)) {
        return 'invalid post';
      } else {
        return orm.util.newValidator({
          async ['user_id'](userId) {
            const user = await table('users').find(userId);
            return user ? null : 'invalid user_id';
          },
          async ['title'](title, {id}) {
            if (! isString(title)) {
              return 'invalid title';
            }

            const existing = await table('posts').find({title});
            return existing && existing.id === id ? null : 'another post exists with this title';
          },
          ['body'](body) {
            return isString(body) ? null : 'invalid body';
          }
        });
      }
    }
  });

  await (async () => {
    console.log('testing validator with existing post data');

    const post = await table('posts').first();

    await (async () => {
      const errors = await postValidator.findErrors({});
      assert.ok(isUsableObject(errors));
      assert.ok('post' in errors);
    })();

    await (async () => {
      const errors = await postValidator.findErrors({
        post: {
          title: post.title
        }
      });

      assert.ok(isUsableObject(errors));
      assert.ok('post' in errors && isUsableObject(errors.post));
      assert.ok('body' in errors.post);
      assert.ok('user_id' in errors.post);
      assert.ok('title' in errors.post);
    })();
  })();
}

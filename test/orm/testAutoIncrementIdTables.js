const {isArray} = require('lodash');

module.exports = async (assert, orm) => {
  const {ok, deepEqual} = assert;
  const {table} = orm.exports;

  orm.defineTable({
    name: 'products',

    props: {
      increments: true,
      timestamps: true
    },

    relations: {
      category() {
        return this.belongsTo('categories', 'category_id');
      },

      sellers() {
        return this.manyToMany('sellers', 'product_seller', 'product_id', 'seller_id');
      }
    }
  });

  orm.defineTable({
    name: 'categories',

    props: {
      increments: true,
      timestamps: true
    },

    relations: {
      products() {
        return this.hasMany('products', 'category_id');
      }
    }
  });

  orm.defineTable({
    name: 'sellers',

    props: {
      increments: true,
      timestamps: true
    },

    relations: {
      products() {
        return this.manyToMany('products', 'product_seller', 'seller_id', 'product_id');
      }
    }
  });

  orm.defineTable({
    name: 'product_seller'
  });

  console.log('testing insert in autoincrement table');

  const c1 = await table('categories').insert({name: 'c foo'});
  const c2 = await table('categories').insert({name: 'c bar'});

  deepEqual(c1.id, 1, 'auto insert id 1');
  deepEqual(c2.id, 2, 'auto insert id 2');

  const [p1, p2, p3] = await table('products').insert([
    {name: 'p foo', category_id: c1.id},
    {name: 'p bar', category_id: c1.id},
    {name: 'p baz', category_id: c2.id}
  ]);

  console.log('testing hasMany eagerloads with autoincrement');
  const c1WithProducts = await table('categories').eagerLoad('products').find(c1.id)
  ok(isArray(c1WithProducts.products), 'category.products eagerload works fine');
};
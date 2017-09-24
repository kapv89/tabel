# Tabel - node.js ORM for PostgreSQL

### `npm install --save table@1`

## A simple orm built over [knex.js](http://knexjs.org/) which works with simple javascript objects and arrays. More of a table gateway that can behave like an orm, and scale back down to a a table-gateway when needed.

#### MIT License

`npm install --save tabel`

### Sections

- [Philosophy](#philosophy)
- [Getting Started](#getting-started)
- [Migrations](#migrations)
- [Table Declarations](#table-declarations)
- [Query Building](#query-building)
- [Data Retrieval](#data-retrieval)
- [Data Mutation](#data-mutation)
- [Scopes and Joints and Forking](#scopes-and-joints-and-forking)
- [Relationships and Eagerloading](#relationships-and-eagerloading)

### Philosophy

**Tabel** was born out of the need felt for a simple Object-Relational-Mapper for PostgreSQL, nothing more.

Its salient features are full fledged relation management, while working with simple
_javascript objects and arrays_.

It is a thin layer over the really awesome [knex.js](http://knexjs.org/) query builder.
It allows you to define table-gateways which can eager-load and manage relations, while giving you the
ability to drop down to knex, or raw sql when you need to.

This way, **Tabel** helps you with rapid development with relation management, etc, and steps out of your
way when you need to take control of your database.

And since it works with plain javascript objects and arrays, its a breeze to make it work with other data sources like elastic-search etc. **Data is just data**.

### Getting Started

First you need to get an instance of **Tabel** orm. Its best that you define one orm instance(per db), and export `orm.exports` a module
```js
const Tabel = require('tabel');

const orm = new Tabel({
  db: {
    client: 'postgresql',
    connection: {
      database: 'api_dev',
      host: 'localhost',
      port: 5432,
      user: 'dev',
      password: 'dev'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: 'knex_migrations'
  },
  // redis config is optional, is used for caching by tabel
  redis: {
    host: 'localhost',
    port: '6379',
    keyPrefix: 'dev.api.'
  }
});

// all the table definitions go here

module.exports = orm.exports;
/**
This is what the exports look like:

this.exports = {
  orm: this,
  table: this.table.bind(this),
  trx: this.trx.bind(this),
  raw: this.raw.bind(this),
  migrator: this.migrator,
  cache: this.cache,
  knex: this.knex,
  isUsableObject
};
**/


```
You need to define your tables for the orm. These tables must already exist in the database. You can use [migrations](#migrations) helper provided by **Tabel** to get a quick cli based migrations tool.
```js
orm.defineTable({
  name: 'users'
});

orm.defineTable({
  name: 'posts'
});

orm.defineTable({
  name: 'photos'
});

orm.defineTable({
  name: 'tags'
});

// you can now use them like this in some other model, like your routes

const app = module.exports = require('express')();

const {table} = require('orm');

app.get('/posts', async (req, res) => {
  const posts = await table('posts').all();
  res.send({posts});
});

```

### Migrations

Tabel provides support for migrations using knex.js.
To use db migrations cli tool in your project, do the following

- Create a file `migrate.js` in your project root
- Paste the following in that file:

```js
const migrate = require('tabel/lib/migrate');
const ormConfig = require('./config'); // same as shown in "Getting Started"

migrate(config);

```
- Now run `node migrate.js` or make `migrate.js` an executable and run `./migrate.js`

__Available commands__

1. `make`: Make a new migration
2. `latest`: Migrate to latest migration
3. `rollback`: Rollback the last batch of migrations
4. `version`: View the number of current batch of migration
5. `reset`: Reset all migrations
6. `refresh`: Reset all migrations and migrate back to the latest


### Table Declarations

Below is an example of a complete table definition with default values.
```js
orm.defineTable({
  // the table's name, is required, should be a string
  name: null,

  // table properties
  props: {
    key: 'id',
    // default key column, can be ['user_id', 'post_id'] for composite keys

    autoId: false,
    // set this to true if you want the orm to generate a 36 character
    // uuid for your inserts. The orm checks for uniqueness of the uuid
    // when its generating it.
    // Can generate composite keys.
    // If using autoId on postgresql, use uuid column for your key(s)
    // If using autoId on any other db, use a 36 length varchar

    perPage: 25,
    // standard batch size per page used by `forPage` method
    // table.forPage(page, perPage) method uses offset
    // avoid that and use a keyset in prod (http://use-the-index-luke.com/no-offset)

    timestamps: false
    // set to `true` if you want auto timestamps or
    // timestamps: ['created_at', 'updated_at'] (these are defaults when `true`)
    // will be assigned in this order only
  },

  // predefined scopes on the table. Will talk about them more in scopes and joints section. `this` will be bound to the table instance.
  scopes: {},

  // predefined joints on the table. Will talk about them more in scopes and joints section. `this` will be bound to the table instance.
  joints: {},

  // relations definitions for the table. Will talk about them more in scopes and joints section. `this` will be bound to the table instance.
  relations: {},

  // standard method definitions that you want to define for the table.
  // `this` will be bound to the table instance
  methods: {}
});
```

### Query Building
Query building in **Tabel** is a very thin layer over [**knex.js**](http://knexjs.org), along
with caching and relation eager-loading facilities. Below is a list of all query building methods
offered. All these methods are **chainable**, and return the instance of class `Table`
that they are called on

```js
/**
 * Usage example for query building:
 */
import {table} from './orm'; // refer to "Getting Started" section

const posts = await table('posts').where('title', '=', 'fizz').orWhere('title', '=', 'buzz').all();

const postsTable = table('posts');
postsTable.whereIn('id', ids)
postsTable.where('published_on', '>', lastMonthDateTime);
postsTable.where('is_active', true);

postsTable.all().then((posts) => { /* do things with `posts` here */});

// the || thing here postgresql string concatenation dialect
table('tags').whereRaw(`lower(name) like '%'||lower(?)||'%'`, 'foo').all();

// suppose 'post_tag' is a table containing the columns 'post_id' & 'tag_id'
table('post_tag').whereIn(['post_id', 'tag_id'], [{post_id: 1, tag_id: 1}, {post_id: 1, tag_id: 2}]).all()


/**
 * don't scope any rows
 * @return {this} current instance
 */
whereFalse()

/**
 * apply a where condition on the key(s) with scopes as planned
 * @param  {mixed} val value(s) to match the key(s) against
 * @return {this} current instance
 *
 * whereKey(1)
 * whereKey({id: 1})
 * whereKey({post_id: 1, tag_id: 2})
 * whereKey([1,2,3,4]);
 * whereKey([{post_id: 1, tag_id: 2}, {post_id: 1, tag_id:2}])
 */
whereKey(val)

/**
 * apply an orWhere condition on the key(s) with scopes as planned
 * @param  {mixed} val value(s) to match the key(s) against
 * @return {this} current instance
 *
 * orWhereKey(1)
 * orWhereKey({id: 1})
 * orWhereKey({post_id: 1, tag_id: 2})
 * orWhereKey([1,2,3,4]);
 * orWhereKey([{post_id: 1, tag_id: 2}, {post_id: 1, tag_id:2}])
 */
orWhereKey(val)

/**
 * scope a where condition
 * @param  {mixed} args conditions
 * @return {this} current instance
 *
 * where({field1: val1, field2: val2})
 * where(field, val)
 * where(field, operator, val)
 */
where(...args)

/**
 * scope an orWhere condition
 * @param  {mixed} args conditions
 * @return {this} current instance
 *
 * orWhere({field1: val1, field2: val2})
 * orWhere(field, val)
 * orWhere(field, operator, val)
 */
orWhere(...args)

/**
 * scope a whereNot condition
 * @param  {mixed} args conditions
 * @return {this} current instance
 *
 * whereNot({field1: val1, field2: val2})
 * whereNot(field, val)
 * whereNot(field, operator, val)
 */
whereNot(...args)

/**
 * scope an orWhereNot condition
 * @param  {mixed} args conditions
 * @return {this} current instance
 *
 * orWhereNot({field1: val1, field2: val2})
 * orWhereNot(field, val)
 * orWhereNot(field, operator, val)
 */
orWhereNot(...args)

/**
 * scope a whereIn condition
 * @param  {string} field field name
 * @param  {[mixed]} vals values to match against
 * @return {this} current instance
 *
 * whereIn('id', [1,2,3,4])
 * whereIn(['user_id', 'post_id'], [{user_id: 1, post_id: 2}, {user_id: 3, post_id: 5}])
 */
whereIn(field, vals=[])

/**
 * scope an orWhereIn condition
 * @param  {string} field field name
 * @param  {[mixed]} vals values to match against
 * @return {this} current instance
 *
 * orWhereIn('id', [1,2,3,4])
 * orWhereIn(['user_id', 'post_id'], [{user_id: 1, post_id: 2}, {user_id: 3, post_id: 5}])
 */
orWhereIn(field, vals=[])

/**
 * scope a whereNotIn condition
 * @param  {string} field field name
 * @param  {[mixed]} vals values to match against
 * @return {this} current instance
 *
 * whereNotIn('id', [1,2,3,4])
 * whereNotIn(['user_id', 'post_id'], [{user_id: 1, post_id: 2}, {user_id: 3, post_id: 5}])
 */
whereNotIn(field, vals=[])

/**
 * scope a orWhereNotIn condition
 * @param  {string} field field name
 * @param  {[mixed]} vals values to match against
 * @return {this} current instance
 *
 * orWhereNotIn('id', [1,2,3,4])
 * orWhereNotIn(['user_id', 'post_id'], [{user_id: 1, post_id: 2}, {user_id: 3, post_id: 5}])
 */
orWhereNotIn(field, vals=[])

/**
 * scope a whereNull condition
 * @param  {string} field field name
 * @return {this} current instance
 */
whereNull(field)
/**
 * scope an orWhereNull condition
 * @param  {string} field field name
 * @return {this} current instance
 */
orWhereNull(field)

/**
 * scope a whereNotNull condition
 * @param  {string} field field name
 * @return {this} current instance
 */
whereNotNull(field)

/**
 * scope an orWhereNotNull condition
 * @param  {string} field field name
 * @return {this} current instance
 */
orWhereNotNull(field)

/**
 * scope a whereBetween condition
 * @param  {string} field field name
 * @param  {[mixed]} range range of vals
 * @return {this} current instance
 */
whereBetween(field, [min, max])

/**
 * scope a orWhereBetween condition
 * @param  {string} field field name
 * @param  {[mixed]} range range of vals
 * @return {this} current instance
 */
orWhereBetween(field, [min, max])

/**
 * scope a whereNotBetween condition
 * @param  {string} field field name
 * @param  {[mixed]} range range of vals
 * @return {this} current instance
 */
whereNotBetween(field, [min, max])

/**
 * scope a orWhereNotBetween condition
 * @param  {string} field field name
 * @param  {[mixed]} range range of vals
 * @return {this} current instance
 */
orWhereNotBetween(field, [min, max])

/**
 * scope a whereRaw condition
 * @param  {string} condition raw where condition
 * @param  {[mixed]} bindings condition bindings
 * @return {this} current instance
 */
whereRaw(condition, bindings)

/**
 * scope a orWhereRaw condition
 * @param  {string} condition raw where condition
 * @param  {[mixed]} bindings condition bindings
 * @return {this} current instance
 */
orWhereRaw(condition, bindings)

/**
 * scope a transaction
 * @param  {knex.transaction} trx the ongoing transaction
 * @return {this} current instance
 */
transacting(trx)

/**
 * scope for a page number
 * @param  {int} page page number
 * @param  {int} perPage records per page
 * @return {this} current instance
 */
forPage(page, perPage)

/**
 * apply a scope which sets an offset
 * @param  {int} offset offset to be set on the query
 * @return {this} current instance
 */
offset(offset)

/**
 * apply a scope which sets a limit on the query
 * @param  {int} limit limit to be set on the query
 * @return {this} current instance
 */
limit(limit)

/**
 * apply a scope which sets an order on the query
 * @param  {string} field column by which to order
 * @param  {string} direction should be 'asc', 'desc'
 * @return {this} current instance
 */
orderBy(field, direction)

/**
 * apply a scope which sets an orderByRaw on the query
 * @param  {string} sql sql for the order by
 * @param {array} bindings bindings for orderByRaw
 * @return {this} current instance
 */
orderByRaw(sql, bindings)
/**
 * apply a scope which sets a groupBy on the query
 * @param  {...string} args columns to group by
 * @return {this} current instance
 */
groupBy(...args)

/**
 * apply a scope which sets a groupByRaw on the query
 * @param  {string} sql sql for the group by
 * @param {array} bindings bindings for groupBy
 * @return {this} current instance
 */
groupByRaw(sql, bindings)

/**
 * apply a scope which sets a having clause on the query
 * @param  {string} col column
 * @param  {op} op  operator
 * @param  {val} val value
 * @return {this} current instance
 */
having(col, op, val)
/**
 * apply a scope which sets a having clause on the query
 * @param  {string} sql sql string for the having clause
 * @param  {array} bindings bindings for the sql
 * @return {this} current instance
 */
havingRaw(sql, bindings)

/**
 * apply a scope which sets a distinct clause on the query
 * @return {this} current instance
 */
distinct()

/**
 * apply a scope to select some columns
 * @param  {mixed} cols the columns to select
 * @return {this} current instance
 */
select(cols)

/**
 * apply a scope to join a table with this Table
 * @param {string} tableName to join
 * @param {...mixed} args join conditions
 * @return {this} current instance
 */
join(tableName, ...args)
/**
 * apply a scope to leftJoin a table with this Table
 * @param {string} tableName to join
 * @param {...mixed} args join conditions
 * @return {this} current instance
 */
leftJoin(tableName, ...args)

/**
 * apply a scope which enables a cache on the current query
 * @param  {int} lifetime lifetime in milliseconds
 * @return {this} current instance
 */
cache(lifetime)
/**
 * apply a scope which sets the flag for destruction of cache
 * @return {this} current instance
 */
uncache()

/**
 * add a scope to eager-load various relations
 * @param  {...mixed} eagerLoads relations to eager-load with constraints, {} or []
 * @return {this} current instance
 */
eagerLoad(...eagerLoads)
```

### Data Retrieval

There are 4 methods through which you retrieve data using **Tabel**. They are given below.
These methods honor the scopes applied on the table before their call, and can apply other scopes
based on the arguments provided to them.

```js
/**
 * Usage example for `first`. Use others similarly.
 */

 import {table} from './orm'; // refer to "Getting Started"

 table('posts').first();
 table('posts').first('title', 'Foo');
 table('posts').first('published_on', '<', new Date());
 table('posts').first({is_active: true});
 table('posts').where('id', 'in', ids).first();
 table('posts').where('published_on', '<', new Date()).first({is_active: true});


/**
 * get the first row for the scoped query
 * @param  {...mixed} args conditions for scoping the query
 * @return {Promise} promise which resolves the result
 */
first(...args)

/**
 * get all rows from the scoped query
 * @param  {...mixed} args conditions for scoping the query
 * @return {Promise} promise which resolves the result
 */
all(...args)

/**
 * get count of the scoped result set. works well
 * even when you have groupBy etc in your queries
 * as it gives the count of the result of the current query
 * @param  {...mixed} args conditions for scoping the query
 * @return {int} count of the result set
 */
count(...args)

/**
 * find a single model for supplied conditions. similar to first,
 * but you can also just call it with
 * @param  {...mixed} args conditions for finding the model
 * @return {Promise} promise for found model
 *
 * find(id)
 * find({field1: val1, field2: val2})
 */
find(...args)
```

### Data Mutation

There are three ways to mutate data using **Tabel**.
1. Insert
2. Update
3. Delete

All of them return a `Promise`. Details below:
```js

const {table} = require('orm');

// Insert
table('posts').insert({title: 'Foo', body: 'Lorem Ipsum'})
  .then((model) => {
    // inserted object. id will be included if `autoId` is true
    return model
  })
;

table('posts').insert([
  {title: 'Bar', body: 'fizz buzz'},
  {title: 'Baz', body: 'foo bar'}
]).then((models) => {
  // inserted array of objects. ids will be included if `autoId` is true
  return models
});

// ------------------------------------------------------------------------

// Update
table('posts').where('title', 'Foo').update({title: 'Fizz', body: 'foo bar'})
  .then(() => {
    // nothing relevant returned in this sort of update
    // perform next ops here
  })
;

table('posts').update(post.id, {title: 'Bar', body: 'fizz buzz'})
  .then((model) => {
    // updated model returned
    return model;
  })
;

// ------------------------------------------------------------------------

// Delete
table('posts').where('title', 'Foo').delete()
  .then(() => {
    // nothing relevant returned
    // perform next ops here
  })
;

table('posts').delete(post.id);
table('posts').delete('title', 'Foo');
table('posts').delete({title: 'Foo'});
table('posts').delete('title', '=', 'Foo')
```

### Scopes and Joints and Forking

__Tabel__ brings in a few new concepts which help you make a domain-query-language to work with your database in context
of your software. Using these concepts is explained below:

```js

// Scopes
// Use these to create a shorthand for often repeated query conditions
orm.defineTable({
  name: 'posts'
  ...
  scopes: {
    // style of syntax is important, as these functions need to use Function.bind
    // to set the proper value of `this`
    wherePublished() {
      return this.where('is_published', true);
    }
  }
});

// Now you can do
const {table} = orm.exports;
table('posts').wherePublished().all().then((posts) => {
  // do something with posts
});

// ----------------------------------------------------------------------

// Joints
// You'd rarely use this feature, because of the awesome relationships.
// Still, worth going through.
orm.defineTable({
  name: 'posts'
  ...
  joints: {
    joinTagsPivot() {
      return this.joint((q) => {
        // knex.js join syntax works here
        q.join('post_tag', 'post_tag.post_id', '=', 'posts.id');
      });
    },

    joinTags() {
      return this.joinTagsPivot().joint((q) => {
        q.join('tags', 'post_tag.tag_id', '=', 'tags.id');
      });
    }
  }
});

const {table} = orm.exports;

// joints are like scopes, however, they are applied *only once*.
// So you can do this:
table('posts').joinTagsPivot().joinTags().where('tags.id', 'in', ids).all();
// And the table 'post_tag' will only be joined once


// ----------------------------------------------------------------------

// Forking
// best explained by an example

const postsTable = table('posts').where('id', 'in', ids);
const activePostsTable = postsTable.fork().where('is_active', true);
const inactivePostsTable = postsTable.fork().where('is_active', false);

Promise.all([postsTable.all(), activePostsTable.all(), inactivePostsTable.all()])
  .then(([allPosts, activePosts, inactivePosts]) => {
    // do something with this data
  })
;

```

### Relationships and Eagerloading

__Tabel__ supports 8 different types of relationships between tables. The relationships of a table need to be defined
along with table definition. Relationships also provide functionality to join related, pivot, and through tables in the current query.
I seriously advice you to go through the code for relationships [here](https://github.com/fractaltech/tabel/tree/master/src/relations)
to discover the full power they provide.

```js
orm.defineTable({
  name: 'posts'
  ...
  relations: {
    author() {
      return this.belongsTo('users', 'user_id');
    },

    tags() {
      return this.manyToMany('tags', 'post_tag', 'post_id', 'tag_id');
    },

    comments() {
      return this.hasMany('comments', 'post_id');
    }
  }
});

// You can now do this:
table('posts').eagerLoad('author', 'tags', 'comments').all();
table('posts').author().join().where('users.username', '=', 'foo').all();
table('posts').author().leftJoin().where('users.username', '=', 'foo').all();
table('posts').tags().join().where('tags.name', 'in', tagNames).all();
table('posts').tags().joinPivot().where('post_tag.tag_id', 'in', tagIds).all();
table('posts').tags().leftJoinPivot().where('post_tag.tag_id', 'in', tagIds).all();

```

Different relationships given below:

```js
/**
 * get a new hasOne relation
 * @param  {string}  related related table name
 * @param  {string}  foreignKey foreign-key on related table
 * @param  {string}  key key to match with on this table
 * @return {HasOne}  HasOne relation instance
 */
hasOne(related, foreignKey, key) {
  // key = key || this.key();

  return new HasOne(this, this.table(related), foreignKey, key);
}

/**
 * get a new hasMany relation
 * @param  {string}  related related table name
 * @param  {string}  foreignKey foreign-key on related table
 * @param  {string}  key key to match with on this table
 * @return {HasMany} HasMany relation instance
 */
hasMany(related, foreignKey, key) {
  key = key || this.key();

  return new HasMany(this, this.table(related), foreignKey, key);
}

/**
 * get a new hasManyThrough relation
 * @param  {string}  related related table name
 * @param  {string}  through through table name
 * @param  {string}  firstKey foreign-key on through table
 * @param  {string}  secondKey foreign-key on related table
 * @return {HasManyThrough} HasManyThrough relation instance
 */
hasManyThrough(related, through, firstKey, secondKey) {
  return new HasManyThrough(
    this, this.table(related), this.table(through), firstKey, secondKey
  );
}

/**
 * get a new BelongsTo relation
 * @param  {string} related related table name
 * @param  {string} foreignKey foreign-key on this table
 * @param  {string} otherKey key to match on other table
 * @return {BelongsTo} BelongsTo relation instance
 */
belongsTo(related, foreignKey, otherKey) {
  related = this.table(related);
  otherKey = otherKey || related.key();

  return new BelongsTo(this, related, foreignKey, otherKey);
}

/**
 * get a new ManyToMany relation
 * @param  {string} related related table name
 * @param  {string} pivot pivot table name
 * @param  {string} foreignKey foreign-key on this table
 * @param  {string} otherKey other-key on this table
 * @param  {function} joiner extra join conditions
 * @return {ManyToMany} BelongsToMany relation instance
 */
manyToMany(related, pivot, foreignKey, otherKey, joiner=(() => {})) {
  return new ManyToMany(
    this, this.table(related), this.table(pivot), foreignKey, otherKey,
    joiner
  );
}

/**
 * get a new MorphOne relation
 * @param  {string} related related table name
 * @param  {string} inverse inverse relation ship name
 * @return {MorphOne} MorphOne relation instance
 */
morphOne(related, inverse) {
  related = this.table(related);

  return new MorphOne(this, related, related[inverse]());
}

/**
 * get a new MorphMany relation
 * @param  {string} related related table name
 * @param  {string} inverse inverse relation ship name
 * @return {MorphMany} MorphMany relation instance
 */
morphMany(related, inverse) {
  related = this.table(related);

  return new MorphMany(this, related, related[inverse]());
}

/**
 * get a new MorphTo relation
 * @param  {array} tables array of table names this relation morph's to
 * @param  {string} typeField  type-field name
 * @param  {string} foreignKey foreign-key name
 * @return {MorphTo} MorphTo relation instance
 */
morphTo(tables, typeField, foreignKey) {
  tables = tables.map((t) => this.table(t));

  return new MorphTo(this, tables, typeField, foreignKey);
}
```

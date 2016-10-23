# Tabel

### `npm install --save table@1`

## A simple orm built over [knex.js](http://knexjs.org/) which works with simple javascript objects and arrays. More of a table gateway that can behave like an orm, and scale back down to a a table-gateway when needed. Right now works only with postgres.

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
- [Relationships](#relationships)
- [Eager Loading](#eager-loading)
- [Caching](#caching)
- [Hooks](#hooks)
- [Migrations](#migrations)
- [Extending Table Classes](#extending-table-classes)
- [Example Projects](#examples)

### Philosophy

**Tabel** was born out of the need felt for a simple Object-Relational-Mapper, nothing more.

Its salient features are full fledged relation management, while working with simple
Javascript objects and arrays.

It is a thin layer over the really awesome [knex.js](http://knexjs.org/) query builder.
It allows you to define table-gateways which can eager-load and manage relations, while giving you the
ability to drop down to knex, or raw sql when you need to.

This way, **Tabel** helps you with rapid development with relation management, etc, and steps out of your
way if you need to take control of your database.

And since it works with plain javascript objects and arrays, its a breeze to make it work with other data sources like elastic-search etc. **Data is just data**.

### Getting Started

First you need to get an instance of **Tabel** orm. Its best that you define one orm instance(per db), and export `orm.exports` a module
```js
import Tabel from 'tabel';

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

export default orm.exports;
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

import express from 'express';

import {table} from orm;

app.get('/posts', async (req, res) => {
  const posts = await table('posts').all();
  res.send({posts});
});

export default app;

```

### Migrations

Just add the following to your package.json to use migrations:
```
"scripts": {
  "migrate": "tabel.migrate driver=<pg|mysql|sqlite> db=<dbname> host=<dbhost> port=<port> username=<username> password=<password> migrations=<migrations_table_name>"
}
```

And use like this:
```
npm run migrate <command> [...args]
```


__Defaults:__
1. __dbhost__: `localhost`
2. __port__: `5432`
3. __migrations__: `knex_migrations`

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
    // If using autoId on postgres, use uuid column for your key(s)
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

// the || thing here postgres string concatenation dialect
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

 table('posts').first()
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

### Scopes and Joints and Forking

### Relationships

### Eager Loading

### Caching

### Hooks?

### Migrations

### Extending Table Classes

### Example Projects

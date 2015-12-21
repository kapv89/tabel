# Tabel

## A simple orm built over [knex.js](http://knexjs.org/) which works with simple javascript objects and arrays. More of a table gateway that can behave like an orm, and scale back down to a a table-gateway when needed

#### MIT License

`npm install --save tabel`

### Sections

- [Philosophy](#philosophy)
- [Getting Started](#getting-started)
- [Table Declarations](#table-declarations)
- [Scopes and Joints and Forking)](#scopes-and-joints-and-forking)
- [Relationships](#relationships)
- [Query Building](#query-building)
- [Eager Loading](#eager-loading)
- [Caching](#caching)
- [Hooks](#hooks)
- [Migrations](#migrations)
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

  // used to process model and collection results fetched from the db
  // override as you need to
  processors: {
    model(row) { return row; },
    collection(rows) { return rows; }
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

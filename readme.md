# Tabel

## A simple orm with over [knex.js](http://knexjs.org/) which works with simple javascript objects and arrays. More of a table gateway that can behave like an orm if needed, and scale back down to a a table-gateway when needed

#### MIT License

`npm install --save tabel`

### Sections

1. [Philosophy](#philosophy)
2. [Getting Started](#getting-started)
3. [Table Declarations](#table-declarations)
4. [Relationships](#relationships)
5. [Query Building](#query-building)
6. [Eager Loading](#eager-loading)
7. [Scopes & Joints (& Forking)](#scopes-and-joints)
8. [Caching](#caching)
9. [Hooks](#hooks)
10. [Example Projects](#examples)

-

### Philosophy

**Tabel** was born out of the need felt for a simple Object-Relational-Mapper, nothing more.

Its salient features are full fledged relation management, while working with simple
Javascript objects and arrays.

It is a thin layer over the really awesome [knex.js](http://knexjs.org/) query builder. 
It allows you to define table-gateways which can eager-load and manage relations, while giving you the
ability to drop down to knex, or raw sql when you need to.

This way, **Tabel** helps you with rapid development with relation management, etc, and steps out of your
way if you need to take control of your database.

And since it works with plain javascript objects and arrays, its a breeze to make it work with other data sources like elastic-search etc. Data is just data.

### Getting Started

First you need to get an instance of Tabel orm
```js
import Tabel from 'tabel';

const orm = new Tabel({
  db: {
    client: 'postgresql',
    connection: {
      database: 'repup_api_dev',
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
    keyPrefix: 'repup.api.'
  }
});
```
Then you need to define a few tables using the orm

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
```
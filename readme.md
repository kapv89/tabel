# Tabel - node.js ORM for PostgreSQL

## A simple orm for PostgreSQL, built over [knex.js](http://knexjs.org/) which works with simple javascript objects and arrays.

#### MIT License

`npm install --save tabel`


## Docs only for v2
#### [Read the docs](https://github.com/fractaltech/tabel/wiki).

Following tests are available:
1. `npm run test.orm`
2. `npm run test.collisions`
3. `npm run test.migrator`
4. `npm run test.migrate.cli`

Before running tests, copy `test/config.sample.js` to `test/config.js`.

### V3 notes

1. Added `scoperAsync`. `const {scoperAsync} = require('app/orm');`.
2. Working on dynamic-query-chain-classes.
3. using rdisdsl instead of kredis
4. `autoId` table definition flag changed to `uuid`
5. Added mysql support with `uuid` flag `true`
6. Added mysql support with `increments` flag `true`
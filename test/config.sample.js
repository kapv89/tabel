module.exports = {
  // pg
  db: {
    client: 'postgresql',
    connection: {
      database: 'tabel_test',
      host: 'localhost',
      port: 5432,
      user: 'dev',
      password: 'dev'
    },
    migrations: 'knex_migrations'
  },
  redis: {
    host: 'localhost',
    port: '6379',
    keyPrefix: 'test.tabel.'
  }

  // mysql
  // db: {
  //   client: 'mysql',
  //   connection: {
  //     database: 'tabel_test',
  //     host: 'localhost',
  //     port: 3306,
  //     user: 'root',
  //     password: 'root'
  //   },
  //   migrations: 'knex_migrations'
  // },
  // redis: {
  //   host: 'localhost',
  //   port: '6379',
  //   keyPrefix: 'test.tabel.'
  // }
};

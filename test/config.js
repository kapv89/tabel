export default {
  pg: {
    db: {
      client: 'postgresql',
      connection: {
        database: 'tabel_test',
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
    redis: {
      host: 'localhost',
      port: '6379',
      keyPrefix: 'test.tabel.'
    }
  },

  mysql: {
    db: {
      client: 'mysql',
      connection: {
        database: 'tabel_test',
        host: 'localhost',
        user: 'root',
        password: 'root'
      },
      pool: {
        min: 2,
        max: 10
      },
      migrations: 'knex_migrations'
    },
    redis: {
      host: 'localhost',
      port: '6379',
      keyPrefix: 'test.tabel.'
    }
  }
};

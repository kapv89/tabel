const path = require('path');
const fileExists = require('file-exists');

const Orm = require('./Orm');

function run(...args) {
  const {configArgs, commandArgs} = separateArgs(args);

  const config = {
    host: 'localhost',
    port: 5432,
    migrations: 'knex_migrations',
    ...argsToConfig(configArgs)
  };

  if (
    !(
      'driver' in config &&
      'db' in config &&
      'host' in config &&
      'port' in config &&
      'username' in config &&
      'password' in config &&
      'migrations' in config
    ) ||
    ['pg', 'mysql', 'sqlite'].indexOf(config.driver) === -1
  ) {
    console.log(
`
Invalid config in package.json. Please check.

"scripts": {
  "migrate": "tabel.migrate driver=<pg|mysql|sqlite> db=<dbname> host=<dbhost> port=<port> username=<username> password=<password> migrations=<migrations_table_name>"
}

Defaults:
dbhost: 'localhost'
port: '5432'
migrations: 'knex_migrations'
`
    );

    return Promise.reject(new Error('invalid config'));
  }

  if (Object.keys(config).length > 7) {
    console.log(`Invalid command arguments. Command arguments cannot contain '='`);
    return Promise.reject(new Error('invalid command'));
  }

  const orm = new Orm({
    db: {
      client: config.driver,
      connection: {
        database: config.db,
        host: config.host,
        port: config.port,
        user: config.username,
        password: config.password
      },
      migrations: config.migrations
    }
  });

  const {migrator} = orm.exports;

  const projectStubPath = path.join(`${process.cwd()}`, 'migration.stub');
  const defaultStubPath = path.join(`${__dirname}`, 'migration.stub');

  return migrator.mount({
    devDir: path.join(process.cwd(), 'migrations'),
    distDir: path.join(process.cwd(), 'migrations'),
    getArgs: () => commandArgs,
    stub: fileExists(projectStubPath) ? projectStubPath : defaultStubPath
  });
}

function separateArgs(args) {
  const configArgs = args.filter((arg) => arg.indexOf('=') > -1);
  const commandArgs = args.filter((arg) => arg.indexOf('=') === -1);

  return {configArgs, commandArgs};
}

function argsToConfig(args) {
  return args.reduce((config, token) => {
    const [key, val] = token.split('=');
    return {
      ...config,
      [key]: val
    };
  }, {});
}

if (require.main === module) {
  const args = process.argv.slice(2);
  run(...args);
}

module.exports = run;

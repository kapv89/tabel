const path = require('path');

const Orm = require('./Orm');

const defaultMigrationsDir = path.join(process.cwd(), 'migrations');
const defaultMigratorConfig = {
  devDir: defaultMigrationsDir,
  distDir: defaultMigrationsDir,
  args: process.argv.slice(2)
};

function run(ormConfig, migratorConfig={}) {
  migratorConfig = {
    ...defaultMigratorConfig,
    ...migratorConfig
  };

  const orm = new Orm(ormConfig);
  const {migrator} = orm.exports;

  migrator.mount(migratorConfig).then(() => orm.close());
}

module.exports = run;

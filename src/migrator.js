const {isString} = require('lodash');
const path = require('path');

function migrator(orm) {
  return {
    mount({devDir, distDir, args=[], stub=path.join(__dirname, 'migration.stub')}) {
      const knex = orm.knex;

      if (args.length === 0 || Object.keys(commands).indexOf(args[0]) === -1) {
        console.log('Available Commands:');
        console.log(Object.keys(commands).join('\n'));

        return Promise.resolve();
      } else {
        return ((cmd, ...args) => commands[cmd](knex, {devDir, distDir, stub}, ...args))(...args);
      }
    }
  };
}

const commands = {
  make(knex, {devDir, stub}, migration) {
    if (!isString(migration) || migration.length === 0) {
      console.log('Usage: npm run task:migrate make MigrationName');
      return Promise.resolve({});
    }

    console.log(`Making migration ${migration}`);
    return knex.migrate.make(migration, {
      stub,
      directory: devDir
    });
  },

  latest(knex, {distDir}) {
    console.log('Migrating...');

    return knex.migrate.latest({directory: distDir}).then((batch) => {
      if (batch[0] === 0) {
        return;
      } else {
        console.log(`Batch: ${batch[0]}`);
        batch[1].forEach((file) => {
          console.log(file);
        });
        return;
      }
    });
  },

  rollback(knex, {distDir}) {
    console.log('Rolling Back...');

    return knex.migrate.rollback({directory: distDir}).then((batch) => {
      if (batch[0] === 0) {
        return;
      } else {
        console.log(`Batch: ${batch[0]}`);
        batch[1].forEach((file) => {
          console.log(file);
        });
      }
    });
  },

  version(knex, {distDir}) {
    return knex.migrate.currentVersion({directory: distDir}).then((version) => {
      console.log(`Current Version: ${version}`);
    });
  },

  reset(knex, {distDir}) {
    console.log('Resetting...');

    function rollbackToBeginning() {
      return knex.migrate.rollback({directory: distDir}).then((batch) => {
        if (batch[0] === 0) {
          return Promise.resolve(null);
        } else {
          console.log(`Batch: ${batch[0]}`);
          batch[1].forEach((file) => {
            console.log(file);
          });

          return rollbackToBeginning();
        }
      });
    }

    return rollbackToBeginning();
  },

  refresh(knex, {distDir}) {
    return this.reset(knex, {distDir}).then(() => {
      return this.latest(knex, {distDir});
    });
  }
};

module.exports = migrator;

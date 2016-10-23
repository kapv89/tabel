const fs = require('fs');
const path = require('path');

const migrator = require('./migrator');

function run(...args) {
  const projectStubPath = path.join(`${process.cwd()}`, 'migration.stub');
  const defaultStubPath = path.join(`${__dirname}`, 'migration.stub');

  return new Promise((resolve) => fs.access(
    projectStubPath,
    fs.constants.R_OK,
    (err) => err ? resolve(projectStubPath) : resolve(defaultStubPath)
  )).then((stubPath) => (
    migrator.mount({
      devDir: './migrations',
      distDir: './migrations',
      getArgs: () => args,
      stub: stubPath
    })
  ));
}

if (require.main === module) {
  const args = process.argv.slice(2);
  run(...args);
}

module.exports = run;

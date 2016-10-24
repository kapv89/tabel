const config = require('../config');

const migrate = require('../../src/migrate.cli');

migrate(config.pg);

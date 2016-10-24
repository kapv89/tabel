const config = require('../config');

const migrate = require('../../src/migrate');

migrate(config.pg);

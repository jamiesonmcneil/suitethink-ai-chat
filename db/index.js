require('dotenv').config();
const pgp = require('pg-promise')();
const config = require('config');
const logger = require('../utils/logger');

const dbConfig = config.get('database');
const db = pgp(dbConfig.connection);

db.connect()
  .then(obj => {
    logger.info('Database connection established');
    obj.done(); // Release the connection
  })
  .catch(error => {
    logger.error('Database connection failed', { error: error.message });
  });

module.exports = db;

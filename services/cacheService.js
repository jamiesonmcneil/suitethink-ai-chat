const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const getCachedResponse = async (propertyId, queryText) => {
  let client;
  try {
    client = await pool.connect();
    const cacheResult = await client.query(
      'SELECT response_text FROM comms.scrape_feedback WHERE fk_property_id = $1 AND query_text = $2 AND is_active = true ORDER BY create_date DESC LIMIT 1',
      [propertyId, queryText]
    );
    return cacheResult.rows[0]?.response_text;
  } catch (error) {
    console.error('Cache get error:', { message: error.message, stack: error.stack });
    return null;
  } finally {
    if (client) client.release();
  }
};

const cacheResponse = async (propertyId, queryText, responseText, responseTimeMs) => {
  let client;
  try {
    client = await pool.connect();
    await client.query(
      'INSERT INTO comms.scrape_feedback (fk_property_id, query_text, response_text, response_time_ms, success, is_active, create_date, update_date, fk_user_id_updated) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $7)',
      [propertyId, queryText, responseText, responseTimeMs, true, true, 1]
    );
  } catch (error) {
    console.error('Cache set error:', { message: error.message, stack: error.stack });
  } finally {
    if (client) client.release();
  }
};

module.exports = { getCachedResponse, cacheResponse };

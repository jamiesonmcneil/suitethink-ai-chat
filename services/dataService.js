const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const getScrapedData = async (propertyId) => {
  let client;
  try {
    client = await pool.connect();
    const frequentResult = await client.query(
      'SELECT data FROM comms.scraped_data_frequent WHERE fk_property_id = $1 AND is_active = true ORDER BY create_date DESC LIMIT 1',
      [propertyId]
    );
    const infrequentResult = await client.query(
      'SELECT data FROM comms.scraped_data_infrequent WHERE fk_property_id = $1 AND is_active = true ORDER BY create_date DESC LIMIT 1',
      [propertyId]
    );
    return {
      frequent: frequentResult.rows[0]?.data || {},
      infrequent: infrequentResult.rows[0]?.data || {}
    };
  } catch (error) {
    console.error('Scraped data error:', { message: error.message, stack: error.stack });
    throw error;
  } finally {
    if (client) client.release();
  }
};

module.exports = { getScrapedData };

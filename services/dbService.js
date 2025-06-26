const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

exports.findOrCreateUserByPhone = async (phone, firstName, lastName) => {
  let client;
  try {
    client = await pool.connect();
    let user = await client.query(
      'SELECT fk_user_id AS id FROM comms.user_phone WHERE phone_number = $1',
      [phone]
    );
    if (user.rows.length === 0) {
      const newUser = await client.query(
        'INSERT INTO comms.user (first_name, last_name, create_date) VALUES ($1, $2, CURRENT_TIMESTAMP) RETURNING id',
        [firstName || 'Guest', lastName || '']
      );
      const userId = newUser.rows[0].id;
      const phoneResult = await client.query(
        'INSERT INTO comms.user_phone (fk_user_id, phone_number, create_date) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (phone_number) DO UPDATE SET update_date = CURRENT_TIMESTAMP RETURNING id',
        [userId, phone]
      );
      return { user_id: userId, user_phone_id: phoneResult.rows[0].id };
    }
    return { user_id: user.rows[0].id, user_phone_id: user.rows[0].id };
  } catch (error) {
    console.error('Find or create user by phone error:', error);
    throw error;
  } finally {
    if (client) client.release();
  }
};

exports.findOrCreateUserByEmail = async (email, firstName, lastName) => {
  let client;
  try {
    client = await pool.connect();
    let user = await client.query(
      'SELECT id FROM comms.user WHERE email = $1 AND is_active = true AND is_deleted = false',
      [email]
    );
    if (user.rows.length === 0) {
      user = await client.query(
        'INSERT INTO comms.user (email, first_name, last_name, create_date) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING id',
        [email, firstName || 'Guest', lastName || '']
      );
    }
    const userId = user.rows[0].id;
    const emailResult = await client.query(
      'INSERT INTO comms.user_email (fk_user_id, email, create_date) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (email) DO UPDATE SET update_date = CURRENT_TIMESTAMP RETURNING id',
      [userId, email]
    );
    return { user_id: userId, user_email_id: emailResult.rows[0].id };
  } catch (error) {
    console.error('Find or create user by email error:', error);
    throw error;
  } finally {
    if (client) client.release();
  }
};

exports.saveActivity = async (userId, channel, message, fkUserPhoneId) => {
  let client;
  try {
    client = await pool.connect();
    const activity = await client.query(
      'INSERT INTO comms.user_activity (fk_user_id, fk_user_phone_id, channel, create_date) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING id',
      [userId, fkUserPhoneId || null, channel]
    );
    if (message) {
      await client.query(
        'INSERT INTO comms.user_activity_item (fk_user_activity_id, message_text, sender, create_date) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
        [activity.rows[0].id, message, 'User']
      );
    }
    return activity.rows[0].id;
  } catch (error) {
    console.error('Save activity error:', error);
    throw error;
  } finally {
    if (client) client.release();
  }
};

exports.saveActivityItem = async (activityId, sender, message) => {
  let client;
  try {
    client = await pool.connect();
    await client.query(
      'INSERT INTO comms.user_activity_item (fk_user_activity_id, message_text, sender, create_date) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
      [activityId, message, sender]
    );
  } catch (error) {
    console.error('Save activity item error:', error);
    throw error;
  } finally {
    if (client) client.release();
  }
};

const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });
console.log('DATABASE_URL:', process.env.DATABASE_URL);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function findOrCreateUserByPhone(phone, name, email) {
  try {
    let user = await pool.query('SELECT id FROM comms.user WHERE phone_number = $1 AND is_active = true AND is_deleted = false', [phone]);
    if (user.rows.length === 0) {
      user = await pool.query(
        'INSERT INTO comms.user (id, uuid, phone_number, first_name, email, is_active, is_deleted, create_date, update_date, fk_user_id_updated) VALUES (DEFAULT, DEFAULT, $1, $2, $3, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1) RETURNING id',
        [phone, name, email]
      );
      await pool.query(
        'INSERT INTO comms.user_phone (id, uuid, fk_user_id, phone_number, is_active, is_deleted, create_date, update_date, fk_user_id_updated) VALUES (DEFAULT, DEFAULT, $1, $2, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)',
        [user.rows[0].id, phone]
      );
      if (email) {
        await pool.query(
          'INSERT INTO comms.user_email (id, uuid, fk_user_id, email, is_active, is_deleted, create_date, update_date, fk_user_id_updated) VALUES (DEFAULT, DEFAULT, $1, $2, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)',
          [user.rows[0].id, email]
        );
      }
    }
    const userPhone = await pool.query('SELECT id FROM comms.user_phone WHERE phone_number = $1', [phone]);
    return { user_id: user.rows[0].id, user_phone_id: userPhone.rows[0].id };
  } catch (error) {
    console.error('Error in findOrCreateUserByPhone:', error.stack);
    throw error;
  }
}

async function findOrCreateUserByEmail(email, name, phone) {
  try {
    let user = await pool.query('SELECT id FROM comms.user WHERE email = $1 AND is_active = true AND is_deleted = false', [email]);
    if (user.rows.length === 0) {
      user = await pool.query(
        'INSERT INTO comms.user (id, uuid, email, first_name, phone_number, is_active, is_deleted, create_date, update_date, fk_user_id_updated) VALUES (DEFAULT, DEFAULT, $1, $2, $3, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1) RETURNING id',
        [email, name, phone]
      );
      await pool.query(
        'INSERT INTO comms.user_email (id, uuid, fk_user_id, email, is_active, is_deleted, create_date, update_date, fk_user_id_updated) VALUES (DEFAULT, DEFAULT, $1, $2, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)',
        [user.rows[0].id, email]
      );
      if (phone) {
        await pool.query(
          'INSERT INTO comms.user_phone (id, uuid, fk_user_id, phone_number, is_active, is_deleted, create_date, update_date, fk_user_id_updated) VALUES (DEFAULT, DEFAULT, $1, $2, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)',
          [user.rows[0].id, phone]
        );
      }
    }
    const userEmail = await pool.query('SELECT id FROM comms.user_email WHERE email = $1', [email]);
    return { user_id: user.rows[0].id, user_email_id: userEmail.rows[0].id };
  } catch (error) {
    console.error('Error in findOrCreateUserByEmail:', error.stack);
    throw error;
  }
}

async function saveActivity(userId, phoneId, emailId, channel, conversationId) {
  try {
    const result = await pool.query(
      'INSERT INTO comms.user_activity (id, uuid, fk_user_id, fk_user_phone_id, fk_user_email_id, channel, is_active, is_deleted, create_date, update_date, fk_user_id_updated) VALUES (DEFAULT, DEFAULT, $1, $2, $3, $4, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1) RETURNING id',
      [userId, phoneId, emailId, channel]
    );
    return result.rows[0].id;
  } catch (error) {
    console.error('Error in saveActivity:', error.stack);
    throw error;
  }
}

async function saveActivityItem(activityId, sender, message) {
  try {
    await pool.query(
      'INSERT INTO comms.user_activity_item (id, uuid, fk_user_activity_id, sender, message_text, is_active, is_deleted, create_date, update_date, fk_user_id_updated) VALUES (DEFAULT, DEFAULT, $1, $2, $3, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)',
      [activityId, sender, message]
    );
  } catch (error) {
    console.error('Error in saveActivityItem:', error.stack);
    throw error;
  }
}

module.exports = { findOrCreateUserByPhone, findOrCreateUserByEmail, saveActivity, saveActivityItem };

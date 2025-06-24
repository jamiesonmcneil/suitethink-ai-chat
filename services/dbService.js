const { Client } = require('pg');
require('dotenv').config({ path: './.env' });

const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect();

exports.findOrCreateUserByEmail = async (email, name) => {
  try {
    let user = await client.query(
      'SELECT id FROM comms.user WHERE email = $1 AND is_active = true AND is_deleted = false',
      [email]
    );
    if (user.rows.length === 0) {
      user = await client.query(
        'INSERT INTO comms.user (email, name, create_date) VALUES ($1, $2, CURRENT_TIMESTAMP) RETURNING id',
        [email, name || 'Guest']
      );
    }
    const userId = user.rows[0].id;
    const emailResult = await client.query(
      'INSERT INTO comms.user_email (fk_user_id, email, create_date) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (email) DO UPDATE SET update_date = CURRENT_TIMESTAMP RETURNING id',
      [userId, email]
    );
    return { user_id: userId, user_email_id: emailResult.rows[0].id };
  } catch (error) {
    console.error('Find or create user error:', error);
    throw error;
  }
};

exports.saveActivity = async (userId, channel, message) => {
  try {
    const activity = await client.query(
      'INSERT INTO comms.user_activity (fk_user_id, channel, create_date) VALUES ($1, $2, CURRENT_TIMESTAMP) RETURNING id',
      [userId, channel]
    );
    await client.query(
      'INSERT INTO comms.user_activity_item (fk_user_activity_id, message_text, sender, create_date) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
      [activity.rows[0].id, message, 'User']
    );
  } catch (error) {
    console.error('Save activity error:', error);
    throw error;
  }
};

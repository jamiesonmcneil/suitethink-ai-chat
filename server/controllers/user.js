const { client } = require('../db/index');

async function checkUserContact(req, res) {
  try {
    const { email, phone } = req.body;
    let userId, userEmailId, userPhoneId;
    if (email) {
      const emailResult = await client.query(
        'SELECT u.id, ue.id as user_email_id FROM comms.user u JOIN comms.user_email ue ON u.id = ue.fk_user_id WHERE ue.email = $1 AND u.is_active = true AND u.is_deleted = false',
        [email]
      );
      if (emailResult.rows.length > 0) {
        userId = emailResult.rows[0].id;
        userEmailId = emailResult.rows[0].user_email_id;
      }
    }
    if (phone) {
      const phoneResult = await client.query(
        'SELECT u.id, up.id as user_phone_id FROM comms.user u JOIN comms.user_phone up ON u.id = up.fk_user_id WHERE up.phone_number = $1 AND u.is_active = true AND u.is_deleted = false',
        [phone]
      );
      if (phoneResult.rows.length > 0) {
        userId = userId || phoneResult.rows[0].id;
        userPhoneId = phoneResult.rows[0].user_phone_id;
      }
    }
    res.json({ user_id: userId || null, user_email_id: userEmailId || null, user_phone_id: userPhoneId || null });
  } catch (error) {
    console.error('Check user contact error:', error);
    res.status(500).json({ message: 'Failed to check user contact.', error: error.message });
  }
}

async function updateUserContact(req, res) {
  try {
    const { email, phone, is_primary, user_id } = req.body;
    let userId = user_id;
    let userEmailId, userPhoneId;

    if (!userId && (email || phone)) {
      const existing = await client.query(
        'SELECT id FROM comms.user WHERE email = $1 OR phone_number = $2 AND is_active = true AND is_deleted = false',
        [email || null, phone || null]
      );
      if (existing.rows.length > 0) {
        userId = existing.rows[0].id;
        await client.query(
          'UPDATE comms.user SET email = $1, phone_number = $2 WHERE id = $3',
          [email || existing.rows[0].email, phone || existing.rows[0].phone_number, userId]
        );
      } else {
        const result = await client.query(
          'INSERT INTO comms.user (email, phone_number, create_date) VALUES ($1, $2, CURRENT_TIMESTAMP) RETURNING id',
          [email || null, phone || null]
        );
        userId = result.rows[0].id;
      }
    }

    if (email && userId) {
      await client.query(
        'UPDATE comms.user_email SET is_primary = false WHERE fk_user_id = $1 AND is_primary = true',
        [userId]
      );
      const emailResult = await client.query(
        'INSERT INTO comms.user_email (fk_user_id, email, create_date, is_primary) VALUES ($1, $2, CURRENT_TIMESTAMP, $3) ON CONFLICT (email) DO UPDATE SET is_primary = $3, update_date = CURRENT_TIMESTAMP RETURNING id',
        [userId, email, is_primary]
      );
      userEmailId = emailResult.rows[0].id;
    }
    if (phone && userId) {
      await client.query(
        'UPDATE comms.user_phone SET is_primary = false WHERE fk_user_id = $1 AND is_primary = true',
        [userId]
      );
      const phoneResult = await client.query(
        'INSERT INTO comms.user_phone (fk_user_id, phone_number, create_date, is_primary) VALUES ($1, $2, CURRENT_TIMESTAMP, $3) ON CONFLICT (phone_number) DO UPDATE SET is_primary = $3, update_date = CURRENT_TIMESTAMP RETURNING id',
        [userId, phone, is_primary]
      );
      userPhoneId = phoneResult.rows[0].id;
    }
    res.json({ message: 'User contact updated.', user_id: userId, user_email_id: userEmailId, user_phone_id: userPhoneId });
  } catch (error) {
    console.error('Update user contact error:', error);
    res.status(500).json({ message: 'Failed to update user contact.', error: error.message });
  }
}

async function submitConsent(req, res) {
  try {
    const { user_id, is_consent, consent_keyword, phone, email } = req.body;
    const result = await client.query(
      'INSERT INTO comms.user_consent (fk_user_id, is_consent, consent_keyword, fk_property_email, fk_property_phone, create_date) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING id',
      [user_id, is_consent, consent_keyword, email || null, phone ? (await client.query('SELECT id FROM comms.property_phone WHERE phone_number = $1', [phone])).rows[0]?.id : null]
    );
    res.json({ message: is_consent ? 'Consent granted.' : 'Consent declined.', id: result.rows[0].id });
  } catch (error) {
    console.error('Consent submission error:', error);
    res.status(500).json({ message: 'Failed to submit consent.', error: error.message });
  }
}

async function getConsentText(req, res) {
  try {
    res.json({ consent_text: 'Do you consent to receive notifications from Storio Self Storage? Reply CONSENT to opt-in or STOP to opt-out.' });
  } catch (error) {
    console.error('Get consent text error:', error);
    res.status(500).json({ message: 'Failed to fetch consent text.', error: error.message });
  }
}

async function checkConsent(req, res) {
  try {
    const { email, phone, type } = req.body;
    let result;
    if (type === 'email' && email) {
      result = await client.query('SELECT is_consent FROM comms.user_consent WHERE fk_property_email = $1 ORDER BY create_date DESC LIMIT 1', [email]);
    } else if (type === 'phone' && phone) {
      const phoneId = (await client.query('SELECT id FROM comms.property_phone WHERE phone_number = $1', [phone])).rows[0]?.id;
      result = await client.query('SELECT is_consent FROM comms.user_consent WHERE fk_property_phone = $1 ORDER BY create_date DESC LIMIT 1', [phoneId]);
    }
    res.json({ is_consent: result?.rows[0]?.is_consent || false });
  } catch (error) {
    console.error('Check consent error:', error);
    res.status(500).json({ message: 'Failed to check consent.', error: error.message });
  }
}

module.exports = {
  checkUserContact,
  updateUserContact,
  submitConsent,
  getConsentText,
  checkConsent
};

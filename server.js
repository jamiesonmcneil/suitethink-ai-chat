const express = require('express');
const path = require('path');
const { Client } = require('pg');
const twilio = require('twilio');
const nodemailer = require('nodemailer');
const { queryAI } = require('./services/aiService');
require('dotenv').config({ path: './.env' });

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect();

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const transporter = nodemailer.createTransport({
  host: 'mail.smtp2go.com',
  port: 587,
  secure: false,
  auth: { user: process.env.SMTP2GO_USERNAME, pass: process.env.SMTP2GO_PASSWORD }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/chat-widget.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat-widget.js'));
});

app.post('/api/query', async (req, res) => {
  try {
    const { query, conversationHistory, user_id, email, phone, name } = req.body;
    if (!query) {
      return res.status(400).json({ message: 'Query is required.' });
    }
    const response = await queryAI(query, conversationHistory, { user_id, email, phone, name });
    res.json({ response });
  } catch (error) {
    console.error('Web query error:', error);
    res.status(500).json({ message: 'Failed to process query.', error: error.message });
  }
});

app.post('/api/check-user-contact', async (req, res) => {
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
});

app.post('/api/update-user-contact', async (req, res) => {
  try {
    const { email, phone, name, user_id } = req.body;
    let userId = user_id;
    let userEmailId, userPhoneId;
    if (!userId) {
      const existing = await client.query(
        'SELECT id FROM comms.user WHERE email = $1 OR phone_number = $2 AND is_active = true AND is_deleted = false',
        [email || null, phone || null]
      );
      if (existing.rows.length > 0) {
        userId = existing.rows[0].id;
        await client.query(
          'UPDATE comms.user SET email = $1, phone_number = $2, name = $3 WHERE id = $4',
          [email || existing.rows[0].email, phone || existing.rows[0].phone_number, name || existing.rows[0].name, userId]
        );
      } else {
        const result = await client.query(
          'INSERT INTO comms.user (name, email, phone_number, create_date) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING id',
          [name || 'Guest', email || null, phone || null]
        );
        userId = result.rows[0].id;
      }
    }
    if (email) {
      const emailResult = await client.query(
        'INSERT INTO comms.user_email (fk_user_id, email, create_date) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (email) DO UPDATE SET update_date = CURRENT_TIMESTAMP RETURNING id',
        [userId, email]
      );
      userEmailId = emailResult.rows[0].id;
    }
    if (phone) {
      const phoneResult = await client.query(
        'INSERT INTO comms.user_phone (fk_user_id, phone_number, create_date) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (phone_number) DO UPDATE SET update_date = CURRENT_TIMESTAMP RETURNING id',
        [userId, phone]
      );
      userPhoneId = phoneResult.rows[0].id;
    }
    res.json({ message: 'User contact updated.', user_id: userId, user_email_id: userEmailId, user_phone_id: userPhoneId });
  } catch (error) {
    console.error('Update user contact error:', error);
    res.status(500).json({ message: 'Failed to update user contact.', error: error.message });
  }
});

app.post('/api/send-transcript-email', async (req, res) => {
  try {
    const { email, transcript } = req.body;
    await transporter.sendMail({
      from: '"Storio Self Storage" <noreply@suitethink.com>',
      to: email,
      subject: 'Storio Self Storage Chat Transcript',
      text: transcript
    });
    res.json({ message: 'Transcript sent to your email.' });
  } catch (error) {
    console.error('Email transcript error:', error);
    res.status(500).json({ message: 'Failed to send email.', error: error.message });
  }
});

app.post('/api/send-transcript-sms', async (req, res) => {
  try {
    const { phone, transcript } = req.body;
    if (!phone || typeof phone !== 'string') throw new Error('Invalid phone number');
    const maxLength = 1600;
    const shortTranscript = transcript.length > maxLength ? transcript.substring(0, maxLength - 3) + '...' : transcript;
    await twilioClient.messages.create({
      body: shortTranscript,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+${phone.replace(/^\+/, '').replace(/\D/g, '')}`
    });
    res.json({ message: 'Transcript sent via SMS.' });
  } catch (error) {
    console.error('SMS transcript error:', error);
    res.status(500).json({ message: 'Failed to send SMS.', error: error.message });
  }
});

app.post('/api/save-transcript', async (req, res) => {
  try {
    const { transcript, is_require_followup, followup_method, fk_user_email_id, fk_user_phone_id } = req.body;
    const result = await client.query(
      'INSERT INTO comms.transcript (transcript, is_require_followup, followup_method, fk_user_email_id, fk_user_phone_id, followup_request_date, create_date) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP) RETURNING id',
      [transcript, is_require_followup || false, followup_method || null, fk_user_email_id || null, fk_user_phone_id || null, is_require_followup ? new Date() : null]
    );
    const url = `https://penguin-new-wildly.ngrok-free.app/transcript/${result.rows[0].id}`;
    res.json({ id: result.rows[0].id, url });
  } catch (error) {
    console.error('Save transcript error:', error);
    res.status(500).json({ message: 'Failed to save transcript.', error: error.message });
  }
});

app.post('/api/update-transcript', async (req, res) => {
  try {
    const { transcript_id, is_require_followup, followup_method, fk_user_email_id, fk_user_phone_id } = req.body;
    await client.query(
      'UPDATE comms.transcript SET is_require_followup = $1, followup_method = $2, fk_user_email_id = $3, fk_user_phone_id = $4, followup_request_date = $5 WHERE id = $6',
      [is_require_followup, followup_method, fk_user_email_id || null, fk_user_phone_id || null, is_require_followup ? new Date() : null, transcript_id]
    );
    res.json({ message: 'Transcript updated.' });
  } catch (error) {
    console.error('Update transcript error:', error);
    res.status(500).json({ message: 'Failed to update transcript.', error: error.message });
  }
});

app.post('/api/submit-support-request', async (req, res) => {
  try {
    const { query, method, email, phone, name, transcript_id } = req.body;
    await client.query(
      'UPDATE comms.transcript SET is_require_followup = $1, followup_method = $2, followup_request_date = CURRENT_TIMESTAMP WHERE id = $3',
      [true, method, transcript_id]
    );
    if (method === 'email' && email) {
      await transporter.sendMail({
        from: '"Storio Self Storage" <noreply@suitethink.com>',
        to: email,
        subject: 'Storio Support Request',
        text: `Your question "${query}" has been received. A Support Specialist will follow up soon.`
      });
    } else if (method === 'sms' && phone) {
      await twilioClient.messages.create({
        body: `Your question "${query}" has been received. A Support Specialist will follow up soon.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: `+${phone.replace(/^\+/, '').replace(/\D/g, '')}`
      });
    }
    res.json({ message: `Support request sent via ${method}.` });
  } catch (error) {
    console.error('Support request error:', error);
    res.status(500).json({ message: 'Failed to submit support request.', error: error.message });
  }
});

app.post('/api/submit-consent', async (req, res) => {
  try {
    const { user_id, is_consent, consent_keyword, phone, email } = req.body;
    const result = await client.query(
      'INSERT INTO comms.user_consent (fk_user_id, is_consent, consent_keyword, fk_property_email, fk_property_phone, create_date) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING id',
      [user_id || null, is_consent, consent_keyword, email || null, phone || null]
    );
    res.json({ message: is_consent ? 'Consent granted.' : 'Consent declined.', id: result.rows[0].id });
  } catch (error) {
    console.error('Consent submission error:', error);
    res.status(500).json({ message: 'Failed to submit consent.', error: error.message });
  }
});

app.get('/api/transcript/:id', async (req, res) => {
  try {
    const result = await client.query('SELECT transcript FROM comms.transcript WHERE id = $1', [req.params.id]);
    if (result.rows[0]) {
      res.set('Content-Type', 'text/plain');
      res.send(result.rows[0].transcript);
    } else {
      res.status(404).send('Transcript not found');
    }
  } catch (error) {
    console.error('Fetch transcript error:', error);
    res.status(500).send('Error fetching transcript');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const express = require('express');
const path = require('path');
const { getHome, handleWebQuery } = require('./controllers/webController');
const { Client } = require('pg');
const twilio = require('twilio');
const nodemailer = require('nodemailer');
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
  auth: {
    user: process.env.SMTP2GO_USERNAME,
    pass: process.env.SMTP2GO_PASSWORD
  }
});

app.get('/', getHome);
app.get('/chat-widget.js', (req, res) => res.sendFile(path.join(__dirname, 'public', 'chat-widget.js')));
app.post('/query', handleWebQuery);

app.post('/send-transcript-email', async (req, res) => {
  try {
    const { email, transcript } = req.body;
    await transporter.sendMail({
      from: '"Storio Self Storage" <noreply@suitethink.com>',
      to: email,
      subject: 'Storio Self Storage Chat Transcript',
      text: transcript
    });
    console.log(`Email sent to ${email}`);
    res.json({ message: 'Transcript sent to your email.' });
  } catch (error) {
    console.error('Email transcript error:', error);
    res.status(500).json({ message: 'Failed to send email.', error: error.message });
  }
});

app.post('/send-transcript-sms', async (req, res) => {
  try {
    const { phone, transcript } = req.body;
    if (!phone || typeof phone !== 'string') {
      throw new Error('Invalid phone number');
    }
    const maxLength = 1600;
    const shortTranscript = transcript.length > maxLength ? transcript.substring(0, maxLength - 3) + '...' : transcript;
    await twilioClient.messages.create({
      body: shortTranscript,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+${phone.replace(/^\+/, '').replace(/\D/g, '')}`
    });
    console.log(`SMS sent to ${phone}`);
    res.json({ message: 'Transcript sent via SMS.' });
  } catch (error) {
    console.error('SMS transcript error:', error);
    res.status(500).json({ message: 'Failed to send SMS.', error: error.message });
  }
});

app.post('/save-transcript', async (req, res) => {
  try {
    const { transcript, is_require_followup, followup_method } = req.body;
    const result = await client.query(
      'INSERT INTO comms.transcripts (transcript, is_require_followup, followup_method, followup_request_date, create_date) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING id',
      [transcript, is_require_followup || false, followup_method || null, is_require_followup ? new Date() : null]
    );
    const url = `https://penguin-new-wildly.ngrok-free.app/transcript/${result.rows[0].id}`;
    res.json({ url });
  } catch (error) {
    console.error('Save transcript error:', error);
    res.status(500).json({ message: 'Failed to save transcript.', error: error.message });
  }
});

app.post('/submit-support-request', async (req, res) => {
  try {
    const { query, method, email, phone, name, transcript_id } = req.body;
    await client.query(
      'UPDATE comms.transcripts SET is_require_followup = $1, followup_method = $2, followup_request_date = CURRENT_TIMESTAMP WHERE id = $3',
      [true, method, transcript_id]
    );
    console.log(`Support request submitted: ${query} via ${method}`);
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

app.post('/update-user-contact', async (req, res) => {
  try {
    const { email, phone, name } = req.body;
    const existing = await client.query(
      'SELECT id FROM comms.user WHERE name = $1 AND (email = $2 OR phone = $3)',
      [name || 'Guest', email || null, phone || null]
    );
    let userId;
    if (existing.rows.length > 0) {
      userId = existing.rows[0].id;
      await client.query(
        'UPDATE comms.user SET email = $1, phone = $2 WHERE id = $3',
        [email || existing.rows[0].email, phone || existing.rows[0].phone, userId]
      );
    } else {
      const result = await client.query(
        'INSERT INTO comms.user (name, email, phone, create_date) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING id',
        [name || 'Guest', email || null, phone || null]
      );
      userId = result.rows[0].id;
    }
    if (email) {
      await client.query(
        'INSERT INTO comms.user_email (fk_user_id, email, create_date) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING',
        [userId, email]
      );
    }
    res.json({ message: 'User contact updated.' });
  } catch (error) {
    console.error('Update user contact error:', error);
    res.status(500).json({ message: 'Failed to update user contact.', error: error.message });
  }
});

app.get('/transcript/:id', async (req, res) => {
  try {
    const result = await client.query('SELECT transcript FROM comms.transcripts WHERE id = $1', [req.params.id]);
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

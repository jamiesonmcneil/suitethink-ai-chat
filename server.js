const express = require('express');
const path = require('path');
const { getHome, handleWebQuery } = require('./controllers/webController');
const { Client } = require('pg');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: './.env' });

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect();

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

app.post('/save-transcript', async (req, res) => {
  try {
    const { transcript, is_require_followup, followup_method } = req.body;
    if (!transcript) {
      throw new Error('Transcript is required');
    }
    if (followup_method && !['email'].includes(followup_method)) {
      throw new Error('Invalid followup_method');
    }
    const result = await client.query(
      'INSERT INTO comms.transcript (transcript, is_require_followup, followup_method, followup_request_date, create_date) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING id',
      [transcript, is_require_followup || false, followup_method || null, is_require_followup ? new Date() : null]
    );
    const url = `http://localhost:3000/transcript/${result.rows[0].id}`;
    res.json({ url });
  } catch (error) {
    console.error('Save transcript error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint
    });
    res.status(500).json({ message: 'Failed to save transcript.', error: error.message });
  }
});

app.post('/submit-support-request', async (req, res) => {
  try {
    const { query, method, email, firstName, lastName, transcript_id } = req.body;
    await client.query(
      'UPDATE comms.transcript SET is_require_followup = $1, followup_method = $2, followup_request_date = CURRENT_TIMESTAMP WHERE id = $3',
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
    }
    res.json({ message: `Support request sent via ${method}.` });
  } catch (error) {
    console.error('Support request error:', error);
    res.status(500).json({ message: 'Failed to submit support request.', error: error.message });
  }
});

app.post('/update-user-contact', async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body;
    const existing = await client.query(
      'SELECT id FROM comms.user WHERE email = $1',
      [email || null]
    );
    let userId;
    if (existing.rows.length > 0) {
      userId = existing.rows[0].id;
      await client.query(
        'UPDATE comms.user SET email = $1, first_name = $2, last_name = $3 WHERE id = $4',
        [email || existing.rows[0].email, firstName || existing.rows[0].first_name, lastName || existing.rows[0].last_name, userId]
      );
    } else {
      const result = await client.query(
        'INSERT INTO comms.user (first_name, last_name, email, create_date) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING id',
        [firstName || null, lastName || null, email || null]
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

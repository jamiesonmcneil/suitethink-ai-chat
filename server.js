const express = require('express');
const path = require('path');
const { getHome, handleWebQuery } = require('./controllers/webController');
const voiceRoutes = require('./routes/voiceRoutes');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: './.env' });

try {
  console.log('Loaded server.js at', new Date().toISOString());

  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use((req, res, next) => {
    console.log(`Request: ${req.method} ${req.url} ${JSON.stringify(req.body)}`);
    next();
  });

  app.use('/voice', voiceRoutes);

  app.get('/audio/cache/:filename', async (req, res) => {
    const fs = require('fs').promises;
    try {
      const audioPath = path.join('/tmp/cache', req.params.filename);
      await fs.access(audioPath);
      res.set('Content-Type', 'audio/mpeg');
      res.sendFile(audioPath);
    } catch (error) {
      console.error('Audio serve error:', error);
      res.status(404).send('Audio not found');
    }
  });

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const transporter = nodemailer.createTransport({
    host: 'mail.smtp2go.com',
    port: 587,
    secure: false,
    auth: { user: process.env.SMTP2GO_USERNAME, pass: process.env.SMTP2GO_PASSWORD }
  });

  app.get('/', getHome);
  app.get('/chat-widget.js', (req, res) => res.sendFile(path.join(__dirname, 'public', 'chat-widget.js')));
  app.post('/query', handleWebQuery);

  app.post('/send-transcript-email', async (req, res) => {
    let client;
    try {
      client = await pool.connect();
      const { email, transcript } = req.body;
      const propertyResult = await client.query('SELECT contact_email FROM comms.property WHERE id = $1', [1]);
      const bccEmail = propertyResult.rows[0]?.contact_email || 'support@storio.com';
      await transporter.sendMail({
        from: '"Storio Self Storage" <noreply@suitethink.com>',
        to: email,
        bcc: bccEmail,
        subject: 'Storio Self Storage Chat Transcript',
        text: transcript
      });
      res.json({ message: 'Transcript sent to your email.' });
    } catch (error) {
      console.error('Email transcript error:', error);
      res.status(500).json({ message: 'Failed to send email.' });
    } finally {
      if (client) client.release();
    }
  });

  app.post('/save-transcript', async (req, res) => {
    let client;
    try {
      client = await pool.connect();
      const { transcript, is_require_followup, followup_method } = req.body;
      if (!transcript) throw new Error('Transcript is required');
      if (followup_method && !['email'].includes(followup_method)) throw new Error('Invalid followup_method');
      const result = await client.query(
        'INSERT INTO comms.transcript (transcript, is_require_followup, followup_method, followup_request_date, create_date) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING id',
        [transcript, is_require_followup || false, followup_method || null, is_require_followup ? new Date() : null]
      );
      res.json({ url: `http://localhost:3000/transcript/${result.rows[0].id}` });
    } catch (error) {
      console.error('Save transcript error:', error);
      res.status(500).json({ message: 'Failed to save transcript.' });
    } finally {
      if (client) client.release();
    }
  });

  app.post('/submit-support-request', async (req, res) => {
    let client;
    try {
      client = await pool.connect();
      const { query, method, email, firstName, lastName, transcript_id } = req.body;
      await client.query(
        'UPDATE comms.transcript SET is_require_followup = $1, followup_method = $2, followup_request_date = CURRENT_TIMESTAMP WHERE id = $3',
        [true, method, transcript_id]
      );
      if (method === 'email' && email) {
        const propertyResult = await client.query('SELECT contact_email FROM comms.property WHERE id = $1', [1]);
        const bccEmail = propertyResult.rows[0]?.contact_email || 'support@storio.com';
        await transporter.sendMail({
          from: '"Storio Self Storage" <noreply@suitethink.com>',
          to: email,
          bcc: bccEmail,
          subject: 'Storio Support Request',
          text: `Your question "${query}" has been received. A Support Specialist will follow up soon.`
        });
      }
      res.json({ message: `Support request sent via ${method}.` });
    } catch (error) {
      console.error('Support request error:', error);
      res.status(500).json({ message: 'Failed to submit support request.' });
    } finally {
      if (client) client.release();
    }
  });

  app.post('/update-user-contact', async (req, res) => {
    let client;
    try {
      client = await pool.connect();
      const { email, firstName, lastName } = req.body;
      const existing = await client.query('SELECT id FROM comms.user WHERE email = $1', [email || null]);
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
      res.status(500).json({ message: 'Failed to update user contact.' });
    } finally {
      if (client) client.release();
    }
  });

  app.get('/transcript/:id', async (req, res) => {
    let client;
    try {
      client = await pool.connect();
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
    } finally {
      if (client) client.release();
    }
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} catch (error) {
  console.error('Server startup error:', error);
  process.exit(1);
}

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
      from: 'noreply@suitethink.com',
      to: email,
      subject: 'Storio Self Storage Chat Transcript',
      text: transcript
    });
    console.log(`Email sent to ${email}`);
    res.json({ message: 'Transcript sent to your email.' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ message: 'Failed to send email.' });
  }
});

app.post('/send-transcript-sms', async (req, res) => {
  try {
    const { phone, transcript } = req.body;
    const maxLength = 1600;
    const shortTranscript = transcript.length > maxLength ? transcript.substring(0, maxLength - 3) + '...' : transcript;
    await twilioClient.messages.create({
      body: shortTranscript,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });
    console.log(`SMS sent to ${phone}`);
    res.json({ message: 'Transcript sent via SMS.' });
  } catch (error) {
    console.error('SMS error:', error);
    res.status(500).json({ message: 'Failed to send SMS.' });
  }
});

app.post('/save-transcript', async (req, res) => {
  try {
    const { transcript } = req.body;
    const result = await client.query(
      'INSERT INTO comms.transcripts (transcript, create_date) VALUES ($1, CURRENT_TIMESTAMP) RETURNING id',
      [transcript]
    );
    const url = `https://penguin-new-wildly.ngrok-free.app/transcript/${result.rows[0].id}`;
    res.json({ url });
  } catch (error) {
    console.error('Save transcript error:', error);
    res.status(500).json({ message: 'Failed to save transcript.' });
  }
});

app.post('/submit-support-request', async (req, res) => {
  try {
    const { query, method, email, phone } = req.body;
    await client.query(
      'INSERT INTO comms.support_requests (query, method, email, phone, create_date) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)',
      [query, method, email, phone]
    );
    console.log(`Support request submitted: ${query} via ${method}`);
    if (method === 'email' && email) {
      await transporter.sendMail({
        from: 'noreply@suitethink.com',
        to: email,
        subject: 'Storio Support Request',
        text: `Your question "${query}" has been received. A Support Specialist will follow up soon.`
      });
    } else if (method === 'sms' && phone) {
      await twilioClient.messages.create({
        body: `Your question "${query}" has been received. A Support Specialist will follow up soon.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone
      });
    }
    res.json({ message: `Support request sent via ${method}.` });
  } catch (error) {
    console.error('Support request error:', error);
    res.status(500).json({ message: 'Failed to submit support request.' });
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

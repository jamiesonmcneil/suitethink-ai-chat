const { client } = require('../db/index');
const twilio = require('twilio');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: './.env' });

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

async function sendTranscriptEmail(req, res) {
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
}

async function sendTranscriptSMS(req, res) {
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
}

async function saveTranscript(req, res) {
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
}

async function updateTranscript(req, res) {
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
}

async function getTranscript(req, res) {
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
}

async function submitSupportRequest(req, res) {
  try {
    const { query, method, email, phone, name, transcript_id } = req.body;
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
}

module.exports = {
  sendTranscriptEmail,
  sendTranscriptSMS,
  saveTranscript,
  updateTranscript,
  getTranscript,
  submitSupportRequest
};

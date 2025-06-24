const express = require('express');
const { getHome, handleWebQuery } = require('../controllers/webController');
const { sendTranscriptEmail, sendTranscriptSMS, saveTranscript, updateTranscript, getTranscript, submitSupportRequest } = require('../controllers/transcript');
const { checkUserContact, updateUserContact, submitConsent, getConsentText, checkConsent } = require('../controllers/user');

const router = express.Router();

router.get('/', getHome);
router.get('/chat-widget.js', (req, res) => res.sendFile(path.join(__dirname, '../../public', 'chat-widget.js')));
router.post('/query', handleWebQuery);
router.post('/send-transcript-email', sendTranscriptEmail);
router.post('/send-transcript-sms', sendTranscriptSMS);
router.post('/save-transcript', saveTranscript);
router.post('/update-transcript', updateTranscript);
router.get('/transcript/:id', getTranscript);
router.post('/submit-support-request', submitSupportRequest);
router.post('/check-user-contact', checkUserContact);
router.post('/update-user-contact', updateUserContact);
router.post('/submit-consent', submitConsent);
router.get('/get-consent-text', getConsentText);
router.post('/check-consent', checkConsent);

module.exports = { router };

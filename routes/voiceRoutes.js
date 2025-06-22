const express = require('express');
const { handleVoice, handleVoiceResponse, handleUserInfo } = require('../controllers/voiceController');

const router = express.Router();

router.post('/', handleVoice);
router.post('/response', handleVoiceResponse);
router.post('/user-info', handleUserInfo);

module.exports = router;

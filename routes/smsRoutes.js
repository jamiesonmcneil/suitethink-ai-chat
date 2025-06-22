const express = require('express');
const { handleSMS } = require('../controllers/smsController');

const router = express.Router();

router.post('/', handleSMS);

module.exports = router;

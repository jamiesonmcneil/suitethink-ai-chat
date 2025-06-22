const express = require('express');
const { getHome, handleWebQuery } = require('../controllers/webController');

const router = express.Router();

router.get('/', getHome);
router.post('/query', handleWebQuery);

module.exports = router;

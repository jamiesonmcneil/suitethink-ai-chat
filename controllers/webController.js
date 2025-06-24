const path = require('path');
const { queryAI } = require('../services/aiService');

exports.getHome = (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
};

exports.handleWebQuery = async (req, res) => {
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
};

const { queryAI } = require('./queryService');
require('dotenv').config({ path: './.env' });

console.log('Loaded aiService.js at', new Date().toISOString());

async function queryAIWrapper(input, conversationHistory = [], userData = {}) {
  return queryAI(input, conversationHistory, userData, 'chat');
}

module.exports = { queryAI: queryAIWrapper };

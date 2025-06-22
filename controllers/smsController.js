const twilio = require('twilio');
const { saveActivity, saveActivityItem, findOrCreateUserByPhone } = require('../services/dbService');
const { queryAI } = require('../services/aiService');
const { getStockText } = require('../services/storageService');

async function handleSMS(req, res) {
  const twiml = new twilio.twiml.MessagingResponse();
  const conversationId = Date.now().toString();
  const from = req.body.From;
  const input = req.body.Body.toLowerCase();
  const user = await findOrCreateUserByPhone(from, null, null);

  await saveActivity(user.id, null, null, 'sms', conversationId);
  await saveActivityItem(conversationId, 'user', input);

  let response;

  if (input.includes('name') || input.includes('email')) {
    response = "Please provide your name and either your email or phone number.";
  } else {
    response = await queryAI(input, 1);
  }

  await saveActivityItem(conversationId, 'ai', response);
  twiml.message(response);
  res.type('text/xml');
  res.send(twiml.toString());
}

module.exports = { handleSMS };

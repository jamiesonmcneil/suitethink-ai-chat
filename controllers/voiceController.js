const twilio = require('twilio');
const { saveActivity, saveActivityItem, findOrCreateUserByPhone } = require('../services/dbService');
const { getStockText } = require('../services/storageService');

async function handleVoice(req, res) {
  const twiml = new twilio.twiml.VoiceResponse();
  const conversationId = Date.now().toString();
  const from = req.body.From;
  const user = await findOrCreateUserByPhone(from, null, null);

  await saveActivity(user.id, null, null, 'voice', conversationId);
  const welcome = await getStockText('welcome', 1);
  await saveActivityItem(conversationId, 'ai', welcome);

  twiml.say("Voice temporarily disabled. Use the web form.");
  twiml.hangup();

  res.type('text/xml');
  res.send(twiml.toString());
}

async function handleVoiceResponse(req, res) {
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say("Voice temporarily disabled. Use the web form.");
  twiml.hangup();
  res.type('text/xml');
  res.send(twiml.toString());
}

async function handleUserInfo(req, res) {
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say("Voice temporarily disabled. Use the web form.");
  twiml.hangup();
  res.type('text/xml');
  res.send(twiml.toString());
}

module.exports = { handleVoice, handleVoiceResponse, handleUserInfo };

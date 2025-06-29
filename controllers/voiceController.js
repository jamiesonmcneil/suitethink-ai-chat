const { generateWelcomeTwiml, generateResponseTwiml, generateErrorTwiml } = require('../services/twimlHandler');
const { saveActivity, saveActivityItem, findOrCreateUserByPhone } = require('../services/dbService');

const handleVoice = async (req, res, { saveActivity, saveActivityItem, findOrCreateUserByPhone, generateWelcomeTwiml }) => {
  const startTime = Date.now();
  try {
    console.log('Voice call:', JSON.stringify(req.body));
    const from = req.body?.From;
    if (!from) throw new Error('Missing From');

    const user = await findOrCreateUserByPhone(from, null, null);
    const activityId = await saveActivity(user.user_id, 'voice', null, user.user_phone_id);
    await saveActivityItem(activityId, 'ai', 'Welcome to Storio Self Storage! How can I help you today?');

    const twiml = await generateWelcomeTwiml(activityId);
    res.type('text/xml').send(twiml.toString());
    console.log('Voice call processed in', Date.now() - startTime, 'ms');
  } catch (error) {
    console.error('Voice call error:', { message: error.message, stack: error.stack });
    res.type('text/xml').send(generateErrorTwiml().toString());
  }
};

const handleVoiceResponse = async (req, res, { saveActivityItem, generateResponseTwiml }) => {
  const startTime = Date.now();
  try {
    console.log('Voice response:', JSON.stringify(req.body));
    const speech = req.body?.SpeechResult || '';
    const activityId = req.query.activityId || req.body?.activityId;
    if (!activityId || isNaN(parseInt(activityId))) throw new Error('Invalid activityId');
    if (!speech) {
      const twiml = generateResponseTwiml('I didn’t hear anything. Please try again.', activityId, true);
      res.type('text/xml').send(twiml.toString());
      return;
    }

    await saveActivityItem(activityId, 'user', speech);
    const twiml = await generateResponseTwiml(speech, activityId);
    res.type('text/xml').send(twiml.toString());
    console.log('Voice response processed in', Date.now() - startTime, 'ms');
  } catch (error) {
    console.error('Voice response error:', { message: error.message, stack: error.stack });
    res.type('text/xml').send(generateErrorTwiml().toString());
  }
};

const handleUserInfo = async (req, res) => {
  res.type('text/xml').send(generateErrorTwiml('User info collection not supported.').toString());
};

module.exports = {
  handleVoice: (req, res) => handleVoice(req, res, { saveActivity, saveActivityItem, findOrCreateUserByPhone, generateWelcomeTwiml }),
  handleVoiceResponse: (req, res) => handleVoiceResponse(req, res, { saveActivityItem, generateResponseTwiml }),
  handleUserInfo
};

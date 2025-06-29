const express = require('express');
const { handleVoice, handleVoiceResponse, handleUserInfo } = require('../controllers/voiceController');
const { generateFinalResponseTwiml } = require('../services/twimlHandler');

const router = express.Router();
const validateRequest = (req, res, next) => {
  if (!req.body) {
    console.error(`Missing request body in ${req.path}`);
    return res.status(400).send('Bad Request: Missing request body');
  }
  next();
};

router.post('/', validateRequest, handleVoice);
router.post('/response', validateRequest, handleVoiceResponse);
router.post('/final-response', validateRequest, async (req, res) => {
  const startTime = Date.now();
  try {
    console.log('Final response:', JSON.stringify(req.body));
    const speech = req.query.speech || req.body?.SpeechResult || '';
    const activityId = req.query.activityId || req.body?.activityId;
    if (!activityId || isNaN(parseInt(activityId))) throw new Error('Invalid activityId');
    if (!speech) throw new Error('Missing speech input');

    const twiml = await generateFinalResponseTwiml(speech, activityId);
    res.type('text/xml').send(twiml.toString());
    console.log('Final response processed in', Date.now() - startTime, 'ms');
  } catch (error) {
    console.error('Final response error:', { message: error.message, stack: error.stack });
    res.type('text/xml').send(generateErrorTwiml().toString());
  }
});
router.post('/user-info', validateRequest, handleUserInfo);

module.exports = router;

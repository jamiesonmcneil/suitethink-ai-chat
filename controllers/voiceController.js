const { VoiceResponse } = require('twilio').twiml;
const { handleVoiceQuery, textToSpeech } = require('../services/voiceService');
const { saveActivity, saveActivityItem, findOrCreateUserByPhone } = require('../services/dbService');
const path = require('path');

async function handleVoice(req, res) {
  const twiml = new VoiceResponse();
  try {
    console.log('Handling voice call:', JSON.stringify(req.body));
    const from = req.body.From;
    const user = await findOrCreateUserByPhone(from, null, null);
    console.log('User found/created:', user);

    const activityId = await saveActivity(user.user_id, 'voice', null, user.user_phone_id);
    const welcome = 'Welcome to Storio Self Storage! How can I help you today?';
    await saveActivityItem(activityId, 'ai', welcome);

    const audioPath = await textToSpeech(welcome);
    console.log('Audio path:', audioPath);
    if (audioPath) {
      const audioUrl = `https://penguin-new-wildly.ngrok-free.app/audio/${path.basename(audioPath)}`;
      console.log('Serving audio:', audioUrl);
      twiml.play(audioUrl);
    } else {
      console.warn('Falling back to Polly for welcome message due to ElevenLabs failure');
      twiml.say({ voice: 'Polly.Joanna' }, welcome);
    }

    twiml.gather({
      input: 'speech',
      action: `/voice/response?activityId=${encodeURIComponent(activityId)}`,
      method: 'POST',
      timeout: 5,
      hints: 'storage unit, vehicle parking, manager, price, location, available',
      speechModel: 'phone_call'
    });

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Voice call error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail
    });
    twiml.say({ voice: 'Polly.Joanna' }, 'Sorry, something went wrong. Please try again or call 907-341-4198.');
    twiml.hangup();
    res.type('text/xml');
    res.send(twiml.toString());
  }
}

async function handleVoiceResponse(req, res) {
  const twiml = new VoiceResponse();
  try {
    console.log('Handling voice response:', JSON.stringify(req.body));
    const speech = req.body.SpeechResult || '';
    const activityId = req.query.activityId || req.body.activityId;
    if (!activityId) {
      console.error('Missing activityId in voice response, generating temporary ID');
      await twiml.say({ voice: 'Polly.Joanna' }, 'Sorry, something went wrong. Please try again or call 907-341-4198.');
      twiml.hangup();
      res.type('text/xml');
      return res.send(twiml.toString());
    }
    await saveActivityItem(activityId, 'user', speech);

    const responseText = await handleVoiceQuery(speech);
    const audioPath = await textToSpeech(responseText);
    console.log('Response audio path:', audioPath);

    if (audioPath) {
      const audioUrl = `https://penguin-new-wildly.ngrok-free.app/audio/${path.basename(audioPath)}`;
      console.log('Serving audio:', audioUrl);
      twiml.play(audioUrl);
    } else {
      console.warn('Falling back to Polly for response due to ElevenLabs failure');
      twiml.say({ voice: 'Polly.Joanna' }, responseText);
    }

    await saveActivityItem(activityId, 'ai', responseText);

    twiml.gather({
      input: 'speech',
      action: `/voice/response?activityId=${encodeURIComponent(activityId)}`,
      method: 'POST',
      timeout: 5,
      hints: 'storage unit, vehicle parking, manager, price, location, available',
      speechModel: 'phone_call'
    });

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Voice response error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail
    });
    twiml.say({ voice: 'Polly.Joanna' }, 'Sorry, something went wrong. Please try again or call 907-341-4198.');
    twiml.hangup();
    res.type('text/xml');
    res.send(twiml.toString());
  }
}

async function handleUserInfo(req, res) {
  const twiml = new VoiceResponse();
  twiml.say({ voice: 'Polly.Joanna' }, 'User information collection is not supported in this version. Please call 907-341-4198.');
  twiml.hangup();
  res.type('text/xml');
  res.send(twiml.toString());
}

module.exports = { handleVoice, handleVoiceResponse, handleUserInfo };

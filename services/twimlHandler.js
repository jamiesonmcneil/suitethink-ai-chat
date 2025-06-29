const { VoiceResponse } = require('twilio').twiml;
const { handleVoiceQuery } = require('./voiceQuery');
const { textToSpeech } = require('./textToSpeech');
const path = require('path');
const fs = require('fs').promises;

const generateWelcomeTwiml = async (activityId) => {
  const twiml = new VoiceResponse();
  const welcome = 'Welcome to Storio Self Storage! How can I help you today?';
  const audioPath = await textToSpeech(welcome);
  if (audioPath) {
    try {
      await fs.access(audioPath);
      twiml.play(`https://penguin-new-wildly.ngrok-free.app/audio/cache/${path.basename(audioPath)}`);
    } catch {
      throw new Error('Failed to access welcome audio');
    }
  } else {
    throw new Error('Failed to generate welcome audio');
  }

  twiml.gather({
    input: 'speech',
    action: `/voice/response?activityId=${encodeURIComponent(activityId)}`,
    method: 'POST',
    timeout: 10,
    hints: 'storage unit, vehicle parking, manager, price, location, available, sizes, hours, climate control',
    speechModel: 'phone_call'
  });

  return twiml;
};

const generateResponseTwiml = async (input, activityId) => {
  const twiml = new VoiceResponse();
  twiml.play(`https://penguin-new-wildly.ngrok-free.app/audio/cache/audio-ba45338e090a8df6e8da571c2ce31083.mp3`); // Cached "Give me a second"
  twiml.redirect(`/voice/final-response?activityId=${encodeURIComponent(activityId)}&speech=${encodeURIComponent(input || 'I didn’t hear anything. Please try again.')}`);
  return twiml;
};

const generateFinalResponseTwiml = async (input, activityId) => {
  const twiml = new VoiceResponse();
  const responseText = input.startsWith('I didn’t hear') ? input : await handleVoiceQuery(input, activityId);
  const audioPath = await textToSpeech(responseText);
  if (audioPath) {
    try {
      await fs.access(audioPath);
      twiml.play(`https://penguin-new-wildly.ngrok-free.app/audio/cache/${path.basename(audioPath)}`);
    } catch {
      throw new Error('Failed to access response audio');
    }
  } else {
    throw new Error('Failed to generate response audio');
  }

  twiml.gather({
    input: 'speech',
    action: `/voice/response?activityId=${encodeURIComponent(activityId)}`,
    method: 'POST',
    timeout: 10,
    hints: 'storage unit, vehicle parking, manager, price, location, available, sizes, hours, climate control',
    speechModel: 'phone_call'
  });

  return twiml;
};

const generateErrorTwiml = (message = 'Sorry, something went wrong. Please try again or call 907-341-4198.') => {
  const twiml = new VoiceResponse();
  twiml.play(`https://penguin-new-wildly.ngrok-free.app/audio/cache/audio-e760d4102d20c14e8e5b97b96d4787b4.mp3`); // Cached error audio
  twiml.hangup();
  return twiml;
};

module.exports = { generateWelcomeTwiml, generateResponseTwiml, generateFinalResponseTwiml, generateErrorTwiml };

const { ElevenLabsClient } = require('elevenlabs');
console.log('ELEVENLABS_API_KEY in voiceService:', process.env.ELEVENLABS_API_KEY);
const elevenLabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

async function textToSpeech(text) {
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  const audio = await elevenLabs.generate({
    text,
    voice: voiceId,
    model: 'eleven_multilingual_v2',
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
    },
  });
  return audio;
}

module.exports = { textToSpeech };

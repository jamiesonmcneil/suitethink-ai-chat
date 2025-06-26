const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const Queue = require('promise-queue');
require('dotenv').config({ path: './.env' });

const queue = new Queue(1, Infinity);

async function testAudio() {
  return queue.add(async () => {
    let retries = 3;
    let delay = 1000;
    while (retries > 0) {
      try {
        console.log('Using API key:', process.env.ELEVENLABS_API_KEY);
        console.log('Using voice ID:', process.env.ELEVENLABS_VOICE_ID);
        const response = await axios({
          method: 'POST',
          url: `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
          data: {
            text: 'Test audio for Storio Self Storage',
            model_id: 'eleven_multilingual_v2',
            voice_settings: { stability: 0.5, similarity_boost: 0.75 }
          },
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg'
          },
          responseType: 'arraybuffer'
        });
        const audioPath = path.join('/tmp', `test-audio-${Date.now()}.mp3`);
        await fs.writeFile(audioPath, Buffer.from(response.data));
        console.log('Audio saved to:', audioPath);
        return;
      } catch (error) {
        console.error('Test audio error:', {
          message: error.message,
          stack: error.stack,
          status: error.response?.status,
          response: error.response?.data,
          retriesLeft: retries - 1
        });
        if (error.response?.status === 429 || error.response?.data?.detail?.status === 'too_many_concurrent_requests') {
          retries--;
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
        } else {
          return;
        }
      }
    }
    console.warn('Exhausted retries for ElevenLabs');
  });
}

testAudio();

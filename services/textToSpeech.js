const fs = require('fs').promises;
const path = require('path');
const Queue = require('promise-queue');
const axios = require('axios');
require('dotenv').config({ path: './.env' });

const queue = new Queue(1, Infinity);

const textToSpeech = async (text) => {
  return queue.add(async () => {
    const startTime = Date.now();
    const cacheDir = '/tmp/cache';
    await fs.mkdir(cacheDir, { recursive: true });
    const cacheKey = require('crypto').createHash('md5').update(text).digest('hex');
    const cachePath = path.join(cacheDir, `audio-${cacheKey}.mp3`);
    try {
      await fs.access(cachePath);
      console.log('Using cached audio:', cachePath);
      return cachePath;
    } catch {
      let retries = 3;
      let delay = 1000;
      while (retries > 0) {
        try {
          console.log('Generating audio:', text);
          const ttsStart = Date.now();
          const response = await axios({
            method: 'POST',
            url: `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
            data: { text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.75 } },
            headers: {
              'xi-api-key': process.env.ELEVENLABS_API_KEY,
              'Content-Type': 'application/json',
              'Accept': 'audio/mpeg'
            },
            responseType: 'arraybuffer'
          });
          console.log('TTS completed in', Date.now() - ttsStart, 'ms');
          const audioPath = path.join('/tmp/cache', `audio-${Date.now()}.mp3`);
          await fs.writeFile(audioPath, Buffer.from(response.data));
          await fs.copyFile(audioPath, cachePath);
          console.log('Audio saved:', audioPath, 'cached:', cachePath);
          return audioPath;
        } catch (error) {
          console.error('TTS error:', { message: error.message, status: error.response?.status });
          if (error.response?.status === 429) {
            retries--;
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
          } else {
            throw error;
          }
        }
      }
      throw new Error('Exhausted retries for ElevenLabs');
    }
  });
};

module.exports = { textToSpeech };

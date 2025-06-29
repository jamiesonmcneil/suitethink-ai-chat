const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
const Queue = require('promise-queue');
const { queryAI } = require('./queryService');
require('dotenv').config({ path: './.env' });

console.log('Loaded voiceService.js at', new Date().toISOString());

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

const queue = new Queue(1, Infinity);

async function handleVoiceQuery(input, activityId) {
  let client;
  const startTime = Date.now();
  try {
    if (!input) {
      console.log('Empty input received, returning null response');
      return { responseText: null, audioPath: null };
    }
    console.log('Starting voice query processing:', input);
    client = await pool.connect();
    console.log('Database connected in', Date.now() - startTime, 'ms');

    // Fetch conversation history from user_activity_item
    const historyStart = Date.now();
    const historyResult = await client.query(
      'SELECT sender, message_text FROM comms.user_activity_item WHERE fk_user_activity_id = $1 AND is_active = true ORDER BY create_date',
      [activityId]
    );
    console.log('Conversation history fetched in', Date.now() - historyStart, 'ms');
    const conversationHistory = historyResult.rows.map(row => ({
      role: row.sender.toLowerCase() === 'user' ? 'user' : 'assistant',
      content: row.message_text
    }));

    const responseText = await queryAI(input, conversationHistory, {}, 'voice');
    const audioPath = await textToSpeech(responseText);
    return { responseText, audioPath };
  } catch (error) {
    console.error('Voice query error:', { message: error.message, stack: error.stack });
    const responseText = 'Sorry, I couldn’t process your request. Please try again or call 907-341-4198.';
    const audioPath = await textToSpeech(responseText);
    return { responseText, audioPath };
  } finally {
    if (client) client.release();
    console.log('Voice query completed in', Date.now() - startTime, 'ms');
  }
}

async function textToSpeech(text) {
  return queue.add(async () => {
    const startTime = Date.now();
    // Check for cached audio
    const cacheDir = '/tmp/cache';
    await fs.mkdir(cacheDir, { recursive: true });
    const cacheKey = require('crypto').createHash('md5').update(text).digest('hex');
    const cachePath = path.join(cacheDir, `audio-${cacheKey}.mp3`);
    try {
      await fs.access(cachePath);
      console.log('Using cached audio:', cachePath);
      return cachePath;
    } catch {
      // No cache, generate new audio
      let retries = 3;
      let delay = 1000;
      while (retries > 0) {
        try {
          console.log('Generating audio for text:', text, 'with voice ID:', process.env.ELEVENLABS_VOICE_ID);
          const ttsStart = Date.now();
          const response = await require('axios')({
            method: 'POST',
            url: `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
            data: {
              text,
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
          console.log('TTS API call completed in', Date.now() - ttsStart, 'ms');
          const audioPath = path.join('/tmp/cache', `audio-${Date.now()}.mp3`);
          await fs.writeFile(audioPath, Buffer.from(response.data));
          await fs.copyFile(audioPath, cachePath);
          console.log('Audio saved to:', audioPath, 'and cached to:', cachePath, 'in', Date.now() - startTime, 'ms');
          return audioPath;
        } catch (error) {
          console.error('Text-to-speech error:', { 
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
            console.warn('Falling back to Polly due to TTS error');
            return null;
          }
        }
      }
      console.warn('Exhausted retries for ElevenLabs, falling back to Polly');
      return null;
    }
  });
}

module.exports = { handleVoiceQuery, textToSpeech };

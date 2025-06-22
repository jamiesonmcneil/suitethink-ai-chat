require('dotenv').config();
const { ElevenLabsClient } = require('elevenlabs');

async function testAPI() {
  try {
    const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
    const voices = await client.voices.getAll();
    console.log('API Key valid. Available voices:', voices);
  } catch (error) {
    console.error('API Key test failed:', error.message);
  }
}

testAPI();

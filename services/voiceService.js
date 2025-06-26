const { Pool } = require('pg');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const Queue = require('promise-queue');
require('dotenv').config({ path: './.env' });

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20, // Optimize for scalability
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

const queue = new Queue(1, Infinity); // Limit to 1 concurrent call

async function handleVoiceQuery(input) {
  let client;
  const startTime = Date.now();
  try {
    console.log('Starting voice query processing:', input);
    client = await pool.connect();
    console.log('Database connected in', Date.now() - startTime, 'ms');

    const inputLower = input.toLowerCase();
    const dataResult = await client.query(
      'SELECT data FROM comms.scraped_data_frequent WHERE fk_property_id = $1 ORDER BY create_date DESC LIMIT 1',
      [1]
    );
    console.log('Scraped data fetched in', Date.now() - startTime, 'ms');

    if (!dataResult.rows[0]?.data) {
      return 'No unit data available. Please try again or call 907-341-4198.';
    }
    const data = dataResult.rows[0].data;

    if (inputLower.includes('how many units') || inputLower.includes('available')) {
      const available = data.units.filter(unit => unit.availability).length;
      return available > 0 ? `${available} units are available.` : 'No units available.';
    } else if (inputLower.includes('cheapest') || inputLower.includes('price')) {
      const available = data.units.filter(unit => unit.availability);
      const cheapest = available.reduce((min, unit) => !min || parseFloat(unit.price.replace('$', '')) < parseFloat(min.price.replace('$', '')) ? unit : min, null);
      return cheapest ? `Our cheapest unit is ${cheapest.size} at ${cheapest.price}.` : 'No units available.';
    } else if (inputLower.includes('largest') || inputLower.includes('biggest') || inputLower.includes('dimensions')) {
      const available = data.units.filter(unit => unit.availability);
      const largest = available.reduce((max, unit) => {
        const size = parseFloat(unit.size.replace(/[^\d.]/g, '')) || 0;
        return !max || size > parseFloat(max.size.replace(/[^\d.]/g, '')) ? unit : max;
      }, null);
      return largest ? `The largest unit is ${largest.size}${largest.height ? ', ' + largest.height + ' high' : ''} at ${largest.price}.` : 'No units available.';
    } else if (inputLower.includes('location') || inputLower.includes('address')) {
      return data.locations[0]?.address || '610 W Fireweed Ln, Anchorage, AK 99503.';
    } else if (inputLower.includes('manager')) {
      return 'Please call our manager at 907-341-4198.';
    } else if (inputLower.includes('parking')) {
      const parkingResult = await client.query(
        'SELECT data->>\'parkingInfo\' AS parkingInfo FROM comms.scraped_data_infrequent WHERE fk_property_id = $1 ORDER BY create_date DESC LIMIT 1',
        [1]
      );
      console.log('Parking data fetched in', Date.now() - startTime, 'ms');
      const parkingInfo = parkingResult.rows[0]?.parkingInfo || 'Parking is available for vehicles; call 907-341-4198 for pricing and details.';
      return parkingInfo;
    } else if (inputLower.includes('storage type')) {
      const storageTypeResult = await client.query(
        'SELECT data->>\'storageTypes\' AS storageTypes FROM comms.scraped_data_infrequent WHERE fk_property_id = $1 ORDER BY create_date DESC LIMIT 1',
        [1]
      );
      console.log('Storage types fetched in', Date.now() - startTime, 'ms');
      const storageTypes = storageTypeResult.rows[0]?.storageTypes ? JSON.parse(storageTypeResult.rows[0].storageTypes).join(', ') : 'Indoor heated storage, vehicle storage.';
      return storageTypes;
    } else if (inputLower.includes('rent') || inputLower.includes('link')) {
      return 'You can rent a unit at storio.com or call 907-341-4198.';
    } else {
      return 'Sorry, I didn’t understand. You can ask about available units, prices, largest unit, location, parking, or storage types.';
    }
  } catch (error) {
    console.error('Voice query error:', { message: error.message, stack: error.stack });
    return 'Sorry, I couldn’t process your request. Please try again or call 907-341-4198.';
  } finally {
    if (client) client.release();
    console.log('Voice query completed in', Date.now() - startTime, 'ms');
  }
}

async function textToSpeech(text) {
  return queue.add(async () => {
    const startTime = Date.now();
    let retries = 3;
    let delay = 1000;
    while (retries > 0) {
      try {
        console.log('Generating audio for text:', text, 'with voice ID:', process.env.ELEVENLABS_VOICE_ID);
        const response = await axios({
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
        console.log('TTS API call completed in', Date.now() - startTime, 'ms');
        const audioPath = path.join('/tmp', `audio-${Date.now()}.mp3`);
        await fs.writeFile(audioPath, Buffer.from(response.data));
        console.log('Audio saved to:', audioPath, 'in', Date.now() - startTime, 'ms');
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
  });
}

module.exports = { handleVoiceQuery, textToSpeech };

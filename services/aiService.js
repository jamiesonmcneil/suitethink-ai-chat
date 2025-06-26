const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function queryAI(input, conversationHistory = []) {
  try {
    const inputLower = input.toLowerCase();
    const dataResult = await pool.query(
      'SELECT data FROM comms.scraped_data_frequent WHERE fk_property_id = $1 ORDER BY create_date DESC LIMIT 1',
      [1]
    );
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
      return cheapest ? `Our cheapest unit is ${cheapest.price}.` : 'No units available.';
    } else if (inputLower.includes('location') || inputLower.includes('address')) {
      return data.locations[0]?.address || '610 W Fireweed Ln, Anchorage, AK 99503.';
    } else if (inputLower.includes('manager')) {
      return 'Please call our manager at 907-341-4198.';
    } else if (inputLower.includes('parking')) {
      const parkingResult = await pool.query(
        'SELECT data->>\'parkingInfo\' AS parkingInfo FROM comms.scraped_data_infrequent WHERE fk_property_id = $1 ORDER BY create_date DESC LIMIT 1',
        [1]
      );
      const parkingInfo = parkingResult.rows[0]?.parkingInfo || 'No parking information available.';
      return `${parkingInfo} Call 907-341-4198 for details.`;
    } else if (inputLower.includes('storage type')) {
      const storageTypeResult = await pool.query(
        'SELECT data->>\'storageTypes\' AS storageTypes FROM comms.scraped_data_infrequent WHERE fk_property_id = $1 ORDER BY create_date DESC LIMIT 1',
        [1]
      );
      const storageTypes = storageTypeResult.rows[0]?.storageTypes ? JSON.parse(storageTypeResult.rows[0].storageTypes).join(', ') : 'No storage types available.';
      return storageTypes;
    } else if (inputLower.includes('rent') || inputLower.includes('link')) {
      return 'You can rent a unit at storio.com or call 907-341-4198.';
    } else if (process.env.XAI_API_KEY) {
      console.log('Using Grok 3 API for query:', input);
      const context = JSON.stringify({
        scrapedData: data,
        additionalInfo: {
          facility: 'Storio Self Storage, 610 W Fireweed Ln, Anchorage, AK 99503',
          contact: '907-341-4198'
        }
      });

      const messages = [
        {
          role: 'system',
          content: `You are a storage facility assistant for Storio Self Storage. Use this context: ${context}. Respond concisely, naturally, and voice-friendly (max 2-3 sentences). Use newlines for readability. If unable to answer, return 'Sorry, I didn’t understand. You can ask about available units, prices, location, or parking.'`
        },
        ...conversationHistory,
        { role: 'user', content: input }
      ];

      const response = await axios.post(
        'https://api.x.ai/v1/chat/completions',
        {
          model: 'grok-3',
          messages,
          max_tokens: 150,
          temperature: 0.6
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content.trim();
    } else {
      return 'Sorry, I didn’t understand. You can ask about available units, prices, location, or parking.';
    }
  } catch (error) {
    console.error('Error in queryAI:', error.stack);
    return 'Sorry, I didn’t understand. You can ask about available units, prices, location, or parking.';
  }
}

module.exports = { queryAI };

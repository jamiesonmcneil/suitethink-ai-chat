const axios = require('axios');
const { getScrapedData, getStockText, formatPrice } = require('./storageService');
const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function queryAI(input, conversationHistory = []) {
  try {
    const data = await getScrapedData();
    const inputLower = input.toLowerCase();
    const rules = await pool.query(
      'SELECT rule_key, rule_value FROM comms.ai_rules WHERE fk_property_id = $1 AND is_active = true AND is_deleted = false',
      [1]
    );

    const fallbackData = {
      units: [
        { size: "3.5' x 6.5' (25sf)", price: "$122", availability: true },
        { size: "5' x 7.6' (38sf)", price: "$154", availability: true },
        { size: "6.5' x 15' (100sf)", price: "$300", availability: true }
      ],
      locations: ["610 W Fireweed Ln, Anchorage, AK 99503"],
      storageTypes: ["Indoor Heated Storage", "Vehicle Storage", "Climate-Controlled Storage"],
      storageTips: [
        "Use sturdy boxes and label clearly.",
        "Wrap fragile items in bubble wrap.",
        "Avoid storing food or combustibles.",
        "Place heavy items at the bottom.",
        "Use our free moving truck."
      ],
      parkingInfo: "Indoor vehicle storage for RV, car, boat. Call 907-341-4198."
    };

    const contextData = {
      units: data.units.length > 0 ? data.units : fallbackData.units,
      locations: data.locations.length > 0 ? data.locations : fallbackData.locations,
      storageTypes: data.storageTypes.length > 0 ? data.storageTypes : fallbackData.storageTypes,
      storageTips: data.storageTips.length > 0 ? data.storageTips : fallbackData.storageTips,
      parkingInfo: data.parkingInfo !== 'Contact manager for parking details' ? data.parkingInfo : fallbackData.parkingInfo
    };

    if (inputLower.includes('how many units')) {
      const available = contextData.units.filter(unit => unit.availability).length;
      return `${available} units:\n\n${contextData.units.filter(unit => unit.availability).map(unit => `${unit.size}: ${formatPrice(unit.price)}`).join('\n')}.`;
    }

    if (process.env.XAI_API_KEY) {
      console.log('Using Grok 3 API for query:', input);
      const context = JSON.stringify({
        scrapedData: contextData,
        rules: rules.rows,
        additionalInfo: {
          facility: 'Storio Self Storage, 610 W Fireweed Ln, Anchorage, AK 99503',
          unitSizes: '3.5x6.5 (25sf) to 6.5x15 (100sf)',
          features: 'Indoor heated storage, vehicle storage, 24/7 surveillance, gate access, heated loading bay, month-to-month rentals',
          contact: '907-341-4198',
          hours: '6:00am-10:00pm daily'
        }
      });

      const messages = [
        {
          role: 'system',
          content: `You are a storage facility assistant for Storio Self Storage at 610 W Fireweed Ln, Anchorage, AK. Use this context: ${context}. Respond like a human in a concise, natural conversation, referencing the history ${JSON.stringify(conversationHistory)} to avoid repetition or intros like 'Thanks for' or 'I'm glad'. Keep answers short, direct, and voice-friendly (max 2-3 sentences). Use newlines for readability. Clarify ambiguous queries using prior context. If unable to answer, return 'cannot answer'.`
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

      const responseText = response.data.choices[0].message.content.trim();
      return responseText.split('\n').filter(line => line.trim()).join('\n\n');
    }

    if (inputLower.includes('manager')) {
      return await getStockText('manager');
    } else if (inputLower.includes('parking')) {
      return `${contextData.parkingInfo}\n\nCall 907-341-4198.`;
    } else if (inputLower.includes('cheapest')) {
      const available = contextData.units.filter(unit => unit.availability);
      const cheapest = available.reduce((min, unit) => !min || parseFloat(unit.price.replace('$', '').replace(/[^0-9.]/g, '')) < parseFloat(min.price.replace('$', '').replace(/[^0-9.]/g, '')) ? unit : min, null);
      return cheapest ? `${cheapest.size}: ${formatPrice(cheapest.price)}.` : 'No units available.';
    } else if (inputLower.includes('fit') || inputLower.includes('furniture') || inputLower.includes('beds') || inputLower.includes('tables')) {
      const units = contextData.units.filter(unit => unit.availability && unit.size.includes('100')).slice(0, 1);
      return units.length > 0 ? `${units[0].size}: ${formatPrice(units[0].price)}.\n\nRent at https://www.storio.com.` : 'Try a larger unit.';
    } else if (inputLower.includes('policies') || inputLower.includes('cancellation') || inputLower.includes('insurance')) {
      return 'Check https://www.storio.com or call 907-341-4198.';
    } else if (inputLower.includes('rent')) {
      return await getStockText('thank_you');
    } else if (inputLower.includes('size') && inputLower.includes('unit')) {
      const unit = contextData.units[0];
      return unit ? `${unit.size}: ${formatPrice(unit.price)}.` : 'No units available.';
    } else if (inputLower.includes('location')) {
      return `${contextData.locations.join('\n') || '610 W Fireweed Ln, Anchorage, AK 99503.'}`;
    } else if (inputLower.includes('storage type')) {
      return `${contextData.storageTypes.join('\n') || 'Indoor heated, vehicle, climate-controlled.'}`;
    } else if (inputLower.includes('tip')) {
      return `${contextData.storageTips.join('\n') || 'Call 907-341-4198 for tips.'}`;
    } else {
      return await getStockText('welcome');
    }
  } catch (error) {
    console.error('Error in queryAI:', error.stack);
    return 'Error processing request';
  }
}

module.exports = { queryAI };

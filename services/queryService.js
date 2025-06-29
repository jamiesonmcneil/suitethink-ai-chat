const axios = require('axios');
require('dotenv').config({ path: './.env' });

const queryAI = async (input, conversationHistory = [], context = {}, channel = 'chat') => {
  const startTime = Date.now();
  try {
    console.log(`AI query for ${channel}:`, input);
    const scrapedData = context.scrapedData || {};
    if (!scrapedData.frequent && !scrapedData.infrequent) {
      return 'No unit data available. Please try again or call 907-341-4198.';
    }

    const response = await axios.post(
      'https://api.x.ai/v1/chat/completions',
      {
        model: 'grok-3',
        messages: [
          {
            role: 'system',
            content: `You are a storage facility assistant for Storio Self Storage, 610 W Fireweed Ln, Anchorage, AK 99503. Use this context: ${JSON.stringify(scrapedData)}. Respond concisely (1-2 sentences, max 30 words) for voice or detailed for chat. Answer only the current question on unit sizes, prices, availability, location, parking, or storage types. Fallback: 'I don’t have that information. Please try again or call 907-341-4198.'`
          },
          { role: 'user', content: input }
        ],
        max_tokens: channel === 'voice' ? 50 : 300,
        temperature: 0.6
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    ).catch(error => {
      console.error('xAI API error:', error.message);
      return { data: { choices: [{ message: { content: 'I don’t have that information. Please try again or call 907-341-4198.' } }] } };
    });
    console.log('xAI API call completed in', Date.now() - startTime, 'ms');

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error(`AI query error (${channel}):`, { message: error.message, stack: error.stack });
    return 'I don’t have that information. Please try again or call 907-341-4198.';
  }
};

module.exports = { queryAI };

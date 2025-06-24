const { Client } = require('pg');
require('dotenv').config({ path: './.env' });

const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect();

exports.queryAI = async (query, conversationHistory, userData) => {
  try {
    const result = await client.query(
      'SELECT data->\'units\' AS units FROM comms.scraped_data_frequent WHERE is_active = true AND is_deleted = false ORDER BY update_date DESC LIMIT 1'
    );
    const units = result.rows[0]?.units || [];

    if (query.toLowerCase().includes('how many units')) {
      return `We currently have ${units.length} storage units available at our Anchorage location. Would you like details on sizes or pricing?`;
    }

    if (query.toLowerCase().includes('size') || query.toLowerCase().includes('dimensions')) {
      const sizes = units.map(unit => unit.size).join(', ');
      return `Our available units come in the following sizes: ${sizes}. Would you like to know more about pricing or availability?`;
    }

    if (query.toLowerCase().includes('price') || query.toLowerCase().includes('cost')) {
      const pricing = units.map(unit => `${unit.size}: ${unit.price}`).join('\n');
      return `Here are the prices for our available units:\n${pricing}\nWould you like to reserve a unit or get more details?`;
    }

    return 'Sorry, I couldn’t answer that. You can call us at 907-341-4198 for more information.';
  } catch (error) {
    console.error('AI query error:', error);
    return 'Error processing query.';
  }
};

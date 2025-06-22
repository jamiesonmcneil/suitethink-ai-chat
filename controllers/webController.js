const { saveActivity, saveActivityItem, findOrCreateUserByEmail, findOrCreateUserByPhone } = require('../services/dbService');
const { queryAI } = require('../services/aiService');

async function getHome(req, res) {
  try {
    res.sendFile('index.html', { root: 'public' });
  } catch (error) {
    console.error('Error serving home:', error.stack);
    res.status(500).json({ error: 'Server error' });
  }
}

async function handleWebQuery(req, res) {
  const { query, name, email, phone, conversationHistory } = req.body;
  if (!query || (!email && !phone)) {
    console.log('Validation error:', { query, email, phone });
    return res.status(400).json({ error: 'Query and either email or phone required' });
  }

  try {
    const conversationId = Date.now().toString();
    console.log('Creating user:', { email, phone, name });
    let user, userPhoneId, userEmailId;
    if (email) {
      user = await findOrCreateUserByEmail(email, name, phone);
      userEmailId = user.user_email_id;
    } else {
      user = await findOrCreateUserByPhone(phone, name, email);
      userPhoneId = user.user_phone_id;
    }
    console.log('Saving activity for user:', user.user_id);
    const activityId = await saveActivity(user.user_id, userPhoneId, userEmailId, 'web', conversationId);
    console.log('Saving query:', query);
    await saveActivityItem(activityId, 'user', query);

    const response = await queryAI(query, conversationHistory || []);
    console.log('Saving AI response:', response);
    await saveActivityItem(activityId, 'ai', response);
    res.json({ response });
  } catch (error) {
    console.error('Web query error:', error.stack);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getHome, handleWebQuery };

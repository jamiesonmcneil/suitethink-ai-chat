const fs = require('fs').promises;
const path = require('path');

const CONVERSATION_DIR = path.join(__dirname, '../conversations');

async function ensureConversationDir() {
  await fs.mkdir(CONVERSATION_DIR, { recursive: true });
}

async function saveConversation(conversationId, content) {
  await ensureConversationDir();
  const filePath = path.join(CONVERSATION_DIR, `${conversationId}.txt`);
  await fs.appendFile(filePath, content + '\n');
}

module.exports = { saveConversation };

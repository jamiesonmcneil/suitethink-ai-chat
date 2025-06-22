const express = require('express');
const twilio = require('twilio');
const { ElevenLabsClient } = require('elevenlabs');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.urlencoded({ extended: true }));

// Twilio and ElevenLabs clients
const twilioClient = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
const elevenLabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

// Data storage
const DATA_FILE = path.join(__dirname, 'storage_data.txt');
const CONVERSATION_DIR = path.join(__dirname, 'conversations');
const DATA_SOURCE = 'scrape'; // Flag: 'scrape' or 'api'
let storageData = { units: [], parking: {} };

// Ensure conversation directory exists
async function ensureConversationDir() {
  await fs.mkdir(CONVERSATION_DIR, { recursive: true });
}

// Scrape storage data from go.storio.com
async function scrapeStorageData() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://go.storio.com', { waitUntil: 'networkidle2' });

  const data = await page.evaluate(() => {
    const units = [];
    const unitElements = document.querySelectorAll('.unit-listing');
    unitElements.forEach(el => {
      const size = el.querySelector('.unit-size')?.textContent.trim();
      const price = el.querySelector('.unit-price')?.textContent.trim();
      const availability = el.querySelector('.unit-availability')?.textContent.includes('Available');
      if (size && price) {
        units.push({ size, price, availability });
      }
    });
    const parkingInfo = document.querySelector('.parking-info')?.textContent.trim() || 'Contact manager for parking details';
    return { units, parking: parkingInfo };
  });

  await browser.close();
  storageData = data;
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
  console.log('Storage data scraped and saved');
}

// Refresh data every 5 minutes
setInterval(scrapeStorageData, 5 * 60 * 1000);

// Save conversation to text file
async function saveConversation(conversationId, content) {
  await ensureConversationDir();
  const filePath = path.join(CONVERSATION_DIR, `${conversationId}.txt`);
  await fs.appendFile(filePath, content + '\n');
}

// Convert text to speech using ElevenLabs
async function textToSpeech(text) {
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  const audio = await elevenLabs.generate({
    text,
    voice: voiceId,
    model: 'eleven_multilingual_v2',
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
    },
  });
  return audio;
}

// Format price (e.g., $112 -> "one hundred and twelve dollars")
function formatPrice(price) {
  const num = parseFloat(price.replace('$', ''));
  if (isNaN(num)) return price;
  const units = ['', 'thousand', 'million'];
  const digits = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

  function numberToWords(n) {
    if (n === 0) return 'zero';
    if (n < 10) return digits[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      const ten = Math.floor(n / 10);
      const rest = n % 10;
      return rest ? `${tens[ten]} ${digits[rest]}` : tens[ten];
    }
    if (n < 1000) {
      const hundred = Math.floor(n / 100);
      const rest = n % 100;
      return rest ? `${digits[hundred]} hundred ${numberToWords(rest)}` : `${digits[hundred]} hundred`;
    }
    return n.toString(); // Fallback for larger numbers
  }

  return `${numberToWords(Math.floor(num))} dollars`;
}

// Twilio webhook for incoming calls
app.post('/voice', async (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  const conversationId = Date.now().toString();
  await saveConversation(conversationId, `Call started: ${new Date().toISOString()}`);

  // Welcome message
  const welcome = "Welcome to Storio! Are you interested in a storage unit or indoor vehicle parking?";
  await saveConversation(conversationId, `AI: ${welcome}`);
  const welcomeAudio = await textToSpeech(welcome);

  // Start scraping data in parallel
  const scrapePromise = DATA_SOURCE === 'scrape' ? scrapeStorageData() : Promise.resolve();

  twiml.play(welcomeAudio);
  twiml.gather({
    input: 'speech',
    action: '/voice-response',
    timeout: 5,
    hints: 'storage unit, vehicle parking, manager',
    speechModel: 'phone_call',
    conversationId,
  });

  res.type('text/xml');
  res.send(twiml.toString());
});

// Handle voice responses
app.post('/voice-response', async (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  const { SpeechResult, conversationId } = req.body;
  await saveConversation(conversationId, `User: ${SpeechResult}`);

  const input = SpeechResult.toLowerCase();
  let response;

  if (input.includes('manager')) {
    response = "Please call or text our manager at 907-341-4198.";
    const audio = await textToSpeech(response);
    twiml.play(audio);
    twiml.hangup();
  } else if (input.includes('parking')) {
    response = `${storageData.parking}. Contact our manager at +1-254-272-3380 for more details.`;
    const audio = await textToSpeech(response);
    twiml.play(audio);
    twiml.hangup();
  } else if (input.includes('storage')) {
    response = "What size storage unit are you looking for? For example, small, medium, or large.";
    const audio = await textToSpeech(response);
    twiml.play(audio);
    twiml.gather({
      input: 'speech',
      action: '/storage-size',
      timeout: 5,
      hints: 'small, medium, large, furniture, unsure',
      conversationId,
    });
  } else {
    response = "Sorry, I didn't catch that. Are you interested in a storage unit or vehicle parking?";
    const audio = await textToSpeech(response);
    twiml.play(audio);
    twiml.gather({
      input: 'speech',
      action: '/voice-response',
      timeout: 5,
      hints: 'storage unit, vehicle parking, manager',
      conversationId,
    });
  }

  await saveConversation(conversationId, `AI: ${response}`);
  res.type('text/xml');
  res.send(twiml.toString());
});

// Handle storage size response
app.post('/storage-size', async (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  const { SpeechResult, conversationId } = req.body;
  await saveConversation(conversationId, `User: ${SpeechResult}`);

  const input = SpeechResult.toLowerCase();
  let response;

  if (input.includes('unsure') || input.includes('what size') || input.includes('how much space')) {
    response = "Could you tell me what you're storing? For example, furniture like tables or beds may need a wider unit.";
    const audio = await textToSpeech(response);
    twiml.play(audio);
    twiml.gather({
      input: 'speech',
      action: '/storage-items',
      timeout: 5,
      hints: 'furniture, tables, beds, clothes, boxes',
      conversationId,
    });
  } else {
    const sizeFilter = input.includes('small') ? 'small' : input.includes('medium') ? 'medium' : 'large';
    const units = storageData.units
      .filter(unit => unit.availability && unit.size.toLowerCase().includes(sizeFilter))
      .slice(0, 3);

    if (units.length > 0) {
      const unitList = units.map(unit => `a ${unit.size} unit for ${formatPrice(unit.price)}`).join(', ');
      response = `We have ${unitList} available. Would you like to rent one? I can send you a link to our website.`;
      const audio = await textToSpeech(response);
      twiml.play(audio);
      twiml.gather({
        input: 'speech',
        action: '/rent-unit',
        timeout: 5,
        hints: 'yes, no, link',
        conversationId,
      });
    } else {
      response = "Sorry, we don't have any units available in that size. Would you like to try a different size?";
      const audio = await textToSpeech(response);
      twiml.play(audio);
      twiml.gather({
        input: 'speech',
        action: '/storage-size',
        timeout: 5,
        hints: 'small, medium, large',
        conversationId,
      });
    }
  }

  await saveConversation(conversationId, `AI: ${response}`);
  res.type('text/xml');
  res.send(twiml.toString());
});

// Handle storage items for sizing
app.post('/storage-items', async (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  const { SpeechResult, conversationId } = req.body;
  await saveConversation(conversationId, `User: ${SpeechResult}`);

  const input = SpeechResult.toLowerCase();
  const needsWide = input.includes('furniture') || input.includes('tables') || input.includes('beds') || input.includes('armoires');
  const sizeFilter = needsWide ? 'large' : 'small';
  const units = storageData.units
    .filter(unit => unit.availability && unit.size.toLowerCase().includes(sizeFilter))
    .slice(0, 3);

  const response = units.length > 0
    ? `Based on your items, I recommend ${units.map(unit => `a ${unit.size} unit for ${formatPrice(unit.price)}`).join(', ')}. Would you like to rent one? I can send you a link.`
    : "Sorry, we don't have suitable units available. Would you like to try a different size?";
  const audio = await textToSpeech(response);
  twiml.play(audio);
  twiml.gather({
    input: 'speech',
    action: needsWide ? '/rent-unit' : '/storage-size',
    timeout: 5,
    hints: 'yes, no, link, small, medium, large',
    conversationId,
  });

  await saveConversation(conversationId, `AI: ${response}`);
  res.type('text/xml');
  res.send(twiml.toString());
});

// Handle rent unit response
app.post('/rent-unit', async (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  const { SpeechResult, conversationId } = req.body;
  await saveConversation(conversationId, `User: ${SpeechResult}`);

  const input = SpeechResult.toLowerCase();
  let response;

  if (input.includes('yes') || input.includes('link')) {
    response = "Great! I'll send you a text with the link to rent a unit. Thank you!";
    const audio = await textToSpeech(response);
    twiml.play(audio);
    twiml.hangup();

    // Send SMS with link
    await twilioClient.messages.create({
      body: 'Rent your storage unit here: https://go.storio.com',
      from: '+19072695558',
      to: req.body.From,
    });
  } else {
    response = "Okay, if you change your mind, you can visit go.storio.com. Goodbye!";
    const audio = await textToSpeech(response);
    twiml.play(audio);
    twiml.hangup();
  }

  await saveConversation(conversationId, `AI: ${response}`);
  res.type('text/xml');
  res.send(twiml.toString());
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await ensureConversationDir();
  await scrapeStorageData(); // Initial scrape
});
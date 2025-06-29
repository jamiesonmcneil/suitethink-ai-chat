const cron = require('node-cron');
const { scrapeStorageData } = require('../services/storageService');

cron.schedule('0 0 * * *', async () => {
  console.log('Running daily scrape');
  const data = await scrapeStorageData();
  if (data) {
    console.log('Daily scrape successful');
  } else {
    console.error('Daily scrape failed');
  }
});

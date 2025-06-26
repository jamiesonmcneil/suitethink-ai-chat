const { scrapeStorageData } = require('./services/storageService');

async function runScraper() {
  try {
    console.log('Starting scraper...');
    const data = await scrapeStorageData();
    if (data) {
      console.log('Scraping completed successfully:', JSON.stringify(data, null, 2));
    } else {
      console.error('Scraping failed: No data returned');
    }
  } catch (error) {
    console.error('Scraping error:', error.message, error.stack);
  }
}

runScraper();

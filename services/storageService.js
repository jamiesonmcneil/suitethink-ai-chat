const { Client } = require('pg');
const puppeteer = require('puppeteer');
require('dotenv').config({ path: './.env' });

const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect();

async function scrapeStorageData() {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://www.storioselfstorage.com', { waitUntil: 'networkidle2' });

    const data = await page.evaluate(() => {
      const units = Array.from(document.querySelectorAll('.unit')).map(unit => ({
        size: unit.querySelector('.size')?.textContent || '',
        price: unit.querySelector('.price')?.textContent || '',
        availability: unit.querySelector('.availability')?.textContent.includes('Available')
      }));
      const locations = Array.from(document.querySelectorAll('.location')).map(loc => loc.textContent);
      const storageTypes = Array.from(document.querySelectorAll('.storage-type')).map(type => type.textContent);
      const storageTips = Array.from(document.querySelectorAll('.tip')).map(tip => tip.textContent);
      const parkingInfo = document.querySelector('.parking-info')?.textContent || '';
      return { units, locations, storageTypes, storageTips, parkingInfo };
    });

    await browser.close();

    const rules = await client.query(
      'SELECT rule_key, rule_value FROM comms.ai_rules WHERE is_active = true AND is_deleted = false'
    );
    const frequentKeys = rules.rows
      .filter(rule => rule.rule_value.includes('frequent'))
      .map(rule => rule.rule_key);

    const frequentData = {};
    const infrequentData = {};
    for (const [key, value] of Object.entries(data)) {
      if (frequentKeys.includes(key)) {
        frequentData[key] = value;
      } else {
        infrequentData[key] = value;
      }
    }

    await client.query(
      'INSERT INTO comms.scraped_data_frequent (data, fk_property_id, create_date) VALUES ($1, $2, CURRENT_TIMESTAMP)',
      [frequentData, 1]
    );
    await client.query(
      'INSERT INTO comms.scraped_data_infrequent (data, fk_property_id, create_date) VALUES ($1, $2, CURRENT_TIMESTAMP)',
      [infrequentData, 1]
    );

    console.log('Scraped data stored:', data);
    return data;
  } catch (error) {
    console.error('Scraping error:', error);
    return null;
  }
}

module.exports = { scrapeStorageData };

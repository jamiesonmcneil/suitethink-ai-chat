const { Pool } = require('pg');
const puppeteer = require('puppeteer');
require('dotenv').config({ path: './.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function formatPrice(price) {
  return price.startsWith('$') ? price : `$${price}`;
}

async function scrapeStorageData() {
  let client;
  try {
    client = await pool.connect();
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const targetUrl = 'https://www.storio.com/storage-units/alaska/anchorage/storio-self-storage-346012/';
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    const finalUrl = page.url();
    console.log('Scraping URL:', finalUrl);

    await page.waitForSelector('.storage-units', { timeout: 30000 });

    const data = await page.evaluate(() => {
      const units = Array.from(document.querySelectorAll('.storage-units .card-body')).map(unit => ({
        size: unit.querySelector('.unit-size .bold')?.textContent.trim() || '',
        price: unit.querySelector('.storage-detail-prices .price')?.textContent.trim() || '',
        availability: unit.textContent.toLowerCase().includes('select') || 
                      unit.textContent.toLowerCase().includes('available') || 
                      unit.textContent.toLowerCase().includes('left') || true,
        description: unit.querySelector('.amenities div')?.textContent.trim() || ''
      }));
      const locations = [{
        address: document.querySelector('.facility-address')?.textContent.trim() || '610 W Fireweed Ln, Anchorage, AK 99503',
        city: 'Anchorage',
        state: 'AK',
        zip: '99503'
      }];
      const storageTypes = Array.from(document.querySelectorAll('.amenity-container .amenity-desc span'))
        .map(type => type.textContent.trim())
        .filter(type => type.includes('Storage'));
      const storageTips = [];
      const parkingInfo = Array.from(document.querySelectorAll('.amenity-container .amenity-desc span'))
        .some(span => span.textContent.includes('RV, Car, Boat Storage'))
        ? 'Indoor vehicle storage available, including RV, car, and boat storage'
        : 'No parking info available';

      return { units, locations, storageTypes, storageTips, parkingInfo };
    });

    await browser.close();

    if (!data.units.length && !data.locations.length && !data.storageTypes.length && !data.storageTips.length && !data.parkingInfo) {
      console.warn('No data scraped; selectors may be incorrect');
    } else {
      console.log('Scraped data:', JSON.stringify(data, null, 2));
    }

    const rules = await client.query(
      'SELECT rule_key, rule_value FROM comms.ai_rules WHERE is_active = true AND is_deleted = false'
    );
    const frequentKeys = rules.rows
      .filter(rule => rule.rule_value.toLowerCase().includes('frequent'))
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
      [JSON.stringify(frequentData), 1]
    );
    await client.query(
      'INSERT INTO comms.scraped_data_infrequent (data, fk_property_id, create_date) VALUES ($1, $2, CURRENT_TIMESTAMP)',
      [JSON.stringify(infrequentData), 1]
    );

    console.log('Scraped data stored:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Scraping error:', error.message, error.stack);
    return null;
  } finally {
    if (client) client.release();
  }
}

module.exports = { scrapeStorageData, formatPrice };

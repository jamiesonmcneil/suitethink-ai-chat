const puppeteer = require('puppeteer');
const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });
console.log('DATABASE_URL:', process.env.DATABASE_URL);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function scrapeStorageData() {
  try {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const properties = await pool.query('SELECT id, scrape_url FROM comms.property WHERE is_active = true AND is_deleted = false');
    console.log('Properties to scrape:', properties.rows);

    for (const property of properties.rows) {
      const scrapedData = { units: [], locations: [], storageTypes: [], storageTips: [], parkingInfo: 'Contact manager for parking details at 907-341-4198' };
      const visitedUrls = new Set();
      const urlsToVisit = [property.scrape_url];
      const maxCrawl = 50;
      const maxParallel = 3; // Parallel page limit

      console.log('Scraping URL:', property.scrape_url);

      while (urlsToVisit.length > 0) {
        const batch = urlsToVisit.splice(0, maxParallel);
        const pages = await Promise.all(batch.map(async () => {
          const page = await browser.newPage();
          return { page, url: batch.shift() };
        }));

        await Promise.all(pages.map(async ({ page, url }) => {
          if (visitedUrls.has(url) || !url.startsWith(property.scrape_url) || url.includes('#')) {
            await page.close();
            return;
          }
          visitedUrls.add(url);

          let attempts = 0;
          const maxAttempts = 3;
          while (attempts < maxAttempts) {
            try {
              await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
              break;
            } catch (error) {
              attempts++;
              console.log(`Navigation attempt ${attempts} failed for ${url}:`, error.message);
              if (attempts === maxAttempts) {
                console.log(`Skipping ${url} after max attempts`);
                await page.close();
                return;
              }
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }

          await page.waitForSelector('body', { timeout: 30000 }).catch(() => console.log(`No body selector found for ${url}`));

          await page.evaluate(() => {
            const loadMore = document.querySelector('button[class*="load-more"], a[class*="load-more"], [data-load-more], button[class*="show-more"]');
            if (loadMore) loadMore.click();
          });
          await new Promise(resolve => setTimeout(resolve, 2000));

          const pageData = await page.evaluate(() => {
            const units = [];
            const unitElements = document.querySelectorAll('.unit-card, .unit-listing, .unit-item, .pricing-card, .storage-option, [data-unit], .unit-details, [data-id*="unit"], .unit-container');
            unitElements.forEach(el => {
              const size = el.querySelector('.unit-size, [data-unit-size], .size-text, h3, h4, .unit-title, .unit-dimensions')?.textContent.trim();
              const price = el.querySelector('.unit-price, [data-unit-price], .price-text, .cost, .unit-cost')?.textContent.trim();
              const availability = el.querySelector('.unit-availability, [data-unit-status], .status-text, .availability-text, .unit-status')?.textContent.toLowerCase().includes('available') || !el.querySelector('.unavailable, [data-unavailable]');
              if (size && price && size !== 'More Sizes See all sizes') {
                units.push({ size, price, availability });
              }
            });

            const locations = Array.from(document.querySelectorAll('.location-details, .facility-address, [itemprop="address"], address, .contact-info, .location-info, .facility-info')).map(el => el.textContent.trim()).filter(loc => loc && loc.includes('610 W Fireweed Ln'));
            const storageTypes = Array.from(document.querySelectorAll('.storage-type, [data-storage-type], .unit-type, .storage-option-type, .storage-category')).map(el => el.textContent.trim()).filter(type => type && !type.includes('Overview') && !type.includes('Terms'));
            const storageTips = Array.from(document.querySelectorAll('.tip-card, .tip-item, [data-storage-tip], .tip-content, .storage-tips, .tip-text')).map(el => el.textContent.trim()).filter(tip => tip && !tip.includes('Submit'));
            const parkingInfo = document.querySelector('.parking-info, .parking-details, .facility-info, .vehicle-storage, [data-parking]')?.textContent.trim() || 'Contact manager for parking details at 907-341-4198';

            const links = Array.from(document.querySelectorAll('a[href]')).map(a => a.href).filter(href => href.startsWith('https://www.storio.com') && !href.includes('#'));

            return { units, locations, storageTypes, storageTips, parkingInfo, links };
          });

          scrapedData.units = [...new Set([...scrapedData.units, ...pageData.units])];
          scrapedData.locations = [...new Set([...scrapedData.locations, ...pageData.locations])];
          scrapedData.storageTypes = [...new Set([...scrapedData.storageTypes, ...pageData.storageTypes])];
          scrapedData.storageTips = [...new Set([...scrapedData.storageTips, ...pageData.storageTips])];
          if (pageData.parkingInfo !== 'Contact manager for parking details at 907-341-4198') {
            scrapedData.parkingInfo = pageData.parkingInfo;
          }

          pageData.links.forEach(link => {
            if (!visitedUrls.has(link) && !urlsToVisit.includes(link)) {
              urlsToVisit.push(link);
            }
          });

          console.log(`Processed ${url}, found ${pageData.units.length} units, ${pageData.locations.length} locations, ${pageData.storageTypes.length} types, ${pageData.storageTips.length} tips`);
          await page.close();
        }));
      }

      // Validate scrape completeness
      if (scrapedData.units.length === 0 || scrapedData.storageTypes.length === 0 || scrapedData.storageTips.length === 0) {
        console.log('Incomplete scrape, preserving existing data');
        await browser.close();
        return;
      }

      console.log('Final scraped data:', JSON.stringify(scrapedData, null, 2));

      // Update or insert the latest record
      await pool.query(
        'UPDATE comms.scraped_data SET is_active = false WHERE fk_property_id = $1 AND is_active = true',
        [property.id]
      );
      await pool.query(
        'INSERT INTO comms.scraped_data (id, uuid, fk_property_id, data, is_active, is_deleted, create_date, update_date, fk_user_id_updated) VALUES (DEFAULT, DEFAULT, $1, $2, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)',
        [property.id, scrapedData]
      );
    }

    await browser.close();
    console.log('Data scraped and saved');
  } catch (error) {
    console.error('Scraping error:', error.stack);
    // Preserve existing data
  }
}

async function getScrapedData() {
  try {
    const result = await pool.query(
      'SELECT data FROM comms.scraped_data WHERE fk_property_id = $1 AND is_active = true AND is_deleted = false ORDER BY create_date DESC LIMIT 1',
      [1]
    );
    return result.rows[0]?.data || { units: [], locations: [], storageTypes: [], storageTips: [], parkingInfo: 'Contact manager for parking details' };
  } catch (error) {
    console.error('Error retrieving data:', error.stack);
    return { units: [], locations: [], storageTypes: [], storageTips: [], parkingInfo: 'Contact manager for parking details' };
  }
}

async function getStockText(key) {
  try {
    const result = await pool.query(
      'SELECT text_value FROM comms.stock_text WHERE text_key = $1 AND fk_property_id = $2 AND is_active = true AND is_deleted = false',
      [key, 1]
    );
    return result.rows[0]?.text_value || 'Unknown';
  } catch (error) {
    console.error('Error retrieving text:', error.stack);
    return 'Unknown';
  }
}

function formatPrice(price) {
  try {
    const num = parseFloat(price.replace('$', '').replace(/[^0-9.]/g, ''));
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
      return n.toString();
    }

    return `${numberToWords(Math.floor(num))} dollars`;
  } catch (error) {
    console.error('Error in price:', error.stack);
    return price;
  }
}

module.exports = { scrapeStorageData, getScrapedData, getStockText, formatPrice };

if (require.main === module) {
  scrapeStorageData().catch(console.error);
}

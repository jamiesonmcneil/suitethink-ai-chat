const { Pool } = require('pg');
const puppeteer = require('puppeteer');
const axios = require('axios');
require('dotenv').config({ path: './.env' });

console.log('Loaded storageService.js at', new Date().toISOString());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function formatPrice(price) {
  return price.startsWith('$') ? price : `$${price}`;
}

async function scrapeStorageData() {
  let client;
  const startTime = Date.now();
  const targetUrl = 'https://www.storio.com/storage-units/alaska/anchorage/storio-self-storage-346012/';
  let selectors = {
    units: '.storage-units .card-body',
    size: '.unit-size .bold,.dimensions',
    price: '.storage-detail-prices .price',
    availability: 'select,available,left',
    description: '.amenities div',
    address: '.facility-address',
    storageTypes: '.amenity-container .amenity-desc span',
    parkingInfo: '.amenity-container .amenity-desc span',
    hours: '.facility-hours,.hours,.business-hours,.office-hours,.hours-of-operation'
  };
  try {
    console.log('Starting scrape at', new Date().toISOString());
    client = await pool.connect();
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for dynamic content
    await new Promise(resolve => setTimeout(resolve, 5000));
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
      return new Promise(resolve => setTimeout(resolve, 2000));
    });

    const finalUrl = page.url();
    console.log('Scraping URL:', finalUrl);

    // Fetch previous feedback to adjust selectors
    try {
      const feedbackResult = await client.query(
        'SELECT selectors_used, suggested_selectors, query_text FROM comms.scrape_feedback WHERE fk_property_id = $1 AND is_active = true ORDER BY create_date DESC LIMIT 10',
        [1]
      );
      console.log('Feedback fetched:', feedbackResult.rows.length, 'rows');
      feedbackResult.rows.forEach(feedback => {
        if (feedback.suggested_selectors) {
          selectors = { ...selectors, ...feedback.suggested_selectors };
        }
        if (feedback.query_text?.toLowerCase().includes('dimensions') && !selectors.size.includes('dimensions')) {
          selectors.size += ',.dimensions';
        }
        if (feedback.query_text?.toLowerCase().includes('hours') && !selectors.hours) {
          selectors.hours = '.facility-hours,.hours,.business-hours,.office-hours,.hours-of-operation';
        }
      });
    } catch (feedbackError) {
      console.warn('Failed to fetch scrape_feedback:', feedbackError.message);
    }

    await page.waitForSelector(selectors.units, { timeout: 30000 });

    const data = await page.evaluate((sels) => {
      const units = Array.from(document.querySelectorAll(sels.units)).map(unit => ({
        size: unit.querySelector(sels.size)?.textContent.trim() || '',
        price: unit.querySelector(sels.price)?.textContent.trim() || '',
        availability: unit.textContent.toLowerCase().includes(sels.availability.split(',')[0]) || 
                      unit.textContent.toLowerCase().includes(sels.availability.split(',')[1]) || 
                      unit.textContent.toLowerCase().includes(sels.availability.split(',')[2]) || true,
        description: unit.querySelector(sels.description)?.textContent.trim() || ''
      }));
      const locations = [{
        address: document.querySelector(sels.address)?.textContent.trim() || '610 W Fireweed Ln, Anchorage, AK 99503',
        city: 'Anchorage',
        state: 'AK',
        zip: '99503',
        hours: document.querySelector(sels.hours)?.textContent.trim() || 'Not available'
      }];
      const storageTypes = Array.from(document.querySelectorAll(sels.storageTypes))
        .map(type => type.textContent.trim())
        .filter(type => type.includes('Storage'));
      const storageTips = Array.from(document.querySelectorAll('.storage-tips li,.tips li,.facility-tips li')).map(tip => tip.textContent.trim());
      const parkingInfo = Array.from(document.querySelectorAll(sels.parkingInfo))
        .map(span => span.textContent.trim())
        .filter(text => text.includes('RV') || text.includes('Car') || text.includes('Boat'))
        .join('; ') || 'No parking info available';

      return { units, locations, storageTypes, storageTips, parkingInfo };
    }, selectors);

    await browser.close();

    if (!data.units.length && !data.locations.length && !data.storageTypes.length && !data.storageTips.length && !data.parkingInfo) {
      console.warn('No data scraped; selectors may be incorrect');
      const aiSuggestions = await axios.post(
        'https://api.x.ai/v1/chat/completions',
        {
          model: 'grok-3',
          messages: [
            {
              role: 'system',
              content: `Analyze the failed scrape from ${targetUrl} with selectors: ${JSON.stringify(selectors)}. Suggest improved CSS selectors based on typical storage facility website structures. Return a JSON object with suggested selectors.`
            }
          ],
          max_tokens: 200,
          temperature: 0.4
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      ).catch(error => {
        console.error('xAI selector suggestion error:', error.message);
        return { data: { choices: [{ message: { content: JSON.stringify(selectors) } }] } };
      });
      let suggestedSelectors;
      try {
        suggestedSelectors = JSON.parse(aiSuggestions.data.choices[0].message.content.trim());
      } catch (parseError) {
        console.warn('Failed to parse xAI selector suggestions:', parseError.message);
        suggestedSelectors = selectors;
      }
      try {
        await client.query(
          'INSERT INTO comms.scrape_feedback (fk_property_id, scrape_url, selectors_used, suggested_selectors, success, error_message, is_active, create_date, update_date, fk_user_id_updated) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $8)',
          [1, targetUrl, JSON.stringify(selectors), JSON.stringify(suggestedSelectors), false, 'No data scraped', true, 1]
        );
      } catch (feedbackError) {
        console.warn('Failed to log to scrape_feedback:', feedbackError.message);
      }
      return null;
    }

    console.log('Scraped data:', JSON.stringify(data, null, 2));

    // Store feedback
    try {
      await client.query(
        'INSERT INTO comms.scrape_feedback (fk_property_id, scrape_url, selectors_used, success, response_time_ms, is_active, create_date, update_date, fk_user_id_updated) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $7)',
        [1, targetUrl, JSON.stringify(selectors), true, Date.now() - startTime, true, 1]
      );
    } catch (feedbackError) {
      console.warn('Failed to log to scrape_feedback:', feedbackError.message);
    }

    // Use AI to validate and enhance scraped data
    const validationStart = Date.now();
    const validationResponse = await axios.post(
      'https://api.x.ai/v1/chat/completions',
      {
        model: 'grok-3',
        messages: [
          {
            role: 'system',
            content: `You are a data validation assistant for Storio Self Storage. Validate and enhance this scraped data: ${JSON.stringify(data)}. Suggest additional fields or corrections based on typical storage facility data (e.g., hours, climate control, access types, pricing details). Return a JSON object with validated data and suggestions.`
          }
        ],
        max_tokens: 300,
        temperature: 0.4
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    ).catch(error => {
      console.error('xAI validation error:', error.message);
      return { data: { choices: [{ message: { content: JSON.stringify(data) } }] } };
    });
    console.log('Data validation completed in', Date.now() - validationStart, 'ms');

    let enhancedData;
    try {
      enhancedData = JSON.parse(validationResponse.data.choices[0].message.content.trim());
    } catch (parseError) {
      console.warn('Failed to parse xAI response:', parseError.message);
      enhancedData = { validated: data, suggestions: ['Retry validation due to invalid JSON'] };
    }
    console.log('Enhanced data:', JSON.stringify(enhancedData, null, 2));

    const rules = await client.query(
      'SELECT rule_key, rule_value FROM comms.ai_rules WHERE fk_property_id = $1 AND is_active = true AND is_deleted = false',
      [1]
    );
    const frequentKeys = rules.rows
      .filter(rule => rule.rule_value.toLowerCase().includes('frequent'))
      .map(rule => rule.rule_key);

    const frequentData = {};
    const infrequentData = {};
    for (const [key, value] of Object.entries(enhancedData.validated || data)) {
      if (frequentKeys.includes(key)) {
        frequentData[key] = value;
      } else {
        infrequentData[key] = value;
      }
    }

    await client.query(
      'INSERT INTO comms.scraped_data_frequent (data, fk_property_id, create_date, fk_user_id_updated) VALUES ($1, $2, CURRENT_TIMESTAMP, $3)',
      [JSON.stringify(frequentData), 1, 1]
    );
    await client.query(
      'INSERT INTO comms.scraped_data_infrequent (data, fk_property_id, create_date, fk_user_id_updated) VALUES ($1, $2, CURRENT_TIMESTAMP, $3)',
      [JSON.stringify(infrequentData), 1, 1]
    );

    console.log('Scraped data stored:', JSON.stringify(enhancedData.validated || data, null, 2));
    return enhancedData.validated || data;
  } catch (error) {
    console.error('Scraping error:', error.message, error.stack);
    try {
      await client.query(
        'INSERT INTO comms.scrape_feedback (fk_property_id, scrape_url, selectors_used, success, error_message, is_active, create_date, update_date, fk_user_id_updated) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $7)',
        [1, targetUrl, JSON.stringify(selectors), false, error.message, true, 1]
      );
    } catch (feedbackError) {
      console.warn('Failed to log to scrape_feedback:', feedbackError.message);
    }
    return null;
  } finally {
    if (client) client.release();
    console.log('Scraping completed in', Date.now() - startTime, 'ms');
  }
}

module.exports = { scrapeStorageData, formatPrice };

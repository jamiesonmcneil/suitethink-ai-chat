const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://www.storio.com/storage-units/alaska/anchorage/storio-self-storage-346012/', { waitUntil: 'networkidle2' });
  const units = await page.evaluate(() => Array.from(document.querySelectorAll('.storage-units .card-body')).map(el => ({
    size: el.querySelector('.unit-size .bold')?.textContent.trim() || '',
    price: el.querySelector('.storage-detail-prices .price')?.textContent.trim() || ''
  })));
  console.log('Units:', units);
  await browser.close();
})();

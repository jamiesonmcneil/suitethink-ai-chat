const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://www.storio.com/storage-units/alaska/anchorage/storio-self-storage-346012/', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.storage-units', { timeout: 30000 });
  const availability = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.storage-units .card-body')).map(unit => ({
      size: unit.querySelector('.unit-size .bold')?.textContent.trim() || '',
      availabilityLabel: unit.querySelector('.availability-label')?.textContent.trim() || 'None',
      allClasses: Array.from(unit.querySelectorAll('*')).map(el => el.className).filter(cls => cls.includes('avail')),
      textContent: unit.textContent.trim().slice(0, 200) // Truncated for brevity
    }));
  });
  console.log('Availability debug:', JSON.stringify(availability, null, 2));
  await browser.close();
})();

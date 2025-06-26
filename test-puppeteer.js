const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://go.storio.com');
  await new Promise(resolve => setTimeout(resolve, 5000));
  console.log(await page.content());
  await browser.close();
})();

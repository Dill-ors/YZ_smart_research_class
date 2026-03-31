const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('CONSOLE:', msg.type(), msg.text());
  });
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('response', response => {
    if (!response.ok()) {
      console.log('RESPONSE FAILED:', response.url(), response.status());
    }
  });

  try {
    await page.goto('http://localhost:5173/smart_reserch/');
    await new Promise(r => setTimeout(r, 2000));
    const body = await page.content();
    console.log("Body length:", body.length);
    console.log("HTML:", body.substring(0, 1000));
  } catch(e) {
    console.log('Nav error:', e);
  }
  
  await browser.close();
})();

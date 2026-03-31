const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  await page.goto('http://localhost:5173/smart_reserch/login');
  await new Promise(r => setTimeout(r, 1000));
  
  await page.type('#username', 'teacher1');
  await page.type('#password', '123456');
  await page.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 1000));
  const url = page.url();
  console.log("Current URL after login:", url);
  
  await browser.close();
})();

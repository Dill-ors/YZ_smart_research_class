const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5174/smart_reserch/login');
  
  // Login as admin
  await page.waitForSelector('input[name="username"]');
  await page.type('input[name="username"]', 'admin');
  await page.type('input[name="password"]', '123');
  await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }).catch(() => {}),
      page.click('button[type="submit"]')
  ]);
  
  // Wait a bit for auth state to persist
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Go to observations
  await page.goto('http://localhost:5174/smart_reserch/observations');
  await page.waitForSelector('h1');
  
  // Create a new observation
  await page.goto('http://localhost:5174/smart_reserch/observations/new');
  await page.waitForSelector('input');
  
  // Actually, let's just check the APIs via dataService
  await browser.close();
})();

const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.goto('http://localhost:5173/smart_reserch/login');
  await new Promise(r => setTimeout(r, 1000));
  
  await page.evaluate(() => {
    // Intercept fetch
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      console.log('FETCH CALLED WITH:', args[0]);
      const res = await originalFetch(...args);
      return res;
    };
  });
  
  await page.type('#username', 'teacher1');
  await page.type('#password', '123456');
  await page.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();

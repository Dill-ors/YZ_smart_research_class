const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/smart_reserch/login');
  await new Promise(r => setTimeout(r, 1000));
  
  const users = await page.evaluate(async () => {
    try {
      const res = await fetch('/api/users');
      return await res.text();
    } catch(e) {
      return e.message;
    }
  });
  console.log("Response from proxy API:", users);
  
  await browser.close();
})();

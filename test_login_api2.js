const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.goto('http://localhost:5173/smart_reserch/login');
  await new Promise(r => setTimeout(r, 1000));
  
  const users = await page.evaluate(async () => {
    try {
      const res = await fetch('http://localhost:3000/api/users');
      const data = await res.json();
      return data;
    } catch (e) {
      return { error: e.message };
    }
  });
  console.log("Users fetched inside browser:", users);
  
  await browser.close();
})();

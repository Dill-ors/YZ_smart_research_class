const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.goto('http://localhost:5173/smart_reserch/login');
  await new Promise(r => setTimeout(r, 1000));
  
  await page.evaluate(() => {
    window.testApi = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/users');
        console.log("Fetch status:", res.status);
        const data = await res.json();
        console.log("Fetch data length:", data.length);
        return data;
      } catch (e) {
        console.error("Fetch error:", e.message);
        return null;
      }
    };
  });
  
  await page.evaluate(() => window.testApi());
  
  await new Promise(r => setTimeout(r, 1000));
  await browser.close();
})();

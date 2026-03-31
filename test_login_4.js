const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/smart_reserch/login');
  await new Promise(r => setTimeout(r, 1000));
  
  const users = await page.evaluate(async () => {
    try {
      // using the relative path that the vite proxy will handle
      const res = await fetch('/api/users');
      return await res.json();
    } catch(e) {
      return e.message;
    }
  });
  console.log("Users from proxy API:", users);
  
  await browser.close();
})();

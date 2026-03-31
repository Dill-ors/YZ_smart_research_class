const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/smart_reserch/login');
  await new Promise(r => setTimeout(r, 1000));
  
  await page.type('#username', 'teacher1');
  await page.type('#password', '123456');
  await page.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 2000));
  const html = await page.content();
  console.log(html.substring(0, 1000));
  
  const errorText = await page.evaluate(() => {
    const el = document.querySelector('.text-red-500');
    return el ? el.textContent : null;
  });
  console.log("Error on page:", errorText);
  
  await browser.close();
})();

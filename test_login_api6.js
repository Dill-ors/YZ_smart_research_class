const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', async msg => {
    if (msg.text().includes('Login attempt:')) {
      const args = await Promise.all(msg.args().map(a => a.jsonValue()));
      console.log('REACT LOG:', JSON.stringify(args, null, 2));
    }
  });
  
  await page.goto('http://localhost:5173/smart_reserch/login');
  await new Promise(r => setTimeout(r, 1000));
  
  await page.evaluate(() => {
    const userInput = document.querySelector('#username');
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    nativeInputValueSetter.call(userInput, 'teacher1');
    userInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    const passInput = document.querySelector('#password');
    nativeInputValueSetter.call(passInput, '123456');
    passInput.dispatchEvent(new Event('input', { bubbles: true }));
  });
  
  await page.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 2000));
  const errorText = await page.evaluate(() => {
    const el = document.querySelector('.text-red-500');
    return el ? el.textContent : null;
  });
  console.log("Error text is:", errorText);
  console.log("Current URL:", page.url());
  
  await browser.close();
})();
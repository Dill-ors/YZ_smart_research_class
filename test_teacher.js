const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
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
  
  console.log("URL after login:", page.url());
  
  await page.goto('http://localhost:5173/smart_reserch/observations');
  await new Promise(r => setTimeout(r, 2000));
  
  const html = await page.content();
  const surveys = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('tr')).length - 1;
  });
  console.log("Surveys count for teacher1:", surveys);

  // Try to find a link that goes to the edit/fill page
    const surveyRow = await page.$('tr.hover\\:bg-gray-50');
    if (surveyRow) {
      console.log("Found survey row, looking for fill button...");
      const fillButton = await surveyRow.$('button[title="查看/填写"]');
      if (fillButton) {
          console.log("Found fill button, clicking...");
          await page.evaluate(el => el.click(), fillButton);
          await new Promise(r => setTimeout(r, 2000));
          
          console.log("URL after clicking fill:", page.url());
          const html = await page.content();
          console.log("Fill page HTML length:", html.length);
          const buttons = await page.evaluate(() => {
              return Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim());
            });
            console.log("Buttons on fill page:", buttons);
          } else {
        console.log("No fill button found in row.");
      }
    } else {
      console.log("No survey row found.");
    }
  
  await browser.close();
})();

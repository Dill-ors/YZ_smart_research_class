const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('BROWSER LOG:', msg.text());
  });

  page.on('pageerror', err => {
    console.log('PAGE EXCEPTION:', err.toString());
  });

  await page.goto('http://localhost:5173/smart_reserch/login');
  await new Promise(r => setTimeout(r, 1000));
  
  await page.evaluate(() => {
    const un = document.querySelector('#username');
    if (un) un.value = '';
    const pw = document.querySelector('#password');
    if (pw) pw.value = '';
  });
  
  await page.type('#username', 'admin');
  await page.type('#password', '123');
  await page.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 1000));
  
  await page.goto('http://localhost:5173/smart_reserch/reports');
  await new Promise(r => setTimeout(r, 2000));
  
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.textContent && btn.textContent.includes('创建调研问卷')) {
        btn.click();
        return;
      }
    }
  });

  await new Promise(r => setTimeout(r, 2000));

  await page.evaluate(() => {
    const els = document.querySelectorAll('span');
    for (const el of els) {
      if (el.textContent && el.textContent.trim() === '听课记录') {
        el.parentElement.click();
        return;
      }
    }
  });

  await new Promise(r => setTimeout(r, 2000));
  
  const rootHTML = await page.evaluate(() => {
    return document.querySelector('#root').innerHTML;
  });
  
  console.log('Root HTML length:', rootHTML.length);
  if (rootHTML.length < 100) {
    console.log('PAGE IS BLANK!');
  } else {
    console.log('PAGE IS NOT BLANK.');
    const htmlText = await page.evaluate(() => document.body.innerText);
    console.log('PAGE TEXT:', htmlText.substring(0, 500));
  }
  
  await browser.close();
})();

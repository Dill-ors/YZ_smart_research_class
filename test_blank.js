const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
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
  
  // Go to Reports
  await page.goto('http://localhost:5173/smart_reserch/reports');
  await new Promise(r => setTimeout(r, 2000));
  
  // Click "创建调研问卷"
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

  // Click "填空题"
  await page.evaluate(() => {
    const els = document.querySelectorAll('span');
    for (const el of els) {
      if (el.textContent && el.textContent.trim() === '填空题') {
        el.parentElement.click();
        return;
      }
    }
  });

  await new Promise(r => setTimeout(r, 2000));

  // Switch to "预览体验" (Preview Mode)
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.textContent && btn.textContent.includes('问卷原卷')) {
        btn.click();
        return;
      }
    }
  });

  await new Promise(r => setTimeout(r, 2000));
  
  // Count inputs
  const inputs = await page.evaluate(() => {
    return document.querySelectorAll('input[type="text"]').length;
  });
  console.log('Number of text inputs in preview:', inputs);

  await page.screenshot({ path: 'blank_preview.png' });
  
  await browser.close();
})();

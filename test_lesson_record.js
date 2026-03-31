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
  
  // Go to Reports
  await page.goto('http://localhost:5173/smart_reserch/reports');
  await new Promise(r => setTimeout(r, 2000));
  
  // Click "创建调研问卷"
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.textContent && btn.textContent.includes('创建调研问卷')) {
        btn.click();
        console.log('CLICKED Create Survey!');
        return;
      }
    }
  });

  await new Promise(r => setTimeout(r, 2000));

  // Click "听课记录"
  await page.evaluate(() => {
    const els = document.querySelectorAll('span');
    for (const el of els) {
      if (el.textContent && el.textContent.trim() === '听课记录') {
        el.parentElement.click();
        console.log('CLICKED Lesson Record!');
        return;
      }
    }
  });

  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'create_page_after_click.png' });
  
  await browser.close();
})();

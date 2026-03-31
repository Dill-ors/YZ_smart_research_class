const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  // 1. Login as admin
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
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('URL after login:', page.url());
  const errText = await page.evaluate(() => {
    const el = document.querySelector('.text-red-500');
    return el ? el.textContent : null;
  });
  console.log('Login error:', errText);
  
  // 2. Go to Reports and create a survey
  await page.goto('http://localhost:5173/smart_reserch/reports');
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('URL after reports:', page.url());
  const user = await page.evaluate(() => localStorage.getItem('currentUser'));
  console.log('CurrentUser:', user);
  const html = await page.content();
  console.log(html.includes('创建调研问卷'));
  
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const createBtn = buttons.find(b => b.textContent.includes('创建调研问卷'));
    if (createBtn) createBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  await page.waitForSelector('input[placeholder="点击编辑问卷标题"]');
  await page.type('input[placeholder="点击编辑问卷标题"]', 'Test Target Survey');
  
  // Save
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const saveBtn = buttons.find(b => b.textContent.includes('保存'));
    if (saveBtn) saveBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'publish_target.png' });
  
  // Publish
  await page.evaluate(() => {
    window.confirm = () => true;
    const buttons = Array.from(document.querySelectorAll('button[title="发布"]'));
    if (buttons.length > 0) buttons[0].click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Select target: user
  await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    const targetSelect = selects.find(s => s.value === 'all' || s.value === 'role' || s.value === 'school' || s.value === 'user');
    if (targetSelect) {
      targetSelect.value = 'user';
      targetSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Check teacher1 and teacher2
  await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('label'));
    const t1 = labels.find(l => l.textContent.includes('孙老师') || l.textContent.includes('teacher1'));
    const t2 = labels.find(l => l.textContent.includes('张老师') || l.textContent.includes('teacher2'));
    console.log('t1 label:', t1?.textContent);
    console.log('t2 label:', t2?.textContent);
    
    // Fallback: click first two checkboxes if labels not found
    if (!t1 && !t2) {
       console.log('Fallback: clicking first two user checkboxes');
       const cbs = document.querySelectorAll('input[type="checkbox"]');
       if (cbs[0] && !cbs[0].checked) {
           cbs[0].click();
           cbs[0].dispatchEvent(new Event('change', { bubbles: true }));
       }
       if (cbs[1] && !cbs[1].checked) {
           cbs[1].click();
           cbs[1].dispatchEvent(new Event('change', { bubbles: true }));
       }
       return;
    }
    
    if (t1) {
      const cb = t1.querySelector('input');
      if (cb && !cb.checked) {
        cb.click();
        cb.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    if (t2) {
      const cb = t2.querySelector('input');
      if (cb && !cb.checked) {
        cb.click();
        cb.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'publish_target.png' });
  
  // Confirm Publish
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const confirmBtn = buttons.find(b => b.textContent.includes('确认发布'));
    if (confirmBtn) confirmBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  const reportsStr = await page.evaluate(() => localStorage.getItem('survey_system_reports'));
  console.log('Reports after publish:', reportsStr);
  
  // 3. Login as teacher1
  await page.evaluate(() => localStorage.removeItem('currentUser'));
  await page.goto('http://localhost:5173/smart_reserch/login');
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => {
    const un = document.querySelector('#username');
    if (un) un.value = '';
    const pw = document.querySelector('#password');
    if (pw) pw.value = '';
  });
  await page.type('#username', 'teacher1');
  await page.type('#password', '123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));
  
  await page.goto('http://localhost:5173/smart_reserch/reports');
  await new Promise(r => setTimeout(r, 1000));
  
  const t1Surveys = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('tbody tr td:first-child')).map(td => td.textContent.trim());
  });
  console.log('Teacher1 surveys raw:', t1Surveys);
  console.log('Teacher1 surveys:', t1Surveys.filter(s => s.includes('Test Target Survey')));
  
  // 4. Login as teacher2
  await page.evaluate(() => localStorage.removeItem('currentUser'));
  await page.goto('http://localhost:5173/smart_reserch/login');
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => {
    const un = document.querySelector('#username');
    if (un) un.value = '';
    const pw = document.querySelector('#password');
    if (pw) pw.value = '';
  });
  await page.type('#username', 'teacher2');
  await page.type('#password', '123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('URL after teacher2 login:', page.url());
  
  await page.goto('http://localhost:5173/smart_reserch/reports');
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('URL after teacher2 reports:', page.url());
  
  const t2SurveysNew = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('tbody tr td:first-child')).map(td => td.textContent.trim());
  });
  console.log('Teacher2 surveys raw:', t2SurveysNew);
  console.log('Teacher2 surveys:', t2SurveysNew.filter(s => s.includes('Test Target Survey')));
  await new Promise(r => setTimeout(r, 1000));
  
  await browser.close();
})();

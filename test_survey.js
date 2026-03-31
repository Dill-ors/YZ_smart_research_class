const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  // Login as admin to create survey
  await page.goto('http://localhost:5173/smart_reserch/login');
  await new Promise(r => setTimeout(r, 1000));
  
  await page.evaluate(() => {
    const userInput = document.querySelector('#username');
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    nativeInputValueSetter.call(userInput, 'admin');
    userInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    const passInput = document.querySelector('#password');
    nativeInputValueSetter.call(passInput, '123456');
    passInput.dispatchEvent(new Event('input', { bubbles: true }));
  });
  
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("URL after login:", page.url());
  const errorMsg = await page.evaluate(() => {
      const el = document.querySelector('.text-red-500');
      return el ? el.textContent : null;
  });
  console.log("Login error:", errorMsg);
  
  // Go to reports to create survey
  await page.goto('http://localhost:5173/smart_reserch/reports');
  await new Promise(r => setTimeout(r, 2000));
  
  // Click Create
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const createBtn = buttons.find(b => b.textContent.includes('创建调研问卷'));
    if(createBtn) createBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  
  // Add matrix question
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const matrixBtn = buttons.find(b => b.textContent.includes('矩阵题'));
    if(matrixBtn) matrixBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  
  // Save survey
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const saveBtn = buttons.find(b => b.textContent.includes('保存'));
    if(saveBtn) saveBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  
  // Publish survey
  await page.evaluate(() => {
    const trs = Array.from(document.querySelectorAll('tr'));
    if (trs.length > 1) {
        const buttons = Array.from(trs[1].querySelectorAll('button'));
        const pubBtn = buttons.find(b => b.title === '发布');
        if (pubBtn) pubBtn.click();
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  // Override confirm
  await page.evaluate(() => {
    window.confirm = () => true;
  });

  // Confirm publish modal
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const confirmBtn = buttons.find(b => b.textContent.includes('确认发布'));
    if(confirmBtn) confirmBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  
  console.log("URL after save:", page.url());
  
  const trContent = await page.evaluate(() => {
      const trs = Array.from(document.querySelectorAll('tr'));
      return trs.map(tr => tr.innerHTML);
  });
  console.log("First row:", trContent[1]);
  
  // Now fill it out
  await page.evaluate(() => {
    const trs = Array.from(document.querySelectorAll('tr'));
    if (trs.length > 1) {
        const buttons = Array.from(trs[1].querySelectorAll('button'));
        const fillBtn = buttons.find(b => b.title === '填写问卷');
        if (fillBtn) fillBtn.click();
    }
  });
  await new Promise(r => setTimeout(r, 1000));
  
  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim());
  });
  console.log("Buttons on fill page:", buttons.filter(b => b.includes('添加新行')));
  
  await browser.close();
})();

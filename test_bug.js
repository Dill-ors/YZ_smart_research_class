const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('http://localhost:5177');
  
  // Login
  await page.fill('input[type="text"]', 'admin');
  await page.fill('input[type="password"]', 'admin');
  await page.click('button[type="submit"]');
  
  // Go to Reports (问卷中心)
  await page.waitForTimeout(1000);
  await page.click('text=问卷中心');
  
  // Click "创建调研问卷"
  await page.waitForTimeout(1000);
  await page.click('text=创建调研问卷');
  
  // Add a Matrix question
  await page.waitForTimeout(1000);
  await page.click('text=矩阵题');
  
  // Click the Matrix question to select it
  await page.click('text=矩阵题标题');
  
  // Change mode to 'input' in property panel (Assuming there is a select for mode)
  await page.selectOption('select', 'input');
  
  // Publish
  await page.click('text=完成编辑'); // wait, the button is "完成编辑" or something else? Let me check SurveyEngine/index.jsx
  // Oh, wait. In Reports.jsx handleSaveSurvey saves it as draft.
  await page.waitForTimeout(500);
  await page.click('text=完成编辑');
  
  await page.waitForTimeout(1000);
  // Now we are in the list. The new survey is draft.
  // Click publish icon (CheckCircle)
  const rows = await page.locator('tr').all();
  await page.locator('button[title="发布"]').first().click();
  
  // Confirm publish
  await page.waitForTimeout(500);
  await page.click('button:has-text("发布")');
  
  // Go back to list and fill
  await page.waitForTimeout(1000);
  await page.click('button[title="填写问卷"]');
  
  // Fill the cell
  await page.waitForTimeout(1000);
  const textarea = await page.locator('textarea').first();
  await textarea.fill('Hello World!');
  
  // Submit
  await page.click('text=提交问卷');
  
  // Click "查看问卷填写情况"
  await page.waitForTimeout(1000);
  await page.click('text=查看问卷填写情况');
  
  // Check the value of the textarea
  await page.waitForTimeout(1000);
  const value = await page.locator('textarea').first().inputValue();
  console.log("Value in board mode:", value);
  
  await browser.close();
})();
import { chromium } from 'playwright';

async function testSaveTax() {
  console.log('Testing Tax Rule creation...');
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const page = await browser.newPage();

  // Directly navigate to /masters/tax without logging in first (to test automatic auth/token handling)
  console.log('Navigating directly to http://localhost:5173/masters/tax...');
  await page.goto('http://localhost:5173/masters/tax', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Click "Add New Tax"
  console.log('Clicking "Add New Tax"...');
  await page.click('button:has-text("Add New Tax")');

  // Fill the form matching the user screenshot
  console.log('Filling form with user inputs from screenshot...');
  // Tax Group: GST (default)
  // Tax Name: GST 3B
  await page.fill('input[placeholder="e.g. GSTR-1, ITR-1"]', 'GST 3B');
  // Filing Frequency: Quarterly (it's the 2nd select inside the form)
  const selects = page.locator('form select');
  await selects.nth(1).selectOption('Quarterly');
  // Due Date Rule: 11 dec
  await page.fill('input[placeholder="e.g. 11th Next Month, 31st July"]', '11 dec');

  // Click "Save Tax"
  console.log('Submitting "Save Tax" button...');
  await page.click('button:has-text("Save Tax")');

  // Wait for success toast or modal closing
  console.log('Waiting for modal to close and new tax to appear in table...');
  await page.waitForTimeout(2000);

  const hasNewTax = await page.evaluate(() => {
    return document.body.innerText.includes('GST 3B');
  });

  console.log('Was "GST 3B" saved and rendered in the table?', hasNewTax);
  if (!hasNewTax) {
    console.error('FAILED: GST 3B was not found on the page!');
    await browser.close();
    process.exit(1);
  }

  console.log('SUCCESS! Tax rule saved and verified!');
  await browser.close();
}

testSaveTax().catch((err) => {
  console.error('Error during test:', err);
  process.exit(1);
});

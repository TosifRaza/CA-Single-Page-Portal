import { chromium } from 'playwright';

const ARTIFACT_DIR = 'C:/Users/RIZ-PC/.gemini/antigravity/brain/6799a778-c2f6-4d92-bbcd-5669a616ca24';

async function runDemoFlow() {
  console.log('Starting Live Demo Data Simulation...');
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  page.on('dialog', async (dialog) => {
    console.log(`Dialog: ${dialog.message()}`);
    await dialog.accept();
  });

  console.log('1. Navigating to Tax Master...');
  await page.goto('http://localhost:5173/masters/tax', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  console.log('2. Opening "Add New Tax Rule" modal...');
  await page.click('button:has-text("Add New Tax")');
  await page.waitForTimeout(700);

  console.log('3. Filling Section A...');
  await page.fill('input[placeholder="e.g. GSTR-1, GSTR-3B, ITR-1, 24Q"]', 'GSTR-3B (Oct 2026)');
  await page.fill('input[placeholder="e.g. TAX-GST-01"]', 'GSTR3B-OCT26');
  await page.fill('textarea[placeholder="Brief statutory guidelines or filing instructions..."]', 'Monthly summary return of outward & inward supplies and input tax credit (ITC) for October 2026.');

  console.log('4. Filling Section B...');
  const dateInputs = await page.$$('input[type="date"]');
  if (dateInputs.length >= 4) {
    await dateInputs[0].fill('2026-10-01'); // From Date
    await dateInputs[1].fill('2026-10-31'); // To Date
    await dateInputs[2].fill('2026-11-20'); // Original Due Date
    await dateInputs[3].fill('2026-11-28'); // Extended Due Date
  }
  await page.fill('input[placeholder="e.g. Nov 2026, Q3 2026-27"]', 'Oct 2026');

  await page.waitForTimeout(300);
  await page.fill('input[placeholder="e.g. CBIC Notification extending deadline"]', 'CBIC Notification No. 42/2026 due to GSTN portal technical outage.');
  await page.fill('input[placeholder="e.g. Notification No. 42/2026-CT"]', 'Notification No. 42/2026-Central Tax');

  console.log('5. Filling Section C (Linking Client ABC Traders)...');
  const clientSelect = await page.$('select:has(option:has-text("ABC Traders"))');
  if (clientSelect) {
    const options = await clientSelect.$$('option');
    for (const opt of options) {
      const text = await opt.innerText();
      if (text.includes('ABC Traders')) {
        const val = await opt.getAttribute('value');
        if (val) await clientSelect.selectOption(val);
        break;
      }
    }
  }

  // Filing Status: In Progress
  const filingStatusSelect = await page.$('select:has(option:has-text("In Progress"))');
  if (filingStatusSelect) {
    await filingStatusSelect.selectOption('In Progress');
  }

  await page.fill('input[placeholder="e.g. ARN-AA2611260012948"]', 'AA2711260194821');

  console.log('6. Enabling Reconciliation & Entering Amounts...');
  const reconCheckbox = await page.$('input[type="checkbox"]');
  if (reconCheckbox) {
    await reconCheckbox.check();
  }
  await page.waitForTimeout(300);

  const numInputs = await page.$$('input[type="number"]');
  if (numInputs.length >= 2) {
    await numInputs[0].fill('520000'); // Books: ₹5,20,000
    await numInputs[1].fill('485000'); // Portal: ₹4,85,000
  }

  // Priority select: Critical
  const prioritySelect = await page.$('select:has(option:has-text("Critical"))');
  if (prioritySelect) {
    await prioritySelect.selectOption('Critical');
  }

  await page.waitForTimeout(500);

  console.log('7. Capturing filled modal screenshot...');
  await page.screenshot({
    path: `${ARTIFACT_DIR}/demo-flow-1-modal-filled.png`,
  });
  console.log('Saved demo-flow-1-modal-filled.png');

  console.log('8. Submitting form (Save Tax)...');
  await page.click('button:has-text("Save Tax")');
  await page.waitForTimeout(2000);

  console.log('9. Capturing updated Tax Rules table screenshot...');
  await page.screenshot({
    path: `${ARTIFACT_DIR}/demo-flow-2-tax-rules-updated.png`,
  });
  console.log('Saved demo-flow-2-tax-rules-updated.png');

  console.log('10. Switching to Client Filings tab...');
  await page.click('button:has-text("Client Filings")');
  await page.waitForTimeout(1500);

  await page.screenshot({
    path: `${ARTIFACT_DIR}/demo-flow-3-client-filings-updated.png`,
  });
  console.log('Saved demo-flow-3-client-filings-updated.png');

  console.log('11. Navigating to Dashboard to verify synced metrics...');
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  await page.screenshot({
    path: `${ARTIFACT_DIR}/demo-flow-4-dashboard-synced.png`,
  });
  console.log('Saved demo-flow-4-dashboard-synced.png');

  await browser.close();
  console.log('ALL 4 SCREENSHOTS CAPTURED SUCCESSFULLY!');
}

runDemoFlow().catch((err) => {
  console.error('Demo flow error:', err);
  process.exit(1);
});

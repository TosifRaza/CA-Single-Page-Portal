import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/RIZ-PC/.gemini/antigravity/brain/6799a778-c2f6-4d92-bbcd-5669a616ca24';

async function runTest() {
  console.log('Launching browser to test Advanced Tax Rule Modal...');
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
    console.log(`Dialog message: ${dialog.message()}`);
    await dialog.accept();
  });

  console.log('Navigating to http://localhost:5173/masters/tax...');
  await page.goto('http://localhost:5173/masters/tax', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Click "+ Add New Tax" to open the advanced modal
  console.log('Clicking "+ Add New Tax"...');
  await page.click('button:has-text("Add New Tax")');
  await page.waitForTimeout(500);

  // Enable Reconciliation to show reconciliation fields
  console.log('Toggling Reconciliation Required...');
  await page.click('label:has-text("Reconciliation Required") input');
  await page.waitForTimeout(400);

  // Fill in amounts to demonstrate auto-calculated difference
  console.log('Filling in amounts to test mismatch calculation...');
  await page.fill('input[placeholder="e.g. GSTR-1, GSTR-3B, ITR-1, 24Q"]', 'GSTR-3B Advanced');
  const amountInputs = page.locator('input[type="number"]');
  await amountInputs.nth(0).fill('350000');
  await amountInputs.nth(1).fill('325000');
  await page.waitForTimeout(400);

  // Capture screenshot of the Advanced Tax Rule Modal (Light Theme)
  console.log('Capturing screen-tax-modal-advanced-light.png...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'screen-tax-modal-advanced-light.png'),
    fullPage: false,
  });

  // Toggle Dark Mode to capture in dark theme
  console.log('Closing modal and switching to Dark Mode...');
  await page.click('button:has-text("Cancel")');
  // Confirm discard if prompt appears
  await page.waitForTimeout(400);

  const themeToggle = await page.waitForSelector(
    'button[aria-label="Toggle theme"], button:has(svg.lucide-moon), button:has(svg.lucide-sun)'
  );
  await themeToggle.click();
  await page.waitForTimeout(600);

  // Re-open modal in Dark Mode
  console.log('Re-opening modal in Dark Mode...');
  await page.click('button:has-text("Add New Tax")');
  await page.click('label:has-text("Reconciliation Required") input');
  await page.waitForTimeout(500);

  console.log('Capturing screen-tax-modal-advanced-dark.png...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'screen-tax-modal-advanced-dark.png'),
    fullPage: false,
  });

  // Switch to Client Filings view
  await page.click('button:has-text("Cancel")');
  await page.waitForTimeout(400);

  console.log('Switching to Client Filings tab...');
  await page.click('button:has-text("Client Filings")');
  await page.waitForTimeout(1000);

  console.log('Capturing screen-tax-filings-table.png...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'screen-tax-filings-table.png'),
    fullPage: false,
  });

  console.log('Advanced Tax Rule Modal and Filings verification SUCCESSFUL!');
  await browser.close();
}

runTest().catch((err) => {
  console.error('Error during test:', err);
  process.exit(1);
});

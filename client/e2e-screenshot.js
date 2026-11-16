import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/RIZ-PC/.gemini/antigravity/brain/6799a778-c2f6-4d92-bbcd-5669a616ca24';

async function run() {
  console.log('Launching browser...');
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // High DPI for crisp screenshot matching
  });
  const page = await context.newPage();

  console.log('Navigating to login page...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });

  console.log('Filling login credentials...');
  await page.fill('input[type="email"]', 'tosif@rizassociates.com');
  await page.fill('input[type="password"]', 'Password123!');
  console.log('Submitting login form...');
  await page.click('button[type="submit"]');

  // Wait for Dashboard to load
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForSelector('text=Welcome back, Tosif Raza!');
  await page.waitForTimeout(2000); // Allow charts to animate

  console.log('Capturing Dashboard Light...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'screen-dashboard-light.png'),
    fullPage: false,
  });

  // Toggle Dark Mode
  console.log('Toggling Dark Mode...');
  const themeToggle = await page.waitForSelector('button[aria-label="Toggle theme"], button:has(svg.lucide-moon), button:has(svg.lucide-sun)');
  await themeToggle.click();
  await page.waitForTimeout(1000);

  console.log('Capturing Dashboard Dark...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'screen-dashboard-dark.png'),
    fullPage: false,
  });

  // Switch back to Light Mode for Tax Master & Work Master
  await themeToggle.click();
  await page.waitForTimeout(600);

  // Navigate to Tax Master
  console.log('Navigating to Tax Master...');
  await page.goto('http://localhost:5173/masters/tax', { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Manage all tax information and configurations');
  await page.waitForTimeout(1000);
  console.log('Capturing Tax Master...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'screen-tax-master.png'),
    fullPage: false,
  });

  // Navigate to Work Master
  console.log('Navigating to Work Master...');
  await page.goto('http://localhost:5173/masters/work', { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Define and manage works for different services');
  await page.waitForTimeout(1000);
  console.log('Capturing Work Master...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'screen-work-master.png'),
    fullPage: false,
  });

  // Switch to Dark Mode for Client Master & Work Assignment
  const themeToggleDark = await page.waitForSelector('button[aria-label="Toggle theme"], button:has(svg.lucide-moon), button:has(svg.lucide-sun)');
  await themeToggleDark.click();
  await page.waitForTimeout(600);

  // Navigate to Client Master
  console.log('Navigating to Client Master...');
  await page.goto('http://localhost:5173/masters/clients', { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Register and manage your clients');
  await page.waitForTimeout(1000);
  console.log('Capturing Client Master Dark...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'screen-client-master-dark.png'),
    fullPage: false,
  });

  // Navigate to Work Assignment
  console.log('Navigating to Work Assignment...');
  await page.goto('http://localhost:5173/masters/work-assignment', { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Assign works to clients and employees');
  await page.waitForTimeout(1000);
  console.log('Capturing Work Assignment Dark...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'screen-work-assignment-dark.png'),
    fullPage: false,
  });

  console.log('All screenshots captured successfully!');
  await browser.close();
}

run().catch((err) => {
  console.error('Error during visual capture:', err);
  process.exit(1);
});

const { chromium } = require('playwright');

const outDir = 'C:\\Users\\Viraj\\AppData\\Local\\Temp\\claude\\c--Users-Viraj-Documents-Business-Folder-Gihan\\f69809b1-74f0-4438-8e3d-98dc4a0e080f\\scratchpad';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push('pageerror: ' + err.message));

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Find your next home');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${outDir}\\home.png`, fullPage: false });

  await page.goto('http://localhost:5173/search?status=for_sale', { waitUntil: 'networkidle' });
  await page.waitForSelector('.leaflet-container', { timeout: 15000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${outDir}\\search.png`, fullPage: false });

  await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle' });
  await page.fill('input[type="text"], input:not([type])', 'smoketestuser');
  const inputs = await page.$$('input');
  await inputs[1].fill('smoke@example.com');
  await inputs[2].fill('SuperSecret123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${outDir}\\after_register.png`, fullPage: false });
  console.log('URL after register:', page.url());

  // now go to a property detail page and try saving it
  await page.goto('http://localhost:5173/search?status=for_sale', { waitUntil: 'networkidle' });
  await page.waitForSelector('a[href^="/property/"]');
  const href = await page.getAttribute('a[href^="/property/"]', 'href');
  await page.goto('http://localhost:5173' + href, { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Save');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${outDir}\\detail.png`, fullPage: false });
  await page.click('button:has-text("Save")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${outDir}\\detail_saved.png`, fullPage: false });

  await page.goto('http://localhost:5173/saved', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${outDir}\\saved.png`, fullPage: false });

  console.log('CONSOLE ERRORS:', JSON.stringify(errors, null, 2));

  await browser.close();
})();

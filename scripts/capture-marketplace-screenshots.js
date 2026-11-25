/**
 * Capture High-Resolution 1920x1080 Marketplace Screenshots for Vibe96
 */

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = path.join(__dirname, '../vibe96-submission/screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function getChromePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  if (process.platform === 'darwin') return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (process.platform === 'linux') {
    const candidates = ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
  }
  if (process.platform === 'win32') {
    const candidates = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
  }
  return undefined;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getPngDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  // IHDR chunk begins at offset 12, width at 16 (4 bytes BE), height at 20 (4 bytes BE)
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return { width, height };
}

async function capture() {
  console.log('══════════════════════════════════════════════════════════════');
  console.log('📸 CAPTURING VIBE96 1920x1080 SCREENSHOTS');
  console.log('══════════════════════════════════════════════════════════════\n');

  const browser = await puppeteer.launch({
    executablePath: getChromePath(),
    headless: 'new',
    defaultViewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  // 1. Login
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await sleep(1000);

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const adminBtn = btns.find((b) => b.innerText.includes('Admin'));
    if (adminBtn) adminBtn.click();
  });
  await sleep(400);

  await page.click('button[type="submit"]');
  await sleep(2500);

  const targets = [
    {
      name: '01-admin-dashboard.png',
      url: `${BASE_URL}/dashboard`,
      desc: 'Operational Overview & Sales Metrics Dashboard',
    },
    {
      name: '02-orders-pipeline.png',
      url: `${BASE_URL}/orders`,
      desc: 'Order Lifecycle Pipeline & Status Tracking',
    },
    {
      name: '03-quick-order-entry.png',
      url: `${BASE_URL}/orders/new`,
      desc: 'Fast Order Entry Form with Bangladesh Address & Courier Fields',
    },
    {
      name: '04-products-inventory.png',
      url: `${BASE_URL}/products`,
      desc: 'Product Catalog, Pricing & Stock Inventory Management',
    },
    {
      name: '05-cod-settlement.png',
      url: `${BASE_URL}/cod`,
      desc: 'Cash on Delivery (COD) Tracking & Courier Settlement Module',
    },
    {
      name: '06-profit-analytics.png',
      url: `${BASE_URL}/reports/profit`,
      desc: 'Financial Profit & Loss Analytics with Revenue & Margin Breakdown',
    },
  ];

  const verificationResults = [];

  for (const t of targets) {
    console.log(`Capturing: ${t.name} (${t.desc})...`);
    await page.goto(t.url, { waitUntil: 'domcontentloaded' });
    await sleep(1500);

    const outPath = path.join(OUTPUT_DIR, t.name);
    await page.screenshot({ path: outPath, fullPage: false });

    // Verify dimensions
    const { width, height } = await getPngDimensions(outPath);
    const valid = width === 1920 && height === 1080;
    verificationResults.push({ file: t.name, width, height, valid });
    console.log(`  -> Saved: ${outPath} [Dimensions: ${width}x${height}px — ${valid ? 'PASSED' : 'FAILED'}]`);
  }

  await browser.close();

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('🏁 SCREENSHOT VERIFICATION SUMMARY');
  console.log('══════════════════════════════════════════════════════════════');
  let allValid = true;
  for (const r of verificationResults) {
    console.log(`- ${r.file}: ${r.width}x${r.height} px (${r.valid ? '✅ EXACT 1920x1080' : '❌ INVALID'})`);
    if (!r.valid) allValid = false;
  }

  if (allValid) {
    console.log('\n✅ ALL 6 SCREENSHOTS EXACTLY MEET THE 1920x1080 REQUIREMENT!\n');
  } else {
    console.error('\n❌ ERROR: Some screenshots failed dimension requirements.\n');
    process.exit(1);
  }
}

capture();

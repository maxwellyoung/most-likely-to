const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function captureScreenshots() {
  const outputDir = path.join(__dirname, '../screenshots');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Screenshot dimensions for iPhone 6.7"
  const width = 1290;
  const height = 2796;

  await page.setViewport({ width, height, deviceScaleFactor: 1 });

  const htmlPath = `file://${path.join(__dirname, '../dist/screenshots.html')}`;

  for (let i = 1; i <= 5; i++) {
    console.log(`Capturing screenshot ${i}...`);

    await page.goto(htmlPath, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));

    // Remove transform and isolate just this screenshot
    await page.evaluate((index) => {
      // Hide everything except the target screenshot
      document.body.innerHTML = '';
      const original = document.querySelector(`#screenshot-${index}`);
      if (!original) return;

      const clone = original.cloneNode(true);
      clone.style.transform = 'none';
      clone.style.position = 'absolute';
      clone.style.top = '0';
      clone.style.left = '0';
      clone.style.margin = '0';

      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.overflow = 'hidden';
      document.body.appendChild(clone);
    }, i);

    await new Promise(r => setTimeout(r, 500));

    await page.screenshot({
      path: path.join(outputDir, `screenshot-${i}.png`),
      clip: { x: 0, y: 0, width, height }
    });

    console.log(`Saved screenshot-${i}.png (${width}x${height})`);
  }

  await browser.close();
  console.log(`\nDone! Screenshots saved to: ${outputDir}`);
}

captureScreenshots().catch(console.error);

// Render the standalone web editions in docs/ to print-ready A5 PDFs in book/.
// Usage: NODE_PATH=$(npm root -g) node tools/build_pdf.js
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const root = path.resolve(__dirname, '..');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  for (const name of ['the-errand', 'la-commissione']) {
    const page = await browser.newPage();
    await page.goto('file://' + path.join(root, 'docs', name + '.html'), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.emulateMedia({ media: 'print', colorScheme: 'light' });
    await page.pdf({ path: path.join(root, 'book', name + '.pdf'), preferCSSPageSize: true, printBackground: true,
      displayHeaderFooter: true, headerTemplate: '<span></span>',
      footerTemplate: '<div style="font-size:7pt;width:100%;text-align:center;color:#666"><span class="pageNumber"></span></div>' });
    console.log('wrote', name + '.pdf');
  }
  await browser.close();
})();

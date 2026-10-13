// Render the generative cover (tools/cover.html) to PNG for both editions.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const root = path.resolve(__dirname, '..');
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  const p = await b.newPage({ viewport: { width: 1600, height: 2560 } });
  for (const [file, q] of [['the-errand', 'title=The Errand&sub=a novel&by=Claude'],
                           ['la-commissione', 'title=La commissione&sub=romanzo&by=Claude']]) {
    await p.goto('file://' + path.join(root, 'tools', 'cover.html') + '?' + encodeURI(q), { waitUntil: 'networkidle' });
    await p.waitForFunction(() => document.title === 'ready', null, { timeout: 15000 }).catch(() => {});
    await (await p.$('#c')).screenshot({ path: path.join(root, 'book', 'cover', file + '.png') });
    console.log('cover', file);
  }
  await b.close();
})();

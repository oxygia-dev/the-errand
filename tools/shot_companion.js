// Screenshot one mind's section of the companion at phone and desktop widths, light and dark,
// and print any console errors and horizontal overflow. Usage:
//   python3 tools/build_companion.py && NODE_PATH=$(npm root -g) node tools/shot_companion.js <mind> [outdir]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const mind = process.argv[2] || 'dog';
  const outdir = process.argv[3] || '/tmp';
  const file = 'file://' + path.resolve(__dirname, '..', 'docs', 'companion', 'index.html');
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  for (const [w, h] of [[390, 900], [1100, 900]]) for (const scheme of ['light', 'dark']) {
    const p = await b.newPage({ viewport: { width: w, height: h }, colorScheme: scheme });
    const errs = [];
    p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    p.on('pageerror', e => errs.push(String(e)));
    await p.goto(file);
    await p.waitForTimeout(800);
    const el = await p.$('#' + mind);
    await el.scrollIntoViewIfNeeded();
    await p.waitForTimeout(1500);
    const out = path.join(outdir, `${mind}-${w}-${scheme}.png`);
    await el.screenshot({ path: out });
    const sw = await p.evaluate(() => document.documentElement.scrollWidth);
    console.log(out, 'scrollWidth', sw, 'viewport', w, errs.length ? 'ERRORS: ' + errs.join(' | ') : 'no errors');
    await p.close();
  }
  await b.close();
})();

/**
 * Swap the single site nav (scripts/site-nav.js) into every page, like
 * apply-footer.js does for the footer. Runs in `npm run build` after the
 * generators. Pages without the site navbar (ad landing pages, thank-you
 * pages, 404) are left alone.
 */
const fs = require('fs');
const path = require('path');
const { applyNav } = require('./site-nav');

const ROOT = path.join(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', 'studio', 'admin', 'scripts']);

function* htmlFiles(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name) || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* htmlFiles(p);
    else if (e.name.endsWith('.html')) yield p;
  }
}

let total = 0, changed = 0;
for (const file of htmlFiles(ROOT)) {
  const html = fs.readFileSync(file, 'utf8');
  const urlPath = '/' + path.relative(ROOT, file).split(path.sep).join('/');
  const next = applyNav(html, urlPath);
  if (next !== html || /id="navbar"/.test(html)) total += /<nav class="navbar(?: nav-white)?"[^>]*\bid="navbar"/.test(html) ? 1 : 0;
  if (next !== html) { fs.writeFileSync(file, next); changed++; }
}
console.log(`apply-nav: ${total} pages with the site nav, ${changed} updated`);

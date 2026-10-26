/**
 * Swap the single site footer (scripts/site-footer.js) into every page.
 * Runs after the generators in `npm run build`, so static pages, templates
 * and generated pages all end up with identical footers.
 */
const fs = require('fs');
const path = require('path');
const { applyFooter } = require('./site-footer');

const ROOT = path.join(__dirname, '..');
// Self-contained ad landing pages with their own design; they don't load style.css.
const SKIP_DIRS = new Set(['node_modules', 'studio', 'admin', 'scripts', '.git', '.vercel', 'treetopia']);

function* htmlFiles(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name) && !e.name.startsWith('.')) yield* htmlFiles(path.join(dir, e.name)); }
    else if (e.name.endsWith('.html')) yield path.join(dir, e.name);
  }
}

let changed = 0, total = 0;
for (const file of htmlFiles(ROOT)) {
  const html = fs.readFileSync(file, 'utf8');
  const next = applyFooter(html);
  if (/<footer class="(footer|ph-footer)"/.test(html)) total++;
  if (next !== html) { fs.writeFileSync(file, next); changed++; }
}
console.log(`apply-footer: ${total} pages with a footer, ${changed} updated`);

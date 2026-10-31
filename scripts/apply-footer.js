/**
 * Swap the single site footer (scripts/site-footer.js) into every page.
 * Runs after the generators in `npm run build`, so static pages, templates
 * and generated pages all end up with identical footers.
 */
const fs = require('fs');
const path = require('path');
const { applyFooter } = require('./site-footer');

const ROOT = path.join(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', 'studio', 'admin', 'scripts']);
// Self-contained ad landing pages with their own design (top level only; /projects/treetopia is a normal page).
const SKIP_TOP = new Set(['treetopia', 'dlf-westpark-andheri-west', 'thank-you-page-dlf-westpark']);

function* htmlFiles(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const skip = SKIP_DIRS.has(e.name) || e.name.startsWith('.') || (dir === ROOT && SKIP_TOP.has(e.name));
    if (e.isDirectory()) { if (!skip) yield* htmlFiles(path.join(dir, e.name)); }
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

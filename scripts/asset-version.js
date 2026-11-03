/**
 * Stamp every local stylesheet and script link with a hash of the file, e.g.
 * /css/style.css -> /css/style.css?v=3bc61df1. Browsers keep /css and /js for
 * up to a day (vercel.json), so without this a CSS or JS fix doesn't reach
 * returning visitors until their copy expires. The hash only changes when the
 * file does, so unchanged files stay cached.
 * Runs last-but-one in `npm run build`. DRY=1 reports without writing.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', 'studio', 'admin', 'scripts']);
const DRY = !!process.env.DRY;

function* htmlFiles(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* htmlFiles(p);
    else if (e.name.endsWith('.html')) yield p;
  }
}

const hashes = new Map();
function hashOf(asset) {
  if (!hashes.has(asset)) {
    const file = path.join(ROOT, asset);
    hashes.set(asset, fs.existsSync(file)
      ? crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex').slice(0, 8) : null);
  }
  return hashes.get(asset);
}

let pages = 0, links = 0;
for (const file of htmlFiles(ROOT)) {
  const html = fs.readFileSync(file, 'utf8');
  let n = 0;
  const out = html.replace(/(href|src)="((?:\.\.\/)*\/?)((?:css|js)\/[\w.\/-]+\.(?:css|js))(?:\?v=[\w]*)?"/g, (m, at, pre, asset) => {
    const v = hashOf(asset);
    if (!v) return m;
    n++;
    return `${at}="${pre}${asset}?v=${v}"`;
  });
  if (n && out !== html) { if (!DRY) fs.writeFileSync(file, out); pages++; links += n; }
}
console.log(`asset-version: ${links} CSS/JS links versioned on ${pages} pages${DRY ? ' (dry run)' : ''}`);

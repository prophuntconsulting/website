/**
 * Keep every page's <title> within ~60 characters and meta description
 * within 160, so Google shows them whole instead of cutting them off.
 * Runs at the end of `npm run build`, after the generators and apply-footer.
 *
 * Titles: shorten the brand suffix first (" | PROPHUNT LLP" -> " | PROPHUNT"),
 * then drop it. Descriptions: cut at the last full sentence that fits, else at
 * a clause break, else at a word with an ellipsis.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', 'studio', 'admin', 'scripts']);
const TITLE_MAX = 60, DESC_MAX = 160;

const decode = s => s.replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"');
const len = s => decode(s).length;

function fitTitle(t) {
  if (len(t) <= TITLE_MAX) return t;
  const steps = [
    x => x.replace(/ \| PROPHUNT LLP Blog$/, ' | PROPHUNT'),
    x => x.replace(/ \| PROPHUNT LLP \| /, ' | '),
    x => x.replace(/ \| PROPHUNT LLP$/, ' | PROPHUNT'),
    x => x.replace(/ \| PROPHUNT( LLP)?$/, ''),
    x => x.replace(/, Pune:/, ':'),
    x => x.replace(/ &amp; (RERA|Details)$/, ''),
  ];
  for (const step of steps) { t = step(t); if (len(t) <= TITLE_MAX) break; }
  return t;
}

function fitDesc(d) {
  if (len(d) <= DESC_MAX) return d;
  const plain = decode(d);
  const within = plain.slice(0, DESC_MAX - 2);
  const sentence = Math.max(within.lastIndexOf('. '), within.lastIndexOf('? '), within.lastIndexOf('! '));
  let out;
  if (sentence >= 100) out = within.slice(0, sentence + 1);
  else {
    const clause = Math.max(within.lastIndexOf(', '), within.lastIndexOf('; '), within.lastIndexOf(' — '), within.lastIndexOf(' - '));
    if (clause >= 110) out = within.slice(0, clause).replace(/[,;]$/, '') + '.';
    else out = within.slice(0, within.lastIndexOf(' ')).replace(/[,;:\s]+$/, '') + '…';
  }
  return out.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function* htmlFiles(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name) && !e.name.startsWith('.')) yield* htmlFiles(path.join(dir, e.name)); }
    else if (e.name.endsWith('.html')) yield path.join(dir, e.name);
  }
}

let titles = 0, descs = 0;
const long = [];
for (const file of htmlFiles(ROOT)) {
  const html = fs.readFileSync(file, 'utf8');
  // Project and blog templates put an id on these tags, so allow attributes.
  let next = html.replace(/<title([^>]*)>([^<]*)<\/title>/, (m, attrs, t) => { const f = fitTitle(t); if (f !== t) titles++; if (len(f) > TITLE_MAX) long.push(path.relative(ROOT, file) + ': ' + f); return `<title${attrs}>${f}</title>`; });
  next = next.replace(/(<meta (?:[^>]*\s)?name="description"[^>]*?content=")([^"]*)(")/, (m, a, d, b) => { const f = fitDesc(d); if (f !== d) descs++; return a + f + b; });
  if (next !== html) fs.writeFileSync(file, next);
}
console.log(`seo-clamp: ${titles} titles and ${descs} descriptions shortened`);
if (long.length) console.log('  still over ' + TITLE_MAX + ':\n  ' + long.join('\n  '));

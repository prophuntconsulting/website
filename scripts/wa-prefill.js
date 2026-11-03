/**
 * Write a pre-filled message into every WhatsApp link that has none, in the
 * HTML itself, so the chat opens with a message even if a visitor taps
 * before any script has loaded. The wording comes from js/wa-message.js
 * (waMessageFor), the same function the browser uses for links built later.
 * Runs in `npm run build` after apply-footer, so the shared footer and the
 * floating button are covered too.
 */
const fs = require('fs');
const path = require('path');
const { waTextFor, withText } = require('../js/wa-message');

const ROOT = path.join(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', 'studio', 'admin', 'scripts']);
// Templates filled in the browser: their H1 is a placeholder at build time.
const SKIP_FILES = new Set(['property.html', 'post.html', path.join('blog', 'post.html')]);

function* htmlFiles(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* htmlFiles(p);
    else if (e.name.endsWith('.html')) yield p;
  }
}

const text = s => s.replace(/<span[^>]*class="[^"]*\bsr-only\b[^"]*"[^>]*>[\s\S]*?<\/span>/g, '')
  .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'")
  .replace(/&quot;/g, '"').replace(/&eacute;/g, 'é').replace(/&times;/g, '×').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
const attr = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

let pages = 0, links = 0;
for (const file of htmlFiles(ROOT)) {
  const rel = path.relative(ROOT, file);
  if (SKIP_FILES.has(rel)) continue;
  const html = fs.readFileSync(file, 'utf8');
  if (!/wa\.me\/|api\.whatsapp\.com\//.test(html)) continue;
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1];
  const title = text((html.match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1] || '');
  const urlPath = '/' + rel.split(path.sep).join('/');
  const msg = waTextFor(urlPath, h1 ? text(h1) : '', title);
  let n = 0;
  const out = html.replace(/href="(https?:\/\/(?:wa\.me|api\.whatsapp\.com|(?:www\.)?whatsapp\.com)\/[^"]*)"/g, (m, href) => {
    const next = withText(href, msg);
    if (!next) return m;
    n++;
    return `href="${attr(next)}"`;
  });
  if (n) { fs.writeFileSync(file, out); pages++; links += n; }
}
console.log(`wa-prefill: ${links} WhatsApp links given a message on ${pages} pages`);

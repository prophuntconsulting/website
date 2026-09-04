/**
 * Build script: reads blog/posts/*.md
 *   → writes blog/posts.json
 *   → generates static blog/{cleanSlug}/index.html for each post
 */

const fs   = require('fs');
const path = require('path');

const SITE = 'https://www.prophuntllp.com';

const POSTS_DIR    = path.join(__dirname, '..', 'blog', 'posts');
const OUT_FILE     = path.join(__dirname, '..', 'blog', 'posts.json');
const TEMPLATE     = path.join(__dirname, '..', 'blog', 'post.html');

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function absUrl(src) {
  if (!src) return `${SITE}/images/og-home.jpg`;
  return src.startsWith('http') ? src : `${SITE}${src}`;
}

const CAT_LABELS = { market: 'Market Report', buyer: 'Buyer Guide', investment: 'Investment', legal: 'Legal & RERA', area: 'Area Guide', developer: 'Developer News', general: 'Article' };

function fmtDate(str) {
  if (!str) return '';
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Head tags: real title/description/canonical + OG/Twitter + JSON-LD (BlogPosting)
// so search engines and AI crawlers see genuine, article-specific signals without
// running JS.
function buildHeadBlock(p) {
  const title = `${p.title} | PROPHUNT LLP Blog`;
  const desc  = p.seo_description || p.excerpt || '';
  const url   = `${SITE}${p.url}`;
  const image = absUrl(p.cover);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.title,
    description: p.excerpt || '',
    datePublished: p.date || '',
    dateModified: p.date || '',
    author: { '@type': 'Organization', name: p.author || 'PROPHUNT Advisory Team' },
    publisher: { '@type': 'Organization', name: 'PROPHUNT LLP', url: SITE, logo: `${SITE}/images/logo-black.png` },
    mainEntityOfPage: url,
    ...(p.cover ? { image } : {}),
  };

  return `<title id="ph-blog-title">${escapeHtml(title)}</title>
<meta id="ph-meta-desc" name="description" content="${escapeHtml(desc)}">
<meta id="ph-og-title"  property="og:title" content="${escapeHtml(title)}">
<meta id="ph-og-desc"  property="og:description" content="${escapeHtml(desc)}">
<meta id="ph-og-img"   property="og:image" content="${image}">
<meta property="og:type" content="article">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="PROPHUNT LLP">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(desc)}">
<meta name="twitter:image" content="${image}">
<link rel="canonical" id="ph-canonical" href="${url}">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
}

// Lightweight server-rendered summary shown before the client JS hydrates the
// full article — gives non-JS crawlers real indexable text (title, category,
// date, author, excerpt) instead of a bare loading spinner. The client JS
// replaces #bp-page's innerHTML anyway, so this has no visual cost for readers.
function buildPrerenderBlock(p) {
  const catLabel = CAT_LABELS[p.category] || p.category || 'Article';
  return `<div class="bp-prerender" style="max-width:820px;margin:0 auto;padding:40px 24px 24px">
    <div style="font-family:'Poppins',sans-serif;font-size:11px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:#C8362B;margin-bottom:10px">${escapeHtml(catLabel)} · ${escapeHtml(fmtDate(p.date))} · ${escapeHtml(p.author || 'PROPHUNT Advisory Team')}</div>
    <h1 style="font-family:'Poppins',sans-serif;font-size:clamp(22px,4vw,38px);font-weight:800;line-height:1.18;color:#0f1b2d;margin-bottom:14px;letter-spacing:-.3px">${escapeHtml(p.title)}</h1>
    ${p.excerpt ? `<p style="font-family:'Lora',serif;font-size:17px;color:#4b5563;line-height:1.7;margin-bottom:20px">${escapeHtml(p.excerpt)}</p>` : ''}
    <div class="bp-loading-spinner"></div>
  </div>`;
}

// Strip leading YYYY-MM-DD- date prefix from filename slug
function toUrlSlug(fileSlug) {
  return fileSlug.replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };
  const meta = {};
  let currentKey = null;
  match[1].split('\n').forEach(line => {
    if (currentKey && /^\s+-\s/.test(line)) {
      if (!Array.isArray(meta[currentKey])) meta[currentKey] = [];
      meta[currentKey].push(line.trim().slice(2).trim().replace(/^["']|["']$/g, ''));
      return;
    }
    currentKey = null;
    const idx = line.indexOf(':');
    if (idx < 0) return;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (val === '') { currentKey = key; }
    else { meta[key] = val; }
  });
  return { meta, body: match[2] };
}

function estimateReadTime(text) {
  return Math.max(1, Math.round(text.split(/\s+/).length / 200));
}

if (!fs.existsSync(POSTS_DIR)) {
  fs.mkdirSync(POSTS_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify([], null, 2));
  console.log('No posts directory — created empty posts.json');
  process.exit(0);
}

const files = fs.readdirSync(POSTS_DIR)
  .filter(f => f.endsWith('.md'))
  .sort()
  .reverse(); // newest first

const posts = files.map(filename => {
  const fileSlug = filename.replace(/\.md$/, '');
  const urlSlug  = toUrlSlug(fileSlug);
  const content  = fs.readFileSync(path.join(POSTS_DIR, filename), 'utf-8');
  const { meta, body } = parseFrontmatter(content);

  return {
    slug:     fileSlug,           // filename slug — used to fetch the .md file
    urlSlug:  urlSlug,            // clean URL slug — used in the browser address bar
    url:      '/blog/' + urlSlug, // canonical path
    title:    meta.title    || fileSlug,
    date:     meta.date     || '',
    author:   meta.author   || 'PROPHUNT Advisory Team',
    category: meta.category || 'general',
    excerpt:  meta.excerpt  || body.replace(/#{1,6}\s+/g, '').slice(0, 160) + '…',
    cover:    meta.cover    || '',
    tags:     Array.isArray(meta.tags) ? meta.tags : [],
    focus_keyword:   meta.focus_keyword   || '',
    seo_title:       meta.seo_title       || '',
    seo_description: meta.seo_description || '',
    readTime: estimateReadTime(body),
  };
});

fs.writeFileSync(OUT_FILE, JSON.stringify(posts, null, 2));
console.log(`Built posts.json — ${posts.length} post(s)`);

// Generate static blog/{cleanSlug}/index.html for each post
if (fs.existsSync(TEMPLATE)) {
  const template = fs.readFileSync(TEMPLATE, 'utf-8');
  const INJECT_MARKER = /const fileSlug = typeof __FILE_SLUG__ !== 'undefined'\r?\n\s+\? __FILE_SLUG__\r?\n\s+: \(new URLSearchParams\(location\.search\)\.get\('slug'\) \|\| ''\);/;

  const HEAD_MARKER = `<title id="ph-blog-title">Loading… | PROPHUNT LLP Blog</title>
<meta id="ph-meta-desc" name="description" content="">
<meta id="ph-og-title"  property="og:title" content="">
<meta id="ph-og-desc"  property="og:description" content="">
<meta id="ph-og-img"   property="og:image" content="">
<meta property="og:type" content="article">
<meta property="og:site_name" content="PROPHUNT LLP">
<link rel="canonical" id="ph-canonical" href="https://prophuntllp.com/blog">`;

  const LOADING_MARKER = `<div class="bp-loading">
    <div class="bp-loading-spinner"></div>
    <p>Loading article…</p>
  </div>`;

  posts.forEach(p => {
    const outDir = path.join(__dirname, '..', 'blog', p.urlSlug);
    fs.mkdirSync(outDir, { recursive: true });

    let html = template.replace(INJECT_MARKER, `const fileSlug = '${p.slug}';`);
    html = html.replace(HEAD_MARKER, buildHeadBlock(p));
    html = html.replace(LOADING_MARKER, buildPrerenderBlock(p));
    html = html.replace('Loading…</span>', `${escapeHtml(p.title)}</span>`);

    fs.writeFileSync(path.join(outDir, 'index.html'), html);
    console.log(`  → blog/${p.urlSlug}/index.html`);
  });
} else {
  console.warn('  ⚠ blog/post.html template not found — skipping static page generation');
}

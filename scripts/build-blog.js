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

// Mirrors the renderCard() embedded in blog/index.html exactly, so the
// prerendered grid (below) and the client-hydrated one are identical.
function renderListingCard(p, featured) {
  const coverHTML = p.cover
    ? `<div class="blog-card-img-inner" style="background-image:url('${p.cover}');background-size:cover;background-position:center;"></div>`
    : `<div class="blog-card-img-inner" style="background:linear-gradient(135deg,#1a1a1a,#2d1a1a);display:flex;align-items:center;justify-content:center;"><i class="${LISTING_CAT_ICONS[p.category] || 'fas fa-newspaper'}" style="font-size:${featured ? '4' : '3'}rem;color:rgba(200,54,43,.35);"></i></div>`;
  return `
      <article class="blog-card" data-cat="${p.category}">
        <div class="blog-card-img"${featured ? ' style="height:auto;"' : ''}>
          ${coverHTML}
          <div class="blog-card-cat"><span class="badge ${LISTING_CAT_COLORS[p.category] || 'badge-dark'}">${LISTING_CAT_LABELS[p.category] || p.category}</span></div>
        </div>
        <div class="blog-card-body">
          <div class="blog-card-date"><i class="fas fa-calendar-alt"></i> ${fmtDate(p.date)}</div>
          <div class="blog-card-title"><a href="${p.url}">${p.title}</a></div>
          <p class="blog-card-excerpt">${p.excerpt}</p>
          <div class="blog-card-footer">
            <span class="blog-card-author"><i class="fas fa-user-circle"></i> ${p.author}</span>
            <a href="${p.url}" class="blog-read-more">Read Article <i class="fas fa-arrow-right"></i></a>
          </div>
        </div>
      </article>`;
}

// Matches the category pills / sidebar filter buttons in blog/index.html.
const LISTING_CATS = [
  { key: 'all',        label: 'All Articles',   icon: 'fas fa-th' },
  { key: 'market',     label: 'Market Reports', icon: 'fas fa-chart-bar' },
  { key: 'buyer',      label: 'Buyer Guides',   icon: 'fas fa-home' },
  { key: 'investment', label: 'Investment',     icon: 'fas fa-rupee-sign' },
  { key: 'legal',      label: 'Legal & Docs',   icon: 'fas fa-file-contract' },
  { key: 'nri',        label: 'NRI Corner',     icon: 'fas fa-globe-asia' },
];
const LISTING_CAT_ICONS  = { market: 'fas fa-chart-bar', buyer: 'fas fa-home', investment: 'fas fa-rupee-sign', legal: 'fas fa-file-contract', nri: 'fas fa-globe-asia' };
const LISTING_CAT_COLORS = { market: 'badge-red', buyer: 'badge-dark', investment: 'badge-red', legal: 'badge-dark', nri: 'badge-dark' };
const LISTING_CAT_LABELS = { market: 'Market Report', buyer: 'Buyer Guide', investment: 'Investment', legal: 'Legal & Docs', nri: 'NRI Corner' };

function buildSidebarCatsBlock(posts) {
  const counts = {};
  posts.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
  const buttons = LISTING_CATS.map(c => {
    const count = c.key === 'all' ? posts.length : (counts[c.key] || 0);
    return `            <button class="sidebar-cat-btn${c.key === 'all' ? ' active' : ''}" data-cat="${c.key}"><span><i class="${c.icon}" style="width:16px;color:var(--red);"></i> ${c.label}</span><span class="cat-count">${count}</span></button>`;
  }).join('\n');
  return `          <div class="sidebar-cats">\n${buttons}\n          </div>`;
}

// The most recent posts, real and linked — replaces a hand-written "Popular
// This Month" list that named 3 articles that don't exist on the site
// (stale content the audit flagged as a freshness/trust risk).
function renderMini(p) {
  const icon = { market: 'fa-chart-area', buyer: 'fa-home', investment: 'fa-rupee-sign', legal: 'fa-file-contract', nri: 'fa-globe-asia' }[p.category] || 'fa-newspaper';
  const bg = p.cover
    ? `background-image:url('${p.cover}');background-size:cover;background-position:center;`
    : `background:linear-gradient(135deg,#1a1a1a,#2d1a1a);display:flex;align-items:center;justify-content:center;`;
  const inner = p.cover ? '' : `<i class="fas ${icon}" style="color:rgba(200,54,43,.5);font-size:1.2rem;"></i>`;
  return `            <a href="${p.url}" class="blog-item-mini">
              <div class="blog-mini-img"><div style="${bg}">${inner}</div></div>
              <div><div class="blog-mini-title">${escapeHtml(p.title)}</div><div class="blog-mini-date">${fmtDate(p.date)}</div></div>
            </a>`;
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
  // Normalise to LF — see scripts/build-properties.js for why: the marker
  // template literals below are LF at runtime regardless of how this file
  // is saved, so a CRLF template file would make every .replace() below
  // silently no-op.
  const template = fs.readFileSync(TEMPLATE, 'utf-8').replace(/\r\n/g, '\n');
  const INJECT_MARKER = /const fileSlug = typeof __FILE_SLUG__ !== 'undefined'\r?\n\s+\? __FILE_SLUG__\r?\n\s+: \(new URLSearchParams\(location\.search\)\.get\('slug'\) \|\| ''\);/;

  const HEAD_MARKER = `<title id="ph-blog-title">Loading… | PROPHUNT LLP Blog</title>
<meta id="ph-meta-desc" name="description" content="">
<meta id="ph-og-title"  property="og:title" content="">
<meta id="ph-og-desc"  property="og:description" content="">
<meta id="ph-og-img"   property="og:image" content="">
<meta property="og:type" content="article">
<meta property="og:site_name" content="PROPHUNT LLP">
<link rel="canonical" id="ph-canonical" href="https://www.prophuntllp.com/blog">`;

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

// Prerender the /blog listing page. #blogGrid previously shipped as the
// literal text "Loading articles…", filled in only by the inline <script>
// after a fetch — a crawler saw zero article links on the page that's
// supposed to be the hub for all of them. That same inline script still
// overwrites this on load with identical markup, so real visitors see no
// change; it also replaces the sidebar's hardcoded "0" category counts and
// a "Popular This Month" list that named 3 articles which don't exist
// anywhere on the site (a fabricated-content / freshness risk the audit
// flagged) with the site's real, most recent posts.
const listingPagePath = path.join(__dirname, '..', 'blog', 'index.html');
if (fs.existsSync(listingPagePath)) {
  let html = fs.readFileSync(listingPagePath, 'utf8').replace(/\r\n/g, '\n');

  const GRID_MARKER = `<div class="blog-grid" id="blogGrid">
          <div style="grid-column:1/-1;text-align:center;padding:4rem 0;color:var(--gray-400);">
            <i class="fas fa-circle-notch fa-spin" style="font-size:1.5rem;display:block;margin-bottom:.75rem;"></i>
            Loading articles…
          </div>
        </div>`;
  const cardsHtml = posts.map((p, i) => renderListingCard(p, i === 0)).join('');
  html = html.replace(GRID_MARKER, `<div class="blog-grid" id="blogGrid">${cardsHtml}</div>`);

  const SIDEBAR_CATS_MARKER = `<div class="sidebar-cats">
            <button class="sidebar-cat-btn active" data-cat="all"><span><i class="fas fa-th" style="width:16px;color:var(--red);"></i> All Articles</span><span class="cat-count">0</span></button>
            <button class="sidebar-cat-btn" data-cat="market"><span><i class="fas fa-chart-bar" style="width:16px;color:var(--red);"></i> Market Reports</span><span class="cat-count">0</span></button>
            <button class="sidebar-cat-btn" data-cat="buyer"><span><i class="fas fa-home" style="width:16px;color:var(--red);"></i> Buyer Guides</span><span class="cat-count">0</span></button>
            <button class="sidebar-cat-btn" data-cat="investment"><span><i class="fas fa-rupee-sign" style="width:16px;color:var(--red);"></i> Investment</span><span class="cat-count">0</span></button>
            <button class="sidebar-cat-btn" data-cat="legal"><span><i class="fas fa-file-contract" style="width:16px;color:var(--red);"></i> Legal &amp; Docs</span><span class="cat-count">0</span></button>
            <button class="sidebar-cat-btn" data-cat="nri"><span><i class="fas fa-globe-asia" style="width:16px;color:var(--red);"></i> NRI Corner</span><span class="cat-count">0</span></button>
          </div>`;
  html = html.replace(SIDEBAR_CATS_MARKER, buildSidebarCatsBlock(posts));

  const POPULAR_MARKER = `<div class="sidebar-box">
          <div class="sidebar-box-title">Popular This Month</div>
          <div>
            <div class="blog-item-mini">
              <div class="blog-mini-img"><div style="background:linear-gradient(135deg,#1a1a1a,#2d1a1a);display:flex;align-items:center;justify-content:center;"><i class="fas fa-chart-area" style="color:rgba(200,54,43,.5);font-size:1.2rem;"></i></div></div>
              <div><div class="blog-mini-title">Pune Market H1 2025 Report</div><div class="blog-mini-date">June 2025</div></div>
            </div>
            <div class="blog-item-mini">
              <div class="blog-mini-img"><div style="background:linear-gradient(135deg,#1a2a1a,#0f1a0f);display:flex;align-items:center;justify-content:center;"><i class="fas fa-home" style="color:rgba(100,200,100,.4);font-size:1.2rem;"></i></div></div>
              <div><div class="blog-mini-title">First-Time Buyer's Complete Guide</div><div class="blog-mini-date">May 2025</div></div>
            </div>
            <div class="blog-item-mini">
              <div class="blog-mini-img"><div style="background:linear-gradient(135deg,#0a1a2d,#051020);display:flex;align-items:center;justify-content:center;"><i class="fas fa-rupee-sign" style="color:rgba(50,150,250,.4);font-size:1.2rem;"></i></div></div>
              <div><div class="blog-mini-title">Hinjewadi vs. Baner: Where to Invest</div><div class="blog-mini-date">April 2025</div></div>
            </div>
          </div>
        </div>`;
  const popularHtml = `<div class="sidebar-box">
          <div class="sidebar-box-title">Popular Guides</div>
          <div>
${posts.slice(0, 3).map(renderMini).join('\n')}
          </div>
        </div>`;
  html = html.replace(POPULAR_MARKER, popularHtml);

  // Real Blog + ItemList structured data instead of just a bare Blog stub —
  // gives crawlers an indexable list of every published article.
  const listingJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog` },
        ],
      },
      {
        '@type': 'Blog',
        name: 'PROPHUNT LLP Real Estate Blog',
        url: `${SITE}/blog`,
        description: 'Pune real estate market insights, buyer guides, investment analysis and property updates from PROPHUNT LLP.',
        publisher: { '@type': 'Organization', name: 'PROPHUNT LLP', url: SITE, logo: `${SITE}/images/logo-black.png` },
        inLanguage: 'en-IN',
      },
      {
        '@type': 'ItemList',
        name: 'PROPHUNT LLP Blog Articles',
        numberOfItems: posts.length,
        itemListElement: posts.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.title, item: `${SITE}${p.url}` })),
      },
    ],
  };
  html = html.replace(/<script type="application\/ld\+json">\n\{[\s\S]*?\n\}\n<\/script>/, `<script type="application/ld+json">\n${JSON.stringify(listingJsonLd, null, 2)}\n</script>`);

  fs.writeFileSync(listingPagePath, html);
  console.log(`Prerendered blog/index.html — ${posts.length} article cards`);
}

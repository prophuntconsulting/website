/**
 * Build script: reads blog/posts/*.md
 *   → writes blog/posts.json
 *   → generates static blog/{cleanSlug}/index.html for each post
 */

const fs   = require('fs');
const path = require('path');
const { fitTitle } = require('./hub-shared');

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

function renderInline(text) {
  return escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)/g, '<a href="$2">$1</a>');
}

function flushList(lines, ordered) {
  if (!lines.length) return '';
  const tag = ordered ? 'ol' : 'ul';
  const html = `<${tag}>${lines.map(line => `<li>${renderInline(line)}</li>`).join('')}</${tag}>`;
  lines.length = 0;
  return html;
}

function renderTable(lines) {
  const rows = lines
    .map(line => line.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim()))
    .filter(row => row.length > 1);
  if (rows.length < 2) return lines.map(line => `<p>${renderInline(line)}</p>`).join('\n');
  const [head, separator, ...body] = rows;
  if (!separator.every(cell => /^:?-{3,}:?$/.test(cell))) {
    return lines.map(line => `<p>${renderInline(line)}</p>`).join('\n');
  }
  return `<div class="bp-table-wrap"><table>
    <thead><tr>${head.map(cell => `<th>${renderInline(cell)}</th>`).join('')}</tr></thead>
    <tbody>${body.map(row => `<tr>${row.map(cell => `<td>${renderInline(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
  </table></div>`;
}

function markdownToHtml(markdown) {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let paragraph = [];
  let list = [];
  let ordered = false;
  let table = [];

  function flushParagraph() {
    if (!paragraph.length) return;
    out.push(`<p>${renderInline(paragraph.join(' '))}</p>`);
    paragraph = [];
  }

  function flushTable() {
    if (!table.length) return;
    out.push(renderTable(table));
    table = [];
  }

  function flushAll() {
    flushParagraph();
    flushTable();
    if (list.length) out.push(flushList(list, ordered));
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushAll();
      continue;
    }
    if (/^\*\*\*$|^---$/.test(line)) {
      flushAll();
      out.push('<hr>');
      continue;
    }
    if (/^\|.+\|$/.test(line)) {
      flushParagraph();
      if (list.length) out.push(flushList(list, ordered));
      table.push(line);
      continue;
    }
    flushTable();
    // Image block from the Sanity editor: ![alt](src "caption")
    const img = line.match(/^!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]*)")?\)$/);
    if (img) {
      flushAll();
      out.push(`<figure class="bp-figure"><img src="${escapeHtml(img[2])}" alt="${escapeHtml(img[1])}" loading="lazy" decoding="async">${img[3] ? `<figcaption>${escapeHtml(img[3])}</figcaption>` : ''}</figure>`);
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      if (list.length) out.push(flushList(list, ordered));
      const level = Math.min(6, Math.max(2, heading[1].length));
      out.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }
    const ul = line.match(/^[-*]\s+(.+)$/);
    const ol = line.match(/^\d+\.\s+(.+)$/);
    if (ul || ol) {
      flushParagraph();
      const isOrdered = Boolean(ol);
      if (list.length && ordered !== isOrdered) out.push(flushList(list, ordered));
      ordered = isOrdered;
      list.push((ul || ol)[1]);
      continue;
    }
    if (/^>\s+/.test(line)) {
      flushAll();
      out.push(`<blockquote>${renderInline(line.replace(/^>\s+/, ''))}</blockquote>`);
      continue;
    }
    if (list.length) out.push(flushList(list, ordered));
    paragraph.push(line);
  }

  flushAll();
  return out.join('\n');
}

// Head tags: title/description/robots/canonical, Open Graph + X cards and
// JSON-LD (article + breadcrumbs + FAQs), all from the post's SEO fields
// (Sanity: SEO, Social and Advanced SEO tabs) with sensible fallbacks, so
// search engines and AI crawlers get them without running JS.
function seoTitleBase(p) { return p.seo_title || p.title; }
function crumbLabel(p) { return p.breadcrumb_title || p.title; }

function buildHeadBlock(p, ctx) {
  const base = seoTitleBase(p);
  const title = fitTitle([`${base} | PROPHUNT LLP Blog`, `${base} | PROPHUNT LLP`, `${base} | PROPHUNT`, base]);
  const desc  = p.seo_description || p.excerpt || '';
  const url   = `${SITE}${p.url}`;
  const canonical = p.canonical_url || url;
  const ogTitle = p.og_title || base;
  const ogDesc  = p.og_description || desc;
  const ogImage = absUrl(p.og_image || p.cover);
  const ogAlt   = p.og_image ? p.og_image_alt : (p.cover_alt || p.title);
  const twTitle = p.twitter_title || ogTitle;
  const twDesc  = p.twitter_description || ogDesc;
  const twImage = p.twitter_image ? absUrl(p.twitter_image) : ogImage;
  const twAlt   = p.twitter_image ? p.twitter_image_alt : ogAlt;
  const keywords = [...new Set([p.focus_keyword, ...p.secondary_keywords, ...p.tags].filter(Boolean))];
  const catLabel = CAT_LABELS[p.category] || 'Article';
  const published = p.date ? `${p.date}T09:00:00+05:30` : '';
  const modified  = p.updated && p.updated > p.date ? `${p.updated}T09:00:00+05:30` : published;

  const graph = [
    {
      '@type': p.schema_type,
      headline: p.title,
      description: desc,
      ...(p.cover || p.og_image ? { image: ogImage } : {}),
      datePublished: published,
      dateModified: modified,
      ...(keywords.length ? { keywords: keywords.join(', ') } : {}),
      articleSection: catLabel,
      inLanguage: 'en-IN',
      author: { '@type': 'Organization', name: p.author || 'PROPHUNT Advisory Team', url: `${SITE}/about` },
      publisher: { '@type': 'Organization', name: 'PROPHUNT LLP', url: SITE, logo: { '@type': 'ImageObject', url: `${SITE}/images/logo-black.png` } },
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
      ...(ctx.projects.length ? { about: ctx.projects.map(x => ({ '@type': 'Residence', name: x.title, url: `${SITE}${x.url}` })) } : {}),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog` },
        { '@type': 'ListItem', position: 3, name: catLabel, item: `${SITE}/blog?cat=${p.category}` },
        { '@type': 'ListItem', position: 4, name: crumbLabel(p), item: url },
      ],
    },
    ...(p.faqs.length ? [{
      '@type': 'FAQPage',
      mainEntity: p.faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    }] : []),
  ];

  return `<title id="ph-blog-title">${escapeHtml(title)}</title>
<meta id="ph-meta-desc" name="description" content="${escapeHtml(desc)}">
<meta name="robots" content="${escapeHtml(p.robots)}">
${keywords.length ? `<meta name="keywords" content="${escapeHtml(keywords.join(', '))}">\n` : ''}<meta id="ph-og-title"  property="og:title" content="${escapeHtml(ogTitle)}">
<meta id="ph-og-desc"  property="og:description" content="${escapeHtml(ogDesc)}">
<meta id="ph-og-img"   property="og:image" content="${escapeHtml(ogImage)}">
${ogAlt ? `<meta property="og:image:alt" content="${escapeHtml(ogAlt)}">\n` : ''}<meta property="og:type" content="article">
<meta property="og:url" content="${escapeHtml(canonical)}">
<meta property="og:site_name" content="PROPHUNT LLP">
<meta property="og:locale" content="en_IN">
${published ? `<meta property="article:published_time" content="${published}">\n<meta property="article:modified_time" content="${modified}">\n` : ''}<meta property="article:section" content="${escapeHtml(catLabel)}">
<meta name="twitter:card" content="${escapeHtml(p.twitter_card)}">
<meta name="twitter:title" content="${escapeHtml(twTitle)}">
<meta name="twitter:description" content="${escapeHtml(twDesc)}">
<meta name="twitter:image" content="${escapeHtml(twImage)}">
${twAlt ? `<meta name="twitter:image:alt" content="${escapeHtml(twAlt)}">\n` : ''}<link rel="canonical" id="ph-canonical" href="${escapeHtml(canonical)}">
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')}</script>`;
}

function priceText(x) {
  if (!x.price || Number(x.price) === 0) return 'Price on request';
  const n = Number(x.price);
  return n >= 100 ? `From ₹${(n / 100).toFixed(2).replace(/\.?0+$/, '')} Cr*` : `From ₹${n} L*`;
}

// Project cards for "Related Projects" (internal links to project pages).
function renderProjectCards(projects) {
  if (!projects.length) return '';
  return `<section class="bp-projects" aria-label="Projects in this article">
          <h2>Projects mentioned in this article</h2>
          <div class="bp-projects-grid">${projects.map(x => `
            <a class="bp-proj-card" href="${x.url}">
              <span class="bp-proj-img" style="background-image:url('${escapeHtml(x.thumb || x.cover || '')}')"></span>
              <span class="bp-proj-body">
                <span class="bp-proj-title">${escapeHtml(x.title)}</span>
                <span class="bp-proj-meta">${escapeHtml([x.developer, x.location].filter(Boolean).join(' · '))}</span>
                <span class="bp-proj-meta">${escapeHtml([x.config, priceText(x)].filter(Boolean).join(' · '))}</span>
              </span>
            </a>`).join('')}
          </div>
        </section>`;
}

function renderFaqs(faqs) {
  if (!faqs.length) return '';
  return `<section class="bp-faqs" aria-label="Frequently asked questions">
          <h2>Frequently asked questions</h2>
          ${faqs.map(f => `<details class="bp-faq"><summary>${escapeHtml(f.q)}</summary><p>${renderInline(f.a)}</p></details>`).join('\n          ')}
        </section>`;
}

const CAT_ICONS = { market: 'fas fa-chart-line', buyer: 'fas fa-home', investment: 'fas fa-coins', legal: 'fas fa-file-contract', nri: 'fas fa-globe' };

// The full article page, rendered at build time. blog/post.html's script sees
// data-prerendered and only wires up the enquiry form, so Google and visitors
// get the same HTML with no client-side Markdown rendering.
function buildPrerenderBlock(p, ctx) {
  const catLabel = CAT_LABELS[p.category] || p.category || 'Article';
  const mins = p.readTime || estimateReadTime(p.body || '');
  const bodyHtml = markdownToHtml(p.body || '');
  const tagsHtml = p.tags && p.tags.length
    ? `<div class="bp-tags"><span style="font-family:'Open Sans',sans-serif;font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#6b7280;margin-right:6px;align-self:center">Tags:</span>${p.tags.map(t => `<span class="bp-tag"><i class="fas fa-tag" style="font-size:9px"></i>${escapeHtml(t)}</span>`).join('')}</div>`
    : '';
  const pageUrl = encodeURIComponent(`${SITE}${p.url}`);
  const pageTitle = encodeURIComponent(p.title);
  const relatedHtml = ctx.related.length
    ? ctx.related.map(r => `
          <div class="bp-related-item">
            <a href="${r.url}" class="bp-related-img" style="background-image:url('${escapeHtml(r.cover || '')}')" aria-label="${escapeHtml(r.title)}"></a>
            <div>
              <div class="bp-related-cat">${escapeHtml(CAT_LABELS[r.category] || r.category)}</div>
              <div class="bp-related-title"><a href="${r.url}">${escapeHtml(r.title)}</a></div>
              <div class="bp-related-date">${escapeHtml(fmtDate(r.date))}</div>
            </div>
          </div>`).join('')
    : '<p style="font-size:13px;color:#9ca3af;text-align:center;padding:8px 0">More articles coming soon.</p>';

  return `<div data-prerendered="1">
    <div class="bp-header">
      <div class="bp-header-inner">
        <div class="bp-meta-row">
          <a class="bp-cat-badge" href="/blog?cat=${escapeHtml(p.category)}"><i class="${CAT_ICONS[p.category] || 'fas fa-newspaper'}" style="font-size:9px"></i>${escapeHtml(catLabel)}</a>
          <span class="bp-meta-item"><i class="fas fa-calendar-alt"></i><time datetime="${escapeHtml(p.date)}">${escapeHtml(fmtDate(p.date))}</time></span>
          ${p.updated && p.updated > p.date ? `<span class="bp-meta-item"><i class="fas fa-rotate"></i>Updated <time datetime="${escapeHtml(p.updated)}">${escapeHtml(fmtDate(p.updated))}</time></span>` : ''}
          <span class="bp-meta-item"><i class="fas fa-user-circle"></i>${escapeHtml(p.author || 'PROPHUNT Advisory Team')}</span>
          <span class="bp-meta-item"><i class="fas fa-clock"></i>${mins} min read</span>
        </div>
        <h1 class="bp-title">${escapeHtml(p.title)}</h1>
        ${p.excerpt ? `<p class="bp-excerpt">${escapeHtml(p.excerpt)}</p>` : ''}
      </div>
    </div>

    <div class="bp-cover-wrap">
      ${p.cover
        ? `<img src="${escapeHtml(p.cover)}" alt="${escapeHtml(p.cover_alt || p.title)}" width="1200" height="630" fetchpriority="high">`
        : `<div class="bp-cover-placeholder"><i class="${CAT_ICONS[p.category] || 'fas fa-newspaper'}"></i></div>`}
    </div>

    <div class="bp-layout">
      <article class="bp-article">
        <div class="bp-body" id="bp-body-content">${bodyHtml}</div>
        ${renderFaqs(p.faqs)}
        ${renderProjectCards(ctx.projects)}
        ${tagsHtml}
        <div class="bp-share">
          <span class="bp-share-label">Share:</span>
          <a href="https://wa.me/?text=${pageTitle}%20${pageUrl}" target="_blank" rel="noopener" class="bp-share-btn bp-share-wa"><i class="fab fa-whatsapp"></i> WhatsApp</a>
          <a href="https://twitter.com/intent/tweet?text=${pageTitle}&amp;url=${pageUrl}" target="_blank" rel="noopener" class="bp-share-btn bp-share-tw"><i class="fab fa-x-twitter"></i> Tweet</a>
          <a href="https://www.linkedin.com/shareArticle?mini=true&amp;url=${pageUrl}&amp;title=${pageTitle}" target="_blank" rel="noopener" class="bp-share-btn bp-share-li"><i class="fab fa-linkedin-in"></i> LinkedIn</a>
          <button type="button" onclick="navigator.clipboard.writeText(location.href);this.textContent='✓ Copied!';setTimeout(()=>this.textContent='Copy Link',2000)" class="bp-share-btn bp-share-copy"><i class="fas fa-link"></i> Copy Link</button>
        </div>
        <div class="bp-article-cta">
          <h3>Looking to Buy a Home in Pune?</h3>
          <p>Talk to a PROPHUNT advisor - free consultation, no pressure, just clarity on pricing &amp; best projects.</p>
          <a href="/contact">Book a Free Consultation</a>
        </div>
        <p class="bp-more-links"><a href="/blog">More guides on the PROPHUNT blog</a> · <a href="/projects">All projects in Pune</a> · <a href="/location">Browse by location</a></p>
      </article>

      <aside class="bp-sidebar">
        <div class="bp-widget">
          <div class="bp-widget-head"><i class="fas fa-calendar-check"></i> Book a Site Visit</div>
          <div class="bp-widget-body">
            <form id="bpEnqForm">
              <div class="bp-enq-field"><input type="text" name="name" placeholder="Your Name *" required aria-label="Your name"></div>
              <div class="bp-enq-field"><input type="tel" name="phone" placeholder="Phone Number *" required aria-label="Phone number"></div>
              <div class="bp-enq-field"><input type="email" name="email" placeholder="Email Address" aria-label="Email address"></div>
              <div class="bp-enq-field">
                <select name="interest" aria-label="I'm interested in">
                  <option value="" disabled selected>I'm interested in…</option>
                  <option>2 BHK Apartment</option>
                  <option>3 BHK Apartment</option>
                  <option>Villa / Row House</option>
                  <option>Plot</option>
                  <option>Commercial Property</option>
                  <option>General Advisory</option>
                </select>
              </div>
              <button type="submit" class="bp-enq-submit">Get Free Advice →</button>
              <p class="bp-enq-note"><i class="fas fa-lock" style="font-size:9px"></i> 100% private, no spam</p>
            </form>
          </div>
        </div>

        <div class="bp-widget">
          <div class="bp-widget-head"><i class="fas fa-newspaper"></i> Related Articles</div>
          <div class="bp-widget-body">${relatedHtml}</div>
        </div>

        <div class="bp-widget">
          <div class="bp-widget-head"><i class="fas fa-layer-group"></i> Categories</div>
          <div class="bp-widget-body">
            ${Object.entries(LISTING_CAT_LABELS).map(([k, v]) => `<a class="bp-cat-item" href="/blog?cat=${k}"><span class="left"><i class="${CAT_ICONS[k] || 'fas fa-circle'}"></i>${v}</span><span class="bp-cat-count">${ctx.catCounts[k] || 0}</span></a>`).join('\n            ')}
          </div>
        </div>

        <div class="bp-widget" style="background:#0f1b2d;border-color:#0f1b2d">
          <div style="padding:20px 18px;text-align:center;color:#fff">
            <i class="fas fa-building" style="font-size:24px;color:#C8362B;margin-bottom:10px;display:block"></i>
            <div style="font-family:'Open Sans',sans-serif;font-size:14px;font-weight:700;margin-bottom:6px">Explore New Projects</div>
            <p style="font-size:12.5px;color:rgba(255,255,255,.65);margin-bottom:14px">Verified listings across Pune, apartments, plots &amp; villas</p>
            <a href="/projects" style="display:block;padding:10px;background:#C8362B;color:#fff;border-radius:6px;font-family:'Open Sans',sans-serif;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;text-decoration:none">View All Projects</a>
          </div>
        </div>
      </aside>
    </div>
  </div>`;
}

// A post with a Redirect Destination becomes an instant redirect page
// (canonical + meta refresh + JS), left out of the sitemap and the listing.
function buildRedirectPage(p) {
  const to = /^https?:\/\//.test(p.redirect_url) ? p.redirect_url : `${SITE}${p.redirect_url.startsWith('/') ? '' : '/'}${p.redirect_url}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Moved | PROPHUNT LLP</title>
<meta name="robots" content="noindex, follow">
<link rel="canonical" href="${escapeHtml(to)}">
<meta http-equiv="refresh" content="0; url=${escapeHtml(to)}">
<script>location.replace(${JSON.stringify(to)});</script>
</head>
<body><p>This article has moved to <a href="${escapeHtml(to)}">${escapeHtml(to)}</a>.</p></body>
</html>
`;
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

const DEFAULT_ROBOTS = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';

function parseFaqs(json, slug) {
  if (!json) return [];
  try {
    return JSON.parse(json).filter(f => f && f.q && f.a);
  } catch {
    console.warn(`  ⚠ ${slug}: faqs_json is not valid JSON, skipping FAQs`);
    return [];
  }
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
    // SEO fields written by scripts/sanity-pull.js (all optional).
    updated:            meta.updated || '',
    cover_alt:          meta.cover_alt || '',
    secondary_keywords: Array.isArray(meta.secondary_keywords) ? meta.secondary_keywords : [],
    breadcrumb_title:   meta.breadcrumb_title || '',
    og_title:           meta.og_title || '',
    og_description:     meta.og_description || '',
    og_image:           meta.og_image || '',
    og_image_alt:       meta.og_image_alt || '',
    twitter_card:       meta.twitter_card || 'summary_large_image',
    twitter_title:      meta.twitter_title || '',
    twitter_description: meta.twitter_description || '',
    twitter_image:      meta.twitter_image || '',
    twitter_image_alt:  meta.twitter_image_alt || '',
    canonical_url:      meta.canonical_url || '',
    schema_type:        ['Article', 'NewsArticle'].includes(meta.schema_type) ? meta.schema_type : 'BlogPosting',
    robots:             meta.robots || DEFAULT_ROBOTS,
    redirect_url:       meta.redirect_url || '',
    related_projects:   Array.isArray(meta.related_projects) ? meta.related_projects : [],
    faqs:               parseFaqs(meta.faqs_json, fileSlug),
    // Left out of sitemap.xml: noindex, excluded by hand, or redirected away.
    in_sitemap: !/noindex/.test(meta.robots || '') && meta.exclude_from_sitemap !== 'true' && !meta.redirect_url,
    body,
  };
});

// Filenames aren't reliably date-prefixed (only the oldest post is), so a
// filename sort can't be trusted for "newest first" — order by the actual
// publish date. Stable tiebreak on filename keeps the output deterministic.
posts.sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.slug.localeCompare(a.slug));

// Redirected posts get a redirect page only: no card, no sitemap entry.
const listed = posts.filter(p => !p.redirect_url);
const publicPosts = listed.map(({ body, faqs, ...post }) => post);
fs.writeFileSync(OUT_FILE, JSON.stringify(publicPosts, null, 2));
console.log(`Built posts.json — ${listed.length} post(s)`);

// Projects for "Related Projects" cards (built by build-properties.js, which runs first).
const PROPERTIES_JSON = path.join(__dirname, '..', 'properties', 'posts.json');
const propertyBySlug = new Map((fs.existsSync(PROPERTIES_JSON) ? JSON.parse(fs.readFileSync(PROPERTIES_JSON, 'utf8')) : []).map(x => [x.slug, x]));
const catCounts = {};
listed.forEach(p => { catCounts[p.category] = (catCounts[p.category] || 0) + 1; });

function contextFor(p) {
  const projects = p.related_projects.map(s => {
    const x = propertyBySlug.get(s);
    if (!x) console.warn(`  ⚠ ${p.slug}: related project "${s}" not found`);
    return x;
  }).filter(Boolean);
  // Same category first, then the newest others: always 3 internal links.
  const others = listed.filter(r => r.slug !== p.slug);
  const related = [...others.filter(r => r.category === p.category), ...others.filter(r => r.category !== p.category)].slice(0, 3);
  return { projects, related, catCounts };
}

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

    if (p.redirect_url) {
      fs.writeFileSync(path.join(outDir, 'index.html'), buildRedirectPage(p));
      console.log(`  → blog/${p.urlSlug}/index.html (redirects to ${p.redirect_url})`);
      return;
    }
    const ctx = contextFor(p);
    let html = template.replace(INJECT_MARKER, `const fileSlug = '${p.slug}';`);
    html = html.replace(HEAD_MARKER, buildHeadBlock(p, ctx));
    html = html.replace(LOADING_MARKER, buildPrerenderBlock(p, ctx));
    html = html.replace('<span id="bp-crumb" style="color:#1f2937;font-weight:500">Loading…</span>',
      `<a href="/blog?cat=${escapeHtml(p.category)}">${escapeHtml(CAT_LABELS[p.category] || 'Articles')}</a>
    <span class="sep">/</span>
    <span id="bp-crumb" style="color:#1f2937;font-weight:500" aria-current="page">${escapeHtml(crumbLabel(p))}</span>`);

    fs.writeFileSync(path.join(outDir, 'index.html'), html.replace(/[ \t]+$/gm, ''));
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

  // All three replacements below are anchored on a stable opening tag /
  // sibling boundary rather than an exact match on the pristine
  // placeholder content — an exact match only ever fires once; every
  // rebuild after the first would silently leave these sections holding
  // whatever they held at that first build forever (see the identical fix
  // for projects.html's grid in build-properties.js).
  const cardsHtml = listed.map((p, i) => renderListingCard(p, i === 0)).join('');
  html = html.replace(
    /<div class="blog-grid" id="blogGrid">[\s\S]*?(?=<div class="coming-soon-banner")/,
    `<div class="blog-grid" id="blogGrid">${cardsHtml}</div>\n\n        `
  );

  html = html.replace(
    /[ \t]*<div class="sidebar-cats">[\s\S]*?<\/div>/,
    buildSidebarCatsBlock(listed)
  );

  const popularHtml = `<div class="sidebar-box">
          <div class="sidebar-box-title">Popular Guides</div>
          <div>
${listed.slice(0, 3).map(renderMini).join('\n')}
          </div>
        </div>`;
  html = html.replace(
    /<div class="sidebar-box">\s*<div class="sidebar-box-title">Popular[\s\S]*?(?=<div class="sidebar-box" style="background:var\(--black\))/,
    `${popularHtml}\n\n        `
  );

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
        numberOfItems: listed.length,
        itemListElement: listed.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.title, item: `${SITE}${p.url}` })),
      },
    ],
  };
  html = html.replace(/<script type="application\/ld\+json">\n\{[\s\S]*?\n\}\n<\/script>/, `<script type="application/ld+json">\n${JSON.stringify(listingJsonLd, null, 2)}\n</script>`);

  fs.writeFileSync(listingPagePath, html);
  console.log(`Prerendered blog/index.html — ${listed.length} article cards`);
}

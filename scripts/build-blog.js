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

function stripHeadingNumber(text) {
  return String(text).replace(/^(\*\*)?\s*\d{1,2}[.)]\s+/, '$1');
}

function plainHeading(text) {
  return String(text).replace(/[*`]/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').trim();
}

// Anchor ids for H2s ("In this article" links). Same input -> same ids.
function headingId(text, seen) {
  const base = String(text).toLowerCase().replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'section';
  const n = (seen.get(base) || 0) + 1;
  seen.set(base, n);
  return n > 1 ? `${base}-${n}` : base;
}

function markdownToHtml(markdown) {
  const ids = new Map();
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
      if (level === 2) {
        // Section headings are numbered by the page (01, 02 …), so drop a
        // hand-typed "1. " to avoid "02 1. Baner".
        const text = stripHeadingNumber(heading[2]);
        out.push(`<h2 id="${headingId(plainHeading(text), ids)}">${renderInline(text)}</h2>`);
      } else {
        out.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      }
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
  if (!x.price || Number(x.price) === 0) return 'Price on Request';
  const n = Number(x.price);
  return n >= 100 ? `From ₹${(n / 100).toFixed(2).replace(/\.?0+$/, '')} Cr*` : `From ₹${n} L*`;
}

const CAT_ICONS = { market: 'fas fa-chart-line', buyer: 'fas fa-home', investment: 'fas fa-coins', legal: 'fas fa-file-contract', nri: 'fas fa-globe' };
const BLOG_AUTHOR_BIO = 'The PROPHUNT LLP advisory team helps homebuyers and investors in Pune shortlist developer-backed projects, compare pricing and verify approvals. PROPHUNT LLP is a MahaRERA-registered real estate agent (A52100037156). Articles are for general information; check current prices, approvals and registration details before you book.';

// Fixed-ratio image (css/blog.css: 1200 x 630). Sanity CDN images get a
// right-sized rendition; repo images are used as they are.
function mediaHtml(src, alt, { eager = false, width = 1200 } = {}) {
  if (!src) return `<span class="bl-media bl-media-empty" aria-hidden="true"><i class="fas fa-newspaper"></i></span>`;
  const url = /^https:\/\/cdn\.sanity\.io\/images\//.test(src) ? `${src.replace(/\?.*$/, '')}?w=${width}&h=${Math.round(width * 630 / 1200)}&fit=crop&auto=format&q=80` : src;
  return `<span class="bl-media"><img src="${escapeHtml(url)}" alt="${escapeHtml(alt || '')}" width="1200" height="630" ${eager ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'}></span>`;
}

// One card component for the listing grid and "Suggested articles".
function postCard(p, num) {
  return `<a class="bl-card" href="${p.url}" data-cat="${escapeHtml(p.category)}" data-search="${escapeHtml([p.title, p.excerpt, ...(p.tags || [])].join(' ').toLowerCase())}">
        ${mediaHtml(p.cover, p.cover_alt || p.title, { width: 800 })}
        ${num ? `<span class="bl-card-num">${String(num).padStart(2, '0')}</span>` : ''}
        <span class="bl-card-body">
          <span class="bl-card-top"><span class="bl-card-cat">${escapeHtml(CAT_LABELS[p.category] || 'Article')}</span><span class="bl-card-read">${p.readTime} min read</span></span>
          <h3>${escapeHtml(p.title)}</h3>
          <p>${escapeHtml(p.excerpt)}</p>
          <span class="bl-card-foot"><span>${escapeHtml(fmtDate(p.date))} · ${escapeHtml(p.author || 'PROPHUNT Advisory Team')}</span><span class="bl-more">Read →</span></span>
        </span>
      </a>`;
}

function crumbsHtml(items) {
  return `<nav class="bl-crumbs" aria-label="Breadcrumb">${items.map((c, i) => i === items.length - 1
    ? `<span aria-current="page">${escapeHtml(c.name)}</span>`
    : `<a href="${c.url}">${escapeHtml(c.name)}</a><span class="sep">/</span>`).join('')}</nav>`;
}

function ctaBand() {
  return `<section class="bl-cta">
      <div>
        <h2>Looking to buy a home in Pune?</h2>
        <p>Tell us your budget, location and timeline. A PROPHUNT advisor will shortlist developer-backed projects, share current cost sheets and arrange site visits, free for buyers.</p>
      </div>
      <div class="bl-cta-actions">
        <a class="bl-btn bl-btn-primary" href="/contact">Book a free consultation <i class="fas fa-arrow-right"></i></a>
        <a class="bl-btn bl-btn-ghost" href="https://wa.me/917447430431?text=${encodeURIComponent('Hi PROPHUNT LLP, I read your blog and would like advice on buying a property in Pune.')}" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> WhatsApp us</a>
      </div>
    </section>`;
}

// "In this article": the post's H2s (ids come from markdownToHtml).
function tocFromMarkdown(md) {
  const seen = new Map();
  return String(md || '').split(/\r?\n/).map(l => l.match(/^#{1,2}\s+(.+)$/)).filter(Boolean).map(m => {
    const text = plainHeading(stripHeadingNumber(m[1]));
    return { text, id: headingId(text, seen) };
  });
}

function renderProjectCards(projects) {
  if (!projects.length) return '';
  return `<section class="bl-projects" aria-label="Projects in this article">
          <h2>Projects mentioned in this article</h2>
          <div class="bl-proj-grid">${projects.map(x => `
            <a class="bl-proj" href="${x.url}">
              ${mediaHtml(x.thumb || x.cover, x.title, { width: 640 })}
              <span class="bl-proj-body">
                <strong>${escapeHtml(x.title)}</strong>
                <span>${escapeHtml([x.developer, x.location].filter(Boolean).join(' · '))}</span>
                <span>${escapeHtml([x.config, priceText(x)].filter(Boolean).join(' · '))}</span>
              </span>
            </a>`).join('')}
          </div>
        </section>`;
}

function renderFaqs(faqs) {
  if (!faqs.length) return '';
  return `<section class="bl-faqs" aria-label="Frequently asked questions">
          <h2>Frequently asked questions</h2>
          ${faqs.map(f => `<details class="bl-faq"><summary>${escapeHtml(f.q)}</summary><p>${renderInline(f.a)}</p></details>`).join('\n          ')}
        </section>`;
}

// The full article page, rendered at build time (layout modelled on
// vistrow.com/blog). blog/post.html's script only wires up the form, the
// copy-link button and the table of contents.
function buildPrerenderBlock(p, ctx) {
  const catLabel = CAT_LABELS[p.category] || 'Article';
  const mins = p.readTime || estimateReadTime(p.body || '');
  const toc = tocFromMarkdown(p.body);
  const pageUrl = encodeURIComponent(`${SITE}${p.url}`);
  const pageTitle = encodeURIComponent(p.title);
  const crumbs = [{ name: 'Home', url: '/' }, { name: 'Blog', url: '/blog' }, { name: catLabel, url: `/blog?cat=${p.category}` }, { name: crumbLabel(p) }];

  return `<div data-prerendered="1">
  <div class="bl-wrap">
    ${crumbsHtml(crumbs)}
    <div class="bl-post">
      <article class="bl-post-main">
        <a class="bl-pill" href="/blog?cat=${escapeHtml(p.category)}">${escapeHtml(catLabel)}</a>
        <h1>${escapeHtml(p.title)}</h1>
        <div class="bl-byline">
          <div class="bl-author">
            <span class="bl-avatar" aria-hidden="true">PH</span>
            <div><strong>${escapeHtml(p.author || 'PROPHUNT Advisory Team')}</strong>
            <span><time datetime="${escapeHtml(p.date)}">${escapeHtml(fmtDate(p.date))}</time>${p.updated && p.updated > p.date ? ` · Updated <time datetime="${escapeHtml(p.updated)}">${escapeHtml(fmtDate(p.updated))}</time>` : ''} · ${mins} min read</span></div>
          </div>
          <div class="bl-share" aria-label="Share this article">
            <a href="https://wa.me/?text=${pageTitle}%20${pageUrl}" target="_blank" rel="noopener" aria-label="Share on WhatsApp"><i class="fab fa-whatsapp"></i></a>
            <a href="https://www.linkedin.com/shareArticle?mini=true&amp;url=${pageUrl}&amp;title=${pageTitle}" target="_blank" rel="noopener" aria-label="Share on LinkedIn"><i class="fab fa-linkedin-in"></i></a>
            <a href="https://www.facebook.com/sharer/sharer.php?u=${pageUrl}" target="_blank" rel="noopener" aria-label="Share on Facebook"><i class="fab fa-facebook-f"></i></a>
            <a href="https://twitter.com/intent/tweet?text=${pageTitle}&amp;url=${pageUrl}" target="_blank" rel="noopener" aria-label="Share on X"><i class="fab fa-x-twitter"></i></a>
            <button type="button" data-copy-link aria-label="Copy link"><i class="fas fa-link"></i></button>
          </div>
        </div>
        ${p.excerpt ? `<p class="bl-lead">${escapeHtml(p.excerpt)}</p>` : ''}
        ${p.cover ? `<figure class="bl-hero-img">${mediaHtml(p.cover, p.cover_alt || p.title, { eager: true })}</figure>` : ''}
        <div class="bl-body">${markdownToHtml(p.body || '')}</div>
        ${renderFaqs(p.faqs)}
        ${renderProjectCards(ctx.projects)}
        ${p.tags && p.tags.length ? `<div class="bl-tags"><strong style="font-size:13px">Tags:</strong>${p.tags.map(t => `<span>${escapeHtml(t)}</span>`).join('')}</div>` : ''}
        <div class="bl-author-box">
          <span class="bl-avatar" aria-hidden="true">PH</span>
          <div><strong>About ${escapeHtml(p.author || 'PROPHUNT Advisory Team')}</strong><p>${escapeHtml(BLOG_AUTHOR_BIO)}</p></div>
        </div>
      </article>

      <aside class="bl-side">
        <div class="bl-side-card">
          <h2>Explore the blog</h2>
          <form class="bl-search" action="/blog" method="get" role="search">
            <i class="fas fa-search" aria-hidden="true"></i>
            <input type="search" name="q" placeholder="Search articles…" aria-label="Search articles">
          </form>
          <div class="bl-side-sub">Category</div>
          <select id="blCatSelect" aria-label="Browse a category">
            <option value="/blog">All categories (${ctx.total})</option>
            ${Object.entries(LISTING_CAT_LABELS).filter(([k]) => ctx.catCounts[k] || k === p.category).map(([k, v]) => `<option value="/blog?cat=${k}"${k === p.category ? ' selected' : ''}>${escapeHtml(v)} (${ctx.catCounts[k] || 0})</option>`).join('')}
          </select>
          ${toc.length ? `<div class="bl-side-sub">In this article</div>
          <ol class="bl-toc">${toc.map((h, i) => `<li><span>${String(i + 1).padStart(2, '0')}</span><a href="#${h.id}">${escapeHtml(h.text)}</a></li>`).join('')}</ol>` : ''}
          ${ctx.related.length ? `<div class="bl-side-sub">Suggested reading</div>
          <div class="bl-side-list">${ctx.related.map(r => `<a href="${r.url}"><small>${escapeHtml(CAT_LABELS[r.category] || 'Article')}</small><strong>${escapeHtml(r.title)}</strong><em>${r.readTime} min read</em></a>`).join('')}</div>` : ''}
        </div>

        <div class="bl-side-card bl-side-form">
          <h2>Book a site visit</h2>
          <form id="bpEnqForm">
            <div class="bp-enq-field"><input type="text" name="name" placeholder="Your name *" required aria-label="Your name"></div>
            <div class="bp-enq-field"><input type="tel" name="phone" placeholder="Phone number *" required aria-label="Phone number"></div>
            <div class="bp-enq-field"><input type="email" name="email" placeholder="Email address" aria-label="Email address"></div>
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
            <button type="submit" class="bp-enq-submit">Get free advice →</button>
            <p class="bp-enq-note"><i class="fas fa-lock" style="font-size:9px"></i> 100% private, no spam</p>
          </form>
        </div>
      </aside>
    </div>

    ${ctx.related.length ? `<section class="bl-related">
      <div class="bl-section-head"><span class="bl-eyebrow">Keep reading</span><h2>Suggested articles for you</h2><p>More guides on buying, investing and the paperwork in Pune.</p></div>
      <div class="bl-grid">${ctx.related.map(r => postCard(r)).join('')}</div>
    </section>` : ''}
    ${ctaBand()}
  </div>
  </div>`;
}

// /blog listing: hero + search, topic chips, featured story, card grid, CTA.
function buildListingBlock(listed, catCounts) {
  const [first, ...rest] = listed;
  const topics = Object.keys(LISTING_CAT_LABELS).filter(k => catCounts[k]).length;
  return `<!--BLOG-LISTING-START-->
<main class="bl-page">
  <div class="bl-wrap">
    ${crumbsHtml([{ name: 'Home', url: '/' }, { name: 'Blog' }])}
    <section class="bl-hero">
      <div>
        <span class="bl-eyebrow"><i class="fas fa-newspaper" aria-hidden="true"></i>PROPHUNT Insights</span>
        <h1>Pune property, <em>explained clearly.</em></h1>
        <p>Buyer guides, market notes and the paperwork that matters, from the PROPHUNT LLP advisory team in Baner, Pune.</p>
      </div>
      <div class="bl-search-card">
        <label for="blSearch">What do you want to know?</label>
        <div class="bl-search"><i class="fas fa-search" aria-hidden="true"></i><input id="blSearch" type="search" placeholder="Search guides, areas, topics…" autocomplete="off"></div>
        <div class="bl-stats"><div><strong>${listed.length}</strong><span>Guides</span></div><div><strong>${topics}</strong><span>Topics</span></div></div>
      </div>
    </section>
  </div>

  <div class="bl-chips-bar">
    <div class="bl-wrap bl-chips" role="toolbar" aria-label="Filter by topic">
      <span class="bl-chips-label">Browse</span>
      <button class="bl-chip active" data-cat="all" type="button">All articles <span class="n">${listed.length}</span></button>
      ${Object.entries(LISTING_CAT_LABELS).filter(([k]) => catCounts[k]).map(([k, v]) => `<button class="bl-chip" data-cat="${k}" type="button">${escapeHtml(v)} <span class="n">${catCounts[k] || 0}</span></button>`).join('\n      ')}
    </div>
  </div>

  <div class="bl-wrap">
    ${first ? `<section class="bl-block" id="blFeatured">
      <div class="bl-section-head"><span class="bl-eyebrow">Latest</span><h2>Start with the latest</h2></div>
      <a class="bl-featured" href="${first.url}" data-cat="${escapeHtml(first.category)}" data-search="${escapeHtml([first.title, first.excerpt, ...(first.tags || [])].join(' ').toLowerCase())}">
        <span class="bl-featured-body">
          <span class="bl-meta"><span class="bl-pill">${escapeHtml(CAT_LABELS[first.category] || 'Article')}</span>${first.readTime} min read · ${escapeHtml(fmtDate(first.date))}</span>
          <h3>${escapeHtml(first.title)}</h3>
          <p>${escapeHtml(first.excerpt)}</p>
          <span class="bl-more">Read the guide →</span>
        </span>
        <span class="bl-featured-media">${mediaHtml(first.cover, first.cover_alt || first.title, { eager: true })}<span class="bl-featured-tag">Featured</span></span>
      </a>
    </section>` : ''}

    <section class="bl-block" style="padding-top:0">
      <div class="bl-section-head"><span class="bl-eyebrow">All guides</span><h2>Keep exploring</h2></div>
      <div class="bl-grid" id="blogGrid">
        ${rest.map((p, i) => postCard(p, i + 2)).join('\n        ')}
        <p class="bl-empty" id="blEmpty" hidden>No articles match that yet. Try another topic, or <a href="/contact">ask our advisors</a>.</p>
      </div>
    </section>

    ${ctaBand()}
  </div>
</main>
<!--BLOG-LISTING-END-->`;
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

// Category labels used on the blog listing (chips, sidebar select).
const LISTING_CAT_LABELS = { market: 'Market Reports', buyer: 'Buyer Guides', investment: 'Investment', legal: 'Legal & Docs', nri: 'NRI Corner' };

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
  return { projects, related, catCounts, total: listed.length };
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

  // Everything between the markers is generated (hero, topic chips,
  // featured story, card grid, CTA); blog/index.html keeps the head, nav,
  // footer and the small filter/search script.
  const LISTING_BLOCK = /<!--BLOG-LISTING-START-->[\s\S]*<!--BLOG-LISTING-END-->/;
  if (!LISTING_BLOCK.test(html)) throw new Error('blog/index.html: BLOG-LISTING markers missing');
  html = html.replace(LISTING_BLOCK, () => buildListingBlock(listed, catCounts));

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

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://www.prophuntllp.com';
const POSTS_DIR = path.join(__dirname, '..', 'blog', 'posts');
const BLOG_DIR = path.join(__dirname, '..', 'blog');
const OUT_FILE = path.join(BLOG_DIR, 'posts.json');
const SITEMAP_FILE = path.join(__dirname, '..', 'sitemap.xml');

const CAT_LABELS = {
  market: 'Market Report',
  buyer: 'Buyer Guide',
  investment: 'Investment',
  legal: 'Legal & Docs',
  nri: 'NRI Corner',
  general: 'Article',
};

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };

  const meta = {};
  match[1].split('\n').forEach((line) => {
    const index = line.indexOf(':');
    if (index === -1) return;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^["']|["']$/g, '');
    if (key) meta[key] = value;
  });

  return { meta, body: match[2].trim() };
}

function estimateReadTime(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function stripMarkdown(text) {
  return text
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#>*_`~-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderInline(text) {
  return escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

function flushList(html, list) {
  if (!list.items.length) return;
  html.push(`<${list.type}>`);
  list.items.forEach((item) => html.push(`<li>${renderInline(item)}</li>`));
  html.push(`</${list.type}>`);
  list.items = [];
}

function renderMarkdown(markdown) {
  const html = [];
  const lines = markdown.split(/\r?\n/);
  const list = { type: 'ul', items: [] };
  let paragraph = [];

  function flushParagraph() {
    if (!paragraph.length) return;
    html.push(`<p>${renderInline(paragraph.join(' '))}</p>`);
    paragraph = [];
  }

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList(html, list);
      return;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList(html, list);
      const level = Math.min(heading[1].length + 1, 4);
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      return;
    }

    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      if (list.items.length && list.type !== 'ul') flushList(html, list);
      list.type = 'ul';
      list.items.push(bullet[1]);
      return;
    }

    const numbered = trimmed.match(/^\d+\.\s+(.+)$/);
    if (numbered) {
      flushParagraph();
      if (list.items.length && list.type !== 'ol') flushList(html, list);
      list.type = 'ol';
      list.items.push(numbered[1]);
      return;
    }

    paragraph.push(trimmed);
  });

  flushParagraph();
  flushList(html, list);
  return html.join('\n');
}

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function createPostHtml(post, body) {
  const title = escapeHtml(`${post.title} | PROPHUNT LLP Blog`);
  const description = escapeHtml(post.excerpt);
  const canonical = `${SITE_URL}/blog/${post.slug}`;
  const cover = post.cover ? (post.cover.startsWith('http') ? post.cover : `${SITE_URL}${post.cover}`) : `${SITE_URL}/images/logo-black.png`;
  const category = escapeHtml(CAT_LABELS[post.category] || post.category || 'Article');
  const articleHtml = renderMarkdown(body);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    author: { '@type': 'Organization', name: post.author },
    publisher: {
      '@type': 'Organization',
      name: 'PROPHUNT LLP',
      url: SITE_URL,
      logo: `${SITE_URL}/images/logo-black.png`,
    },
    mainEntityOfPage: canonical,
    image: cover,
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="article">
<meta property="og:url" content="${canonical}">
<meta property="og:title" content="${escapeHtml(post.title)}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${escapeHtml(cover)}">
<meta property="og:site_name" content="PROPHUNT LLP">
<meta property="og:locale" content="en_IN">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(post.title)}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${escapeHtml(cover)}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
<link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32.png">
<meta name="theme-color" content="#C8362B">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Lora:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<link rel="stylesheet" href="/css/style.css">
<link rel="stylesheet" href="/css/pages.css">
<style>
.post-hero { background: var(--black); color: #fff; padding: calc(var(--nav-h) + 3rem) 0 3rem; }
.post-hero-inner, .post-body-wrap { max-width: 820px; margin: 0 auto; padding-left: 1.5rem; padding-right: 1.5rem; }
.post-meta-row { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
.post-cat { display: inline-flex; align-items: center; gap: .4rem; background: var(--red); color: #fff; font-size: .75rem; font-weight: 700; padding: .3rem .85rem; border-radius: 99px; text-transform: uppercase; letter-spacing: .06em; }
.post-date, .post-author, .post-read { font-size: .82rem; color: rgba(255,255,255,.6); display: flex; align-items: center; gap: .35rem; }
.post-title { font-size: clamp(2rem, 5vw, 3.25rem); font-weight: 800; line-height: 1.12; margin-bottom: 1rem; }
.post-excerpt { font-size: 1.08rem; color: rgba(255,255,255,.72); line-height: 1.75; }
.post-cover { width: 100%; max-height: 520px; object-fit: cover; display: block; }
.post-body-wrap { padding-top: 3rem; padding-bottom: 5rem; }
.post-back { display: inline-flex; align-items: center; gap: .5rem; font-size: .875rem; color: var(--gray-500); font-weight: 500; margin-bottom: 2.5rem; transition: color .2s; }
.post-back:hover { color: var(--red); }
.post-body h2 { font-size: 1.55rem; font-weight: 800; margin: 2.4rem 0 .9rem; color: var(--black); }
.post-body h3 { font-size: 1.22rem; font-weight: 800; margin: 2rem 0 .7rem; color: var(--black); }
.post-body h4 { font-size: 1.08rem; font-weight: 800; margin: 1.6rem 0 .65rem; color: var(--black); }
.post-body p, .post-body li { font-size: 1.03rem; line-height: 1.85; color: var(--gray-700); }
.post-body p { margin-bottom: 1.25rem; }
.post-body ul, .post-body ol { padding-left: 1.4rem; margin-bottom: 1.35rem; }
.post-body li { margin-bottom: .45rem; }
.post-body strong { color: var(--black); font-weight: 800; }
.post-cta { background: linear-gradient(135deg, var(--red), #a02a22); border-radius: var(--radius-lg); padding: 2.5rem; text-align: center; margin-top: 3rem; color: #fff; }
.post-cta h3 { color: #fff; margin-bottom: .5rem; font-size: 1.35rem; }
.post-cta p { color: rgba(255,255,255,.8); margin-bottom: 1.5rem; }
@media(max-width:768px){ .post-hero{padding-top:calc(var(--nav-h) + 2rem);} .post-cover{max-height:320px;} }
</style>
</head>
<body>
<nav class="navbar" id="navbar">
  <div class="nav-container">
    <a href="/" class="nav-logo"><img src="/images/logo-black.png" alt="PROPHUNT LLP" class="logo-black"></a>
    <ul class="nav-links">
      <li class="nav-item"><a href="/" class="nav-link">Home</a></li>
      <li class="nav-item"><a href="/projects" class="nav-link">Projects <i class="fas fa-chevron-down chevron"></i></a><div class="dropdown"><a href="/projects" class="dropdown-link"><i class="fas fa-th"></i> All Projects</a><a href="/projects?type=apartment" class="dropdown-link"><i class="fas fa-building"></i> Apartments</a><a href="/projects?type=plot" class="dropdown-link"><i class="fas fa-map"></i> Plots</a><hr class="dropdown-divider"><a href="/developers" class="dropdown-link"><i class="fas fa-sitemap"></i> Our Developers</a></div></li>
      <li class="nav-item"><a href="/services" class="nav-link">Services</a></li>
      <li class="nav-item"><a href="/about" class="nav-link">About</a></li>
      <li class="nav-item"><a href="/blog" class="nav-link active">Blog</a></li>
      <li class="nav-item"><a href="/contact" class="nav-link">Contact</a></li>
    </ul>
    <div class="nav-actions">
      <a href="/contact" class="btn btn-primary btn-sm">Book a Site Visit</a>
      <button class="hamburger" id="hamburger" aria-label="Toggle menu" aria-expanded="false"><span></span><span></span><span></span></button>
    </div>
  </div>
</nav>
<div class="mobile-menu" id="mobileMenu">
  <div class="mobile-menu-inner">
    <ul class="mobile-nav-links">
      <li><a href="/" class="mobile-nav-link">Home</a></li>
      <li><a href="/projects" class="mobile-nav-link">Projects</a></li>
      <li><a href="/services" class="mobile-nav-link">Services</a></li>
      <li><a href="/about" class="mobile-nav-link">About</a></li>
      <li><a href="/blog" class="mobile-nav-link active">Blog</a></li>
      <li><a href="/contact" class="mobile-nav-link">Contact</a></li>
    </ul>
    <div class="mobile-menu-footer"><a href="/contact" class="btn btn-primary">Enquire Now</a></div>
  </div>
</div>
<article>
  <header class="post-hero">
    <div class="post-hero-inner">
      <nav class="breadcrumb" style="margin-bottom:1.5rem">
        <a href="/" style="color:rgba(255,255,255,.55)">Home</a>
        <span class="breadcrumb-sep"><i class="fas fa-chevron-right"></i></span>
        <a href="/blog" style="color:rgba(255,255,255,.55)">Blog</a>
        <span class="breadcrumb-sep"><i class="fas fa-chevron-right"></i></span>
        <span class="current" style="color:rgba(255,255,255,.75)">${escapeHtml(post.title)}</span>
      </nav>
      <div class="post-meta-row">
        <span class="post-cat">${category}</span>
        <span class="post-date"><i class="fas fa-calendar-alt"></i> ${escapeHtml(formatDate(post.date))}</span>
        <span class="post-author"><i class="fas fa-user-circle"></i> ${escapeHtml(post.author)}</span>
        <span class="post-read"><i class="fas fa-clock"></i> ${post.readTime} min read</span>
      </div>
      <h1 class="post-title">${escapeHtml(post.title)}</h1>
      <p class="post-excerpt">${description}</p>
    </div>
  </header>
  ${post.cover ? `<img src="${escapeHtml(post.cover)}" alt="${escapeHtml(post.title)}" class="post-cover">` : ''}
  <div class="post-body-wrap">
    <a href="/blog" class="post-back"><i class="fas fa-arrow-left"></i> Back to Blog</a>
    <div class="post-body">
${articleHtml}
    </div>
    <div class="post-cta">
      <h3>Need help choosing the right Pune property?</h3>
      <p>Talk to a PROPHUNT advisor for clear shortlisting, site visits and buying guidance.</p>
      <a href="/contact" class="btn btn-ghost" style="background:rgba(255,255,255,.15);color:#fff;border-color:rgba(255,255,255,.3);">Book a Free Consultation</a>
    </div>
  </div>
</article>
<script src="/js/nav.js"></script>
</body>
</html>
`;
}

function buildPosts() {
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
    fs.writeFileSync(OUT_FILE, JSON.stringify([], null, 2));
    return [];
  }

  const files = fs.readdirSync(POSTS_DIR).filter((file) => file.endsWith('.md')).sort().reverse();

  return files.map((filename) => {
    const slug = filename.replace(/\.md$/, '');
    const content = fs.readFileSync(path.join(POSTS_DIR, filename), 'utf8');
    const { meta, body } = parseFrontmatter(content);
    const excerpt = meta.excerpt || `${stripMarkdown(body).slice(0, 160)}...`;

    return {
      post: {
        slug,
        title: meta.title || slug,
        date: meta.date || '',
        author: meta.author || 'PROPHUNT Advisory Team',
        category: meta.category || 'general',
        excerpt,
        cover: meta.cover || '',
        readTime: estimateReadTime(body),
        url: `/blog/${slug}`,
      },
      body,
    };
  });
}

function writePostPages(entries) {
  entries.forEach(({ post, body }) => {
    const outDir = path.join(BLOG_DIR, post.slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), createPostHtml(post, body), 'utf8');
  });
}

function updateSitemap(posts) {
  if (!fs.existsSync(SITEMAP_FILE)) return;
  const start = '  <!-- Blog posts: generated by scripts/build-blog.js -->';
  const end = '  <!-- End generated blog posts -->';
  const generated = [
    start,
    ...posts.map((post) => `  <url>
    <loc>${SITE_URL}/blog/${post.slug}</loc>
    ${post.date ? `<lastmod>${post.date}</lastmod>` : ''}
    <changefreq>monthly</changefreq>
    <priority>0.65</priority>
  </url>`),
    end,
    '',
  ].join('\n');

  let sitemap = fs.readFileSync(SITEMAP_FILE, 'utf8');
  sitemap = sitemap.replace(/https:\/\/prophuntllp\.com/g, SITE_URL);

  const escapedStart = start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedEnd = end.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const block = new RegExp(`${escapedStart}[\\s\\S]*?${escapedEnd}\\n?`);

  if (block.test(sitemap)) {
    sitemap = sitemap.replace(block, generated);
  } else {
    sitemap = sitemap.replace('  <!-- Project landing pages -->', `${generated}  <!-- Project landing pages -->`);
  }

  fs.writeFileSync(SITEMAP_FILE, sitemap, 'utf8');
}

const entries = buildPosts();
const posts = entries.map(({ post }) => post);

fs.writeFileSync(OUT_FILE, JSON.stringify(posts, null, 2), 'utf8');
writePostPages(entries);
updateSitemap(posts);

console.log(`Built blog posts: ${posts.length} post(s)`);

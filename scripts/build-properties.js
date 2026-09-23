const fs   = require('fs');
const path = require('path');
const { getMicroMarket, LOCALITY_CONTENT } = require('./locality-content');
const { DEV_HUB_MIN, developerSlug } = require('./hub-shared');

const SITE = 'https://www.prophuntllp.com';

const postsDir = path.join(__dirname, '..', 'properties', 'posts');
const outFile  = path.join(__dirname, '..', 'properties', 'posts.json');

function parseYaml(yaml) {
  const lines = yaml.split('\n');
  const data  = {};
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) { i++; continue; }
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) { i++; continue; }
    const key  = line.slice(0, colonIdx).trim();
    const rest = line.slice(colonIdx + 1).trim();
    if (rest === '') {
      const items = [];
      i++;
      while (i < lines.length && /^\s+- /.test(lines[i])) {
        items.push(lines[i].trim().slice(2).trim().replace(/^["']|["']$/g, ''));
        i++;
      }
      if (items.length) data[key] = items;
    } else {
      let val = rest.replace(/^["']|["']$/g, '');
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      else if (!isNaN(val) && val !== '') val = Number(val);
      data[key] = val;
      i++;
    }
  }
  return data;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { data: {}, body: content.trim() };
  return { data: parseYaml(match[1]), body: content.slice(match[0].length).trim() };
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function priceLabel(p) {
  if (p.price_label) return p.price_label;
  if (!p.price || p.price === 0) return 'Price on Request';
  if (p.price >= 100) {
    const cr = (p.price / 100).toFixed(2).replace(/\.?0+$/, '');
    return '₹' + cr + ' Cr*';
  }
  return '₹' + p.price + ' L*';
}

function absUrl(src) {
  if (!src) return `${SITE}/images/og-home.jpg`;
  return src.startsWith('http') ? src : `${SITE}${src}`;
}

// New launches and under-construction projects rank above "ready to move" /
// established ones — mirrors js/projects.js's statusWeight() so the
// prerendered /projects grid (below) matches the order the client JS
// produces with default (no filter, no sort) settings.
function statusWeight(p) {
  if (p.status === 'coming-soon') return 0;
  const tl = (p.tagline || '').toLowerCase();
  if (tl.includes('ready') || tl.includes('oc received')) return 2;
  return 1;
}

// Mirrors js/projects.js's renderCard() exactly (same markup/classes, same
// lack of escaping — this data comes from our own frontmatter, not user
// input) so the server-rendered grid and the client-hydrated one are
// pixel-identical and there's no flash of different content on load.
function renderProjectCard(p) {
  const isExternal = /^https?:\/\//.test(p.url);
  const linkAttrs  = isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';
  const linkLabel  = isExternal ? 'View Project' : 'View Details';
  const icon       = p.category === 'plot' ? 'map' : p.category === 'villa' ? 'home' : p.category === 'commercial' ? 'briefcase' : 'building';
  const statusBadge = p.status === 'sold-out'
    ? '<span class="badge badge-gray" style="font-size:.68rem;padding:.2rem .55rem;background:#6b7280">Sold Out</span>'
    : '';
  const priceLbl = p.price_label || (p.price > 0 ? '₹' + p.price + ' L*' : 'Price on request');
  const areaSpec = p.area ? `<span><i class="fas fa-ruler-combined"></i>${p.area}</span>` : '';
  return `
        <a href="${p.url}" ${linkAttrs} class="prop-card" data-category="${p.category}" aria-label="${linkLabel}: ${p.title}">
          <div class="prop-card-img">
            <div>${p.cover ? `<img src="${escapeHtml(p.thumb || p.cover)}" alt="${escapeHtml(p.title || '')}" width="600" height="372" loading="lazy" decoding="async">` : `<span class="prop-card-img-empty"><i class="fas fa-${icon}"></i></span>`}</div>
            <div class="prop-card-badge"><span class="badge badge-red">${p.developer}</span>${statusBadge}</div>
            <div class="prop-card-price">${priceLbl}</div>
          </div>
          <div class="prop-card-body">
            <div class="prop-card-dev">${p.developer}</div>
            <h3 class="prop-card-title">${p.title}</h3>
            <p class="prop-card-loc"><i class="fas fa-map-marker-alt"></i>${p.location}</p>
            <div class="prop-card-specs">
              <span><i class="fas fa-${icon}"></i>${p.config}</span>
              ${areaSpec}
            </div>
            <div class="prop-card-footer">
              <span class="prop-card-status">${isExternal ? 'Official project page' : 'View on PROPHUNT'}</span>
              <span class="prop-card-link">${linkLabel} <i class="fas fa-arrow-right"></i></span>
            </div>
          </div>
        </a>`;
}

// One sentence, derived only from fields we actually have — never a guess.
function possessionSentence(p, title) {
  if (p.status === 'sold-out') return `${title} is sold out and has no live inventory.`;
  const tl = (p.tagline || '').toLowerCase();
  if (tl.includes('ready to move') || tl.includes('ready for possession') || tl.includes('oc received')) {
    return `${title} is ready to move in.`;
  }
  if (tl.includes('under construction')) return `${title} is currently under construction.`;
  if (p.status === 'coming-soon' || tl.includes('new launch') || tl.includes('coming soon')) {
    return `${title} is a new launch.`;
  }
  return '';
}

// Fact-dense, auto-generated from frontmatter — same formula for every
// property, present or future, so no listing ever ships without real SEO
// copy. Falls back to the hand-written overview when one exists, since
// that's usually better-written than the template for projects an editor
// took the time to describe.
function clampAtWord(s, max) {
  s = s.trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s.,;:–-]+$/, '') + '…';
}

function metaDescription(p) {
  const title = p.title || 'This project';
  const bits = [];
  bits.push(`${title}${p.location ? ` in ${p.location}` : ''}${p.developer ? ` by ${p.developer}` : ''} offers ${p.config || 'premium homes'}${p.category ? ` (${p.category})` : ''}.`);
  const status = possessionSentence(p, title);
  if (status) bits.push(status);
  bits.push('Explore amenities, pricing, floor plans and RERA details on PROPHUNT LLP.');
  const generated = bits.join(' ');
  // Prefer the editor's overview when present, but never cut it mid-word.
  return clampAtWord(p.overview ? p.overview : generated, 160);
}

// Project-specific FAQ content, generated only from fields that are
// actually filled in — a property added tomorrow with the standard
// frontmatter gets the same quality of FAQ as one added today.
function generateProjectFAQs(p) {
  const title = p.title || 'This project';
  const faqs = [];

  if (p.rera) {
    faqs.push({
      q: `What is the RERA registration number of ${title}?`,
      a: `${title} is registered under MahaRERA with registration number ${p.rera}. You can verify this directly on the official MahaRERA website.`,
    });
  }

  if (p.config) {
    faqs.push({
      q: `What configurations are available at ${title}?`,
      a: `${title} offers ${p.config}${p.area ? `, with sizes ${p.area}` : ''}.`,
    });
  }

  faqs.push({
    q: `What is the price of homes at ${title}?`,
    a: p.price > 0
      ? `${title} is priced ${priceLabel(p)} onwards. Contact PROPHUNT LLP for the latest pricing and available payment plans.`
      : `Pricing for ${title} is available on request — contact PROPHUNT LLP's advisory team for the latest rates.`,
  });

  if (p.location) {
    faqs.push({
      q: `Where is ${title} located?`,
      a: `${title} is located at ${p.location}${p.developer ? `, developed by ${p.developer}` : ''}.`,
    });
  }

  if (p.developer) {
    faqs.push({
      q: `Who is the developer of ${title}?`,
      a: `${title} is developed by ${p.developer}.`,
    });
  }

  const status = possessionSentence(p, title);
  if (status) {
    faqs.push({ q: `Is ${title} ready to move in or under construction?`, a: status });
  }

  return faqs;
}

// "Wakad" out of "Bhumkar Chowk, Wakad, Pune" or "Baner" out of "Baner, Pune" —
// the locality bucket name when we have one (curated, so it also matches the
// area used in the FAQs/landmarks), otherwise the second-to-last comma
// segment of the freeform location string.
function shortLocation(p) {
  if (p.locality_name) return p.locality_name;
  const parts = (p.location || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!parts.length) return '';
  return parts.length >= 2 ? parts[parts.length - 2] : parts[0];
}

// [Name], [Locality] | [Configurations] | PROPHUNT LLP — richer than a bare
// "Property | PROPHUNT LLP" and more specific than the audit's suggested
// "...Configurations, Price, RERA & Details..." formula, which runs 90-100+
// characters for longer project names and would just get truncated in the
// SERP snippet anyway. Locality + configuration are the two things buyers
// actually search on ("2 BHK in Wakad"), so those are what earn the space.
function pageTitle(p) {
  const name = p.title || 'Property';
  const bits = [name];
  const loc = shortLocation(p);
  // Skip appending the locality when the project name already names it
  // (e.g. "Mahindra Lifespaces Mahalunge") — avoids "Mahalunge, Mahalunge".
  if (loc && !name.toLowerCase().includes(loc.toLowerCase())) bits[0] += `, ${loc}`;
  if (p.config) bits.push(p.config);
  bits.push('PROPHUNT LLP');
  return bits.join(' | ');
}

// Head tags: real title/description/canonical + OG/Twitter + JSON-LD
// (BreadcrumbList + RealEstateListing + FAQPage) so search engines and AI
// crawlers see genuine, page-specific signals without running JS. The
// FAQPage entity combines this project's own FAQs with the shared
// locality FAQs for its micro-market — the same content rendered visibly
// on the page by property.html.
function buildHeadBlock(p) {
  const title = pageTitle(p);
  const desc  = metaDescription(p);
  const url   = `${SITE}${p.url}`;
  const image = absUrl(p.cover);
  const allFaqs = [...(p.project_faqs || []), ...(p.locality_faqs || [])];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Projects', item: `${SITE}/projects` },
          { '@type': 'ListItem', position: 3, name: p.title || p.slug, item: url },
        ],
      },
      {
        '@type': 'RealEstateListing',
        name: p.title || '',
        description: desc,
        url,
        image,
        ...(p.developer ? { provider: { '@type': 'Organization', name: p.developer } } : {}),
        ...(p.location ? { address: { '@type': 'PostalAddress', addressLocality: p.location, addressRegion: 'Maharashtra', addressCountry: 'IN' } } : {}),
        ...(p.price ? { offers: { '@type': 'Offer', price: p.price * 100000, priceCurrency: 'INR', url, availability: p.status === 'sold-out' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock' } } : {}),
      },
      ...(allFaqs.length ? [{
        '@type': 'FAQPage',
        mainEntity: allFaqs.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }] : []),
    ],
  };

  return `<title id="ph-title">${escapeHtml(title)}</title>
<meta id="ph-desc" name="description" content="${escapeHtml(desc)}">
<link rel="canonical" id="ph-canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(desc)}">
<meta property="og:image" content="${image}">
<meta property="og:site_name" content="PROPHUNT LLP">
<meta property="og:locale" content="en_IN">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(desc)}">
<meta name="twitter:image" content="${image}">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
}

// Lightweight server-rendered summary shown before the client JS hydrates the full
// page — gives non-JS crawlers (and the first pass of any crawler) real indexable
// text instead of a bare loading spinner. The client JS replaces #ph-page's
// innerHTML anyway, so this has no visual cost for real visitors.
const MONTH_IDX = { jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11 };

// The "Possession" stat tile, plus whether the date it names has already gone
// by — a passed date on a project still marked under-construction is stale data
// and should be re-confirmed with the developer, not presented as current.
function possessionInfo(p) {
  for (let i = 1; i <= 4; i++) {
    if (!/possession/i.test(p[`stat_${i}_label`] || '')) continue;
    const value = String(p[`stat_${i}_value`] || '').trim();
    if (!value) return null;
    const m = value.match(/(?:([A-Za-z]{3})[a-z]*\.?\s+)?(20\d\d)/);
    let passed = false;
    if (m) {
      const mo = m[1] ? MONTH_IDX[m[1].toLowerCase()] : 11;
      if (mo !== undefined) passed = new Date(+m[2], mo + 1, 0) < new Date();
    }
    return { value, passed };
  }
  return null;
}

function statusLabel(p) {
  if (p.status === 'sold-out') return 'Sold out';
  const tl = (p.tagline || '').toLowerCase();
  if (tl.includes('ready') || tl.includes('oc received')) return 'Ready to move';
  if (tl.includes('under construction') || tl.includes('nearing')) return 'Under construction';
  if (p.status === 'coming-soon' || tl.includes('new launch') || tl.includes('coming soon')) return 'New launch';
  return '';
}

function formatVerified(d) {
  const m = String(d || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${+m[3]} ${names[+m[2] - 1]} ${m[1]}`;
}

const MAHARERA_URL = 'https://maharera.mahaonline.gov.in';
const CAT_LABEL = { apartment: 'Apartment', villa: 'Villa', plot: 'Plot', commercial: 'Commercial' };

// Snapshot + "before you book" markup is shared, class-for-class, with the
// client renderer in property.html so hydration doesn't change what a visitor
// (or crawler) sees. Keep the two in sync.
function snapshotHtml(p) {
  const price = priceLabel(p);
  const poss = possessionInfo(p);
  const rows = [
    ['Developer', p.developer],
    ['Location', p.location],
    ['Category', CAT_LABEL[p.category] || ''],
    ['Configuration', p.config],
    ['Sizes', p.area],
    ['Starting price', price !== 'Price on Request' ? `${price} onwards` : 'Price on request'],
    ['Status', statusLabel(p)],
    ['Possession', poss ? poss.value + (poss.passed ? ' — this date has passed; please confirm the current timeline' : '') : ''],
    ['MahaRERA project no.', p.rera ? `${escapeHtml(p.rera)} · <a href="${MAHARERA_URL}" target="_blank" rel="noopener">Verify on MahaRERA</a>` : ''],
    ['Last verified', formatVerified(p.last_verified)],
  ].filter(([, v]) => v);
  return `<div id="snapshot" class="ph-section"><div class="ph-section-label">Project Snapshot</div>
    <table class="ph-snapshot"><tbody>${rows.map(([k, v]) => `<tr><th scope="row">${k}</th><td>${/<a /.test(v) ? v : escapeHtml(v)}</td></tr>`).join('')}</tbody></table></div>`;
}

function verifyHtml(p) {
  const title = escapeHtml(p.title || 'this project');
  const reraLine = p.rera
    ? `Search MahaRERA for <strong>${escapeHtml(p.rera)}</strong> and confirm the registration is active, the promoter name matches, and the completion date filed there.`
    : `A MahaRERA project registration number isn't listed for ${title} on this page yet. Ask PROPHUNT LLP for it, or search the project name on the MahaRERA portal, before you pay any booking amount.`;
  return `<div id="before-you-book" class="ph-section"><div class="ph-section-label">Before You Book</div>
    <div class="ph-section-title">Things to verify for ${title}</div>
    <ul class="ph-verify">
      <li>${reraLine}</li>
      <li>Ask for the full cost sheet in writing — base price, floor rise, parking, GST, stamp duty, registration, maintenance deposit and society charges are usually quoted separately.</li>
      <li>Compare the RERA carpet area with the built-up or saleable area used in brochures, so you know the price per carpet sq ft you're actually paying.</li>
      <li>Confirm offers, payment plans and possession timelines in writing — they change, and marketing material may be out of date.</li>
      <li>Have the sale agreement and title documents reviewed by a qualified legal professional before signing.</li>
    </ul>
    <p class="ph-disclaimer">Project details, prices, inventory, offers, possession timelines and RERA information are subject to developer disclosure and buyer verification. Buyers should independently verify applicable project details on <a href="${MAHARERA_URL}" target="_blank" rel="noopener">MahaRERA</a> before purchase.</p></div>`;
}

const LANDMARK_LABELS = [['education', 'Education'], ['business', 'Business & IT'], ['hospital', 'Healthcare'], ['transit', 'Transit'], ['lifestyle', 'Lifestyle']];

// Server-rendered mirror of everything property.html builds client-side
// (overview, snapshot, pricing, amenities, connectivity, FAQs, related
// projects), so the raw HTML a crawler receives is a full landing page, not a
// header and one paragraph. Real visitors get the same content re-rendered by
// the client with the full design. Every value comes from the project's own
// frontmatter / the curated locality content — nothing is invented.
const CATEGORY_PAGE = { apartment: ['apartments', 'Apartments'], plot: ['plots', 'Plots'], villa: ['villas', 'Villas'], commercial: ['commercial-properties', 'Commercial Properties'] };

// Same target the client renders ("Browse all Apartments in Baner"), so the raw
// HTML gives every category+locality page a crawlable inbound link from its projects.
function categoryLink(p) {
  const c = CATEGORY_PAGE[p.category];
  if (!c || !p.micro_market || p.status === 'sold-out') return '';
  const loc = LOCALITY_CONTENT[p.micro_market];
  return `<p><a href="/${c[0]}-in-${escapeHtml(p.micro_market)}" class="ph-browse-link">Browse all ${c[1]} in ${escapeHtml(loc ? loc.name : p.micro_market)} →</a></p>`;
}

function buildPrerenderBlock(p, all) {
  const price = priceLabel(p);
  const metaLine = [p.location, p.config, price !== 'Price on Request' ? `Starting from ${price}` : '']
    .filter(Boolean).join(' · ');
  const loc = LOCALITY_CONTENT[p.micro_market] || null;

  const units = [1, 2, 3].map(i => ({ t: p[`unit_${i}_type`], a: p[`unit_${i}_area`], pr: p[`unit_${i}_price`] })).filter(u => u.t);
  const stats = [1, 2, 3, 4].map(i => [p[`stat_${i}_value`], p[`stat_${i}_label`]]).filter(([v]) => v);
  const amenities = Array.isArray(p.amenities) ? p.amenities : [];
  const faqs = [...(p.project_faqs || []), ...(loc ? loc.faqs : [])];
  const similar = all.filter(o => o.slug !== p.slug && o.micro_market === p.micro_market && o.status !== 'sold-out')
    .sort((a, b) => (b.category === p.category) - (a.category === p.category)).slice(0, 6);

  const sections = [];
  if (units.length) {
    sections.push(`<div id="pricing" class="ph-section"><div class="ph-section-label">Unit Configurations &amp; Pricing</div>
      <table class="ph-snapshot"><thead><tr><th>Configuration</th><th>Area</th><th>Price</th></tr></thead><tbody>${units.map(u =>
        `<tr><td>${escapeHtml(u.t)}</td><td>${escapeHtml(u.a || '—')}</td><td>${escapeHtml(u.pr || 'Price on request')}</td></tr>`).join('')}</tbody></table>
      <p class="ph-disclaimer">*Indicative, exclusive of taxes and other charges. Contact PROPHUNT LLP for the current cost sheet.</p></div>`);
  }
  if (stats.length) {
    sections.push(`<div class="ph-section"><div class="ph-section-label">Key Facts</div>
      <ul class="ph-verify">${stats.map(([v, l]) => `<li><strong>${escapeHtml(v)}</strong>${l ? ` — ${escapeHtml(l)}` : ''}</li>`).join('')}</ul></div>`);
  }
  if (amenities.length) {
    sections.push(`<div id="amenities" class="ph-section"><div class="ph-section-label">Amenities</div>
      <ul class="ph-verify ph-cols">${amenities.map(a => `<li>${escapeHtml(a)}</li>`).join('')}</ul></div>`);
  }
  if (loc && LANDMARK_LABELS.some(([k]) => (loc.landmarks[k] || []).length)) {
    sections.push(`<div id="nearby-landmarks" class="ph-section"><div class="ph-section-label">Location &amp; Connectivity</div>
      <div class="ph-section-title">Around ${escapeHtml(loc.name)}</div>
      ${LANDMARK_LABELS.map(([k, label]) => (loc.landmarks[k] || []).length
        ? `<p class="ph-landmarks-line"><strong>${label}:</strong> ${loc.landmarks[k].map(escapeHtml).join(' · ')}</p>` : '').join('')}
      <p><a href="/location/${escapeHtml(p.micro_market)}" class="ph-browse-link">All properties in ${escapeHtml(loc.name)} →</a></p></div>`);
  }
  sections.push(verifyHtml(p));
  if (faqs.length) {
    sections.push(`<div id="faqs" class="ph-section"><div class="ph-section-label">Frequently Asked Questions</div>
      ${faqs.map(f => `<h3 class="ph-faq-q">${escapeHtml(f.q)}</h3><p class="ph-faq-a">${escapeHtml(f.a)}</p>`).join('')}</div>`);
  }
  if (similar.length) {
    sections.push(`<div class="ph-section"><div class="ph-section-label">Similar Projects${loc ? ` in ${escapeHtml(loc.name)}` : ''}</div>
      <ul class="ph-verify ph-cols">${similar.map(o => `<li><a href="${escapeHtml(o.url)}">${escapeHtml(o.title)}</a>${o.config ? ` — ${escapeHtml(o.config)}` : ''}</li>`).join('')}</ul></div>`);
  }

  const prerenderBadges = [
    CAT_LABEL[p.category] ? `<span class="ph-tag-chip"><i class="fas fa-layer-group"></i>${CAT_LABEL[p.category]}</span>` : '',
    p.rera ? `<span class="ph-tag-chip rera"><i class="fas fa-shield-halved"></i>RERA Registered</span>` : '',
  ].filter(Boolean).join('');

  return `<div class="ph-prerender" style="max-width:900px;margin:0 auto;padding:32px 24px 24px">
    ${prerenderBadges ? `<div class="ph-tag-chips" style="margin-bottom:12px">${prerenderBadges}</div>` : ''}
    <div style="font-family:'Open Sans',sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--red);margin-bottom:8px">${escapeHtml(p.developer)}</div>
    <h1 style="font-family:'Open Sans',sans-serif;font-size:clamp(24px,4vw,34px);font-weight:700;line-height:1.2;color:var(--ink);margin-bottom:8px">${escapeHtml(p.title)}</h1>
    <p style="color:var(--gray-600);font-size:14px;margin-bottom:16px">${escapeHtml(metaLine)}</p>
    ${p.overview ? `<p style="color:var(--gray-600);line-height:1.8;font-size:14.5px;margin-bottom:20px">${escapeHtml(p.overview)}</p>` : ''}
    ${p.developer_hub ? `<p><a href="${escapeHtml(p.developer_hub)}" class="ph-browse-link">All ${escapeHtml(p.developer)} projects →</a></p>` : ''}
    ${categoryLink(p)}
    ${snapshotHtml(p)}
    ${sections.join('\n    ')}
  </div>`;
}

const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md')).sort();

const properties = files.map(file => {
  const slug = file.replace(/\.md$/, '');
  const raw  = fs.readFileSync(path.join(postsDir, file), 'utf8');
  const { data, body } = parseFrontmatter(raw);
  const url   = data.url || `/projects/${slug}`;
  const cover = data.cover || data.hero_1 || '';
  // Card thumbnail (640w WebP) when one exists in images/thumbs/ — cards use it instead of
  // the full-size cover (which is 1-2MB-class for a ~400px slot). Full cover stays for the
  // project page hero and og:image.
  const thumb = fs.existsSync(path.join(__dirname, '..', 'images', 'thumbs', `${slug}.webp`)) ? `/images/thumbs/${slug}.webp` : '';
  const merged = { slug, ...data, cover, thumb, url, body: body || '' };

  const micro_market = getMicroMarket(data.location);
  const locality = LOCALITY_CONTENT[micro_market] || null;

  return {
    ...merged,
    micro_market,
    locality_name: locality ? locality.name : '',
    project_faqs: generateProjectFAQs(merged),
    locality_faqs: locality ? locality.faqs : [],
    nearby_landmarks: locality ? locality.landmarks : {},
  };
});

// Tag each project with its developer hub URL when that developer has one
// (same threshold/slug as scripts/build-developer-hubs.js).
const devCount = {};
properties.forEach(p => { if (p.status !== 'sold-out' && p.developer) devCount[p.developer] = (devCount[p.developer] || 0) + 1; });
properties.forEach(p => { if (p.status !== 'sold-out' && devCount[p.developer] >= DEV_HUB_MIN) p.developer_hub = `/developer/${developerSlug(p.developer)}`; });

// properties/posts.json is fetched by every page that needs the property
// list — the projects listing page and the homepage's featured grid
// included, neither of which uses project_faqs/locality_faqs/
// nearby_landmarks. Shipping those to every visitor of those pages more
// than doubled the payload (104KB -> 235KB) for content only the
// individual property detail page (property.html) actually renders.
// Keep this file lean; the FAQ/landmark content ships separately below.
const leanProperties = properties.map(({ project_faqs, locality_faqs, nearby_landmarks, ...rest }) => rest);
fs.writeFileSync(outFile, JSON.stringify(leanProperties, null, 2));
console.log(`Built properties/posts.json — ${properties.length} properties`);

// Separate, de-duplicated SEO content for property.html only: locality
// FAQs/landmarks are identical for every property in the same
// micro-market, so they're shipped once per locality (9 entries) instead
// of once per property (44 duplicated copies) — the bulk of the savings
// above. Project FAQs are genuinely per-project and stay keyed by slug.
const seoContent = {
  locality: LOCALITY_CONTENT,
  projects: Object.fromEntries(properties.map(p => [p.slug, p.project_faqs])),
};
fs.writeFileSync(path.join(__dirname, '..', 'properties', 'seo-content.json'), JSON.stringify(seoContent, null, 2));
console.log(`Built properties/seo-content.json — ${Object.keys(seoContent.locality).length} localities, ${properties.length} project FAQ sets`);

// Generate a static detail page for each property at projects/{slug}/index.html
const templatePath = path.join(__dirname, '..', 'property.html');
if (fs.existsSync(templatePath)) {
  // Normalise to LF. The HEAD_MARKER / LOADING_MARKER template literals below are
  // LF at runtime (the JS spec normalises CRLF in template literals to \n), but
  // property.html is checked out with CRLF endings on Windows — so the raw
  // fs.readFileSync text would never match the markers and every .replace() here
  // silently no-op'd, shipping every project page with a generic <title>, no
  // canonical, no OG tags, no JSON-LD and no prerender block.
  const template = fs.readFileSync(templatePath, 'utf8').replace(/\r\n/g, '\n');

  const HEAD_MARKER = `<title id="ph-title">Property | PROPHUNT LLP</title>
<meta id="ph-desc" name="description" content="Premium property listed by PROPHUNT LLP, Pune.">
<link rel="canonical" id="ph-canonical" href="https://www.prophuntllp.com/projects/">`;

  const LOADING_MARKER = `<div class="ph-loading">
    <div class="ph-loading-spinner"></div>
    <p>Loading property details…</p>
  </div>`;

  properties.forEach(p => {
    const outDir = path.join(__dirname, '..', 'projects', p.slug);
    fs.mkdirSync(outDir, { recursive: true });

    let html = template.replace(
      "const slug = window.location.pathname.split('/').filter(Boolean).pop() || '';",
      `const slug = '${p.slug}';`
    );
    html = html.replace(HEAD_MARKER, buildHeadBlock(p));
    html = html.replace(LOADING_MARKER, buildPrerenderBlock(p, properties));

    fs.writeFileSync(path.join(outDir, 'index.html'), html);
    console.log(`  → projects/${p.slug}/index.html`);
  });
}

// Prerender the /projects listing grid itself. Previously #projectsGrid was
// an empty <div> filled only by js/projects.js after a fetch — a crawler
// (or anything reading the raw HTML) saw zero project links on the page
// that's supposed to be the hub for all of them. js/projects.js's
// applyFilters() still overwrites this on load with the exact same markup
// (default filters = no filter), so real visitors see no visual change.
const projectsPagePath = path.join(__dirname, '..', 'projects.html');
if (fs.existsSync(projectsPagePath)) {
  const listed = properties.filter(p => p.status !== 'sold-out');
  const sorted = [...listed].sort((a, b) => statusWeight(a) - statusWeight(b));
  const cardsHtml = sorted.map(renderProjectCard).join('');

  let html = fs.readFileSync(projectsPagePath, 'utf8').replace(/\r\n/g, '\n');

  // Anchored on the opening tag through to the next stable sibling
  // (#projEmpty, always immediately after in the template) rather than an
  // exact-match on the pristine empty <div> — that would only ever match
  // once; every rebuild after the first would silently leave the grid
  // holding whatever cards happened to exist at that first build forever.
  html = html.replace(
    /<div class="proj-grid" id="projectsGrid"(?: data-reveal)?>[\s\S]*?(?=<div class="proj-empty" id="projEmpty")/,
    `<div class="proj-grid" id="projectsGrid">${cardsHtml}</div>\n\n    `
  );

  html = html.replace(
    `<strong id="projectCount">0</strong>`,
    `<strong id="projectCount">${sorted.length}</strong>`
  );

  // Replace the stale hand-written ItemList (10 hardcoded slugs, some no
  // longer representative) with the real, complete list so the structured
  // data matches what's actually on the page.
  const listingJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Projects', item: `${SITE}/projects` },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'Premium Real Estate Projects in Pune',
        description: "RERA-registered apartments, villas, plots and commercial properties in Pune and select Maharashtra growth markets",
        numberOfItems: sorted.length,
        itemListElement: sorted.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.title, item: `${SITE}${p.url}` })),
      },
    ],
  };
  html = html.replace(/<script type="application\/ld\+json">\n\{[\s\S]*?\n\}\n<\/script>/, `<script type="application/ld+json">\n${JSON.stringify(listingJsonLd, null, 2)}\n</script>`);

  fs.writeFileSync(projectsPagePath, html);
  console.log(`Prerendered projects.html — ${sorted.length} project cards`);
}

module.exports = { properties };

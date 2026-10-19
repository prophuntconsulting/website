/**
 * Sanity -> Markdown. First step of `npm run build`, which Vercel runs on
 * every deploy (publishing in Sanity calls a Vercel deploy hook).
 *
 * Writes every published Sanity document out as the Markdown file the site
 * build reads (properties/posts/{slug}.md, blog/posts/{slug}.md), so the page
 * generators, SEO pages and sitemap work unchanged. Content is not committed
 * to git: Sanity is the source of truth, backed up weekly by
 * .github/workflows/sanity-maintenance.yml.
 *
 * Images: assets imported from the repo keep their original /images/... path
 * (recorded in asset.source.id by studio/scripts/migrate-from-markdown.js).
 * Anything uploaded in the Studio later is served from the Sanity image CDN.
 *
 * Blog posts with a future "Publish at" are held back until they are due
 * (the maintenance workflow redeploys daily so they go live).
 *
 *   node scripts/sanity-pull.js               write the content files
 *   node scripts/sanity-pull.js --out DIR     write the .md files to DIR instead (for checking)
 *   node scripts/sanity-pull.js --force       allow a sync that deletes more than a quarter of the files
 */

const fs = require('fs');
const path = require('path');

// Public identifiers (dataset is public-read). Keep in sync with studio/env.js.
const PROJECT_ID = process.env.SANITY_PROJECT_ID || '9cgq9uxv';
const DATASET = process.env.SANITY_DATASET || 'production';
const API = `https://${PROJECT_ID}.api.sanity.io/v2025-02-19/data/query/${DATASET}`;

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const OUT = args.includes('--out') ? path.resolve(args[args.indexOf('--out') + 1]) : null;
const FORCE = args.includes('--force');

// Property frontmatter key order, matching the files Sveltia used to write.
const PROPERTY_KEYS = ['date_added', 'title', 'developer', 'location', 'config', 'area', 'category', 'status', 'rera', 'last_verified',
  'area_alias', 'rera_qr', 'hero_1', 'hero_2', 'hero_3', 'hero_caption', 'tagline', 'overview',
  'stat_1_value', 'stat_1_label', 'stat_2_value', 'stat_2_label', 'stat_3_value', 'stat_3_label', 'stat_4_value', 'stat_4_label',
  'price', 'unit_1_type', 'unit_1_area', 'unit_1_price', 'unit_1_featured', 'unit_2_type', 'unit_2_area', 'unit_2_price', 'unit_2_featured',
  'unit_3_type', 'unit_3_area', 'unit_3_price', 'unit_3_featured', 'amenities', 'gallery_images', 'gallery_videos', 'brochure',
  'lat', 'lng', 'geo_confidence'].map(k => [k, k]);

// Blog: [value prepared below, frontmatter key read by scripts/build-blog.js].
const BLOG_MAP = [
  ['title', 'title'], ['metaTitle', 'seo_title'], ['metaDescription', 'seo_description'], ['focusKeyword', 'focus_keyword'],
  ['secondaryKeywords', 'secondary_keywords'], ['breadcrumbTitle', 'breadcrumb_title'], ['date', 'date'], ['updated', 'updated'],
  ['author', 'author'], ['category', 'category'], ['excerpt', 'excerpt'], ['featuredImage', 'cover'], ['featuredImageAlt', 'cover_alt'],
  ['tags', 'tags'], ['openGraphTitle', 'og_title'], ['openGraphDescription', 'og_description'], ['openGraphImage', 'og_image'],
  ['openGraphImageAlt', 'og_image_alt'], ['twitterCard', 'twitter_card'], ['twitterTitle', 'twitter_title'],
  ['twitterDescription', 'twitter_description'], ['twitterImage', 'twitter_image'], ['twitterImageAlt', 'twitter_image_alt'],
  ['canonicalUrl', 'canonical_url'], ['schemaType', 'schema_type'], ['robots', 'robots'], ['excludeFromSitemap', 'exclude_from_sitemap'],
  ['redirectUrl', 'redirect_url'], ['redirectPermanent', 'redirect_permanent'], ['relatedProjects', 'related_projects'], ['faqsJson', 'faqs_json'],
];
const DEFAULT_ROBOTS = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';

async function query(q) {
  const res = await fetch(`${API}?query=${encodeURIComponent(q)}&perspective=published`);
  if (!res.ok) throw new Error(`Sanity query failed: ${res.status} ${await res.text()}`);
  return (await res.json()).result;
}

const SITE = 'https://www.prophuntllp.com';
const isRaster = a => a._type === 'sanity.imageAsset' && !/^(svg|gif)$/i.test(a.extension || '');
const oneLine = s => String(s).replace(/\s*\n\s*/g, ' ').trim();
// Calendar date in India (the site's dates are IST).
const istDate = iso => new Date(new Date(iso).getTime() + 5.5 * 3600e3).toISOString().slice(0, 10);

// ── Portable Text -> Markdown (the subset scripts/build-blog.js renders) ──
function spansToMd(block, hrefFor) {
  const defs = new Map((block.markDefs || []).map(d => [d._key, d]));
  const deco = s => {
    const raw = (s.text || '').replace(/\s*\n\s*/g, ' ');
    if (!raw.trim()) return raw;
    const m = s.marks || [];
    const lead = raw.match(/^\s*/)[0], trail = raw.match(/\s*$/)[0];
    let x = raw.trim();
    if (m.includes('code')) x = '`' + x + '`';
    if (m.includes('em')) x = '*' + x + '*';
    if (m.includes('strong')) x = '**' + x + '**';
    return lead + x + trail;
  };
  const kids = block.children || [];
  let out = '', i = 0;
  while (i < kids.length) {
    const linkKey = (kids[i].marks || []).find(m => defs.has(m));
    if (!linkKey) { out += deco(kids[i]); i++; continue; }
    let inner = '';
    while (i < kids.length && (kids[i].marks || []).includes(linkKey)) {
      inner += deco({ ...kids[i], marks: kids[i].marks.filter(m => m !== linkKey) });
      i++;
    }
    const href = hrefFor(defs.get(linkKey));
    const lead = inner.match(/^\s*/)[0], trail = inner.match(/\s*$/)[0];
    out += href ? `${lead}[${inner.trim()}](${href})${trail}` : inner;
  }
  return out.trim();
}

async function portableTextToMd(body, hrefFor, imagePath) {
  const out = [];
  let prevList = null;
  for (const b of body || []) {
    const listItem = b._type === 'block' ? b.listItem : null;
    if (prevList && listItem !== prevList) out.push('');
    prevList = listItem || null;
    if (b._type === 'block') {
      const text = spansToMd(b, hrefFor);
      if (!text) continue;
      if (listItem) { out.push(`${listItem === 'number' ? '1.' : '-'} ${text}`); continue; }
      const prefix = { h1: '## ', h2: '## ', h3: '### ', h4: '#### ', blockquote: '> ' }[b.style] || '';
      out.push(prefix + text, '');
    } else if (b._type === 'image') {
      const src = await imagePath(b);
      if (src) out.push(`![${oneLine(b.alt || '').replace(/[[\]]/g, '')}](${src}${b.caption ? ` "${oneLine(b.caption).replace(/"/g, "'")}"` : ''})`, '');
    } else if (b._type === 'table' && (b.rows || []).length) {
      const rows = b.rows.map(r => (r.cells || []).map(c => oneLine(c || '').replace(/\|/g, '/')));
      const width = Math.max(...rows.map(r => r.length));
      const line = r => `| ${Array.from({ length: width }, (_, j) => r[j] || '').join(' | ')} |`;
      out.push(line(rows[0]), `| ${Array(width).fill('---').join(' | ')} |`, ...rows.slice(1).map(line), '');
    } else if (b._type === 'divider') {
      out.push('***', '');
    } else if (b._type === 'code' && b.code) {
      out.push(...b.code.split('\n').filter(Boolean).map(l => '`' + l + '`'), '');
    }
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function robotsFor(d) {
  const r = [d.robotsIndex === false ? 'noindex' : 'index', d.robotsFollow === false ? 'nofollow' : 'follow'];
  if (d.robotsNoArchive) r.push('noarchive');
  if (d.robotsNoImageIndex) r.push('noimageindex');
  if (d.robotsNoSnippet) r.push('nosnippet');
  else r.push(`max-snippet:${d.robotsMaxSnippet ?? -1}`);
  r.push(`max-image-preview:${d.robotsMaxImagePreview || 'large'}`, `max-video-preview:${d.robotsMaxVideoPreview ?? -1}`);
  return r.join(', ');
}

async function main() {
  if (PROJECT_ID === 'REPLACE_ME') { console.log('Sanity: no project id configured, using the Markdown files as they are'); return; }

  const [docs, assetList] = await Promise.all([
    query('*[_type in ["property", "blogPost"] && defined(slug.current)]'),
    query('*[_type in ["sanity.imageAsset", "sanity.fileAsset"]]{_id, _type, url, originalFilename, extension, source}'),
  ]);
  const assets = new Map(assetList.map(a => [a._id, a]));

  // Asset reference -> URL: the original repo path for imported files,
  // otherwise the Sanity CDN (auto=format serves WebP/AVIF where supported).
  async function assetPath(ref) {
    const a = assets.get(ref && ref.asset && ref.asset._ref);
    if (!a) return '';
    const src = a.source && a.source.name === 'prophunt-repo' && a.source.id;
    if (src && src.startsWith('/images/') && fs.existsSync(path.join(ROOT, src))) return src;
    return isRaster(a) ? `${a.url}?w=2000&fit=max&auto=format&q=80` : a.url;
  }

  // Where internal links and Related Projects point.
  const urlFor = new Map(docs.map(d => [d._id,
    d._type === 'property' ? `/projects/${d.slug.current}` : `/blog/${d.slug.current.replace(/^\d{4}-\d{2}-\d{2}-/, '')}`]));
  const hrefFor = def => (def._type === 'internalLink' ? urlFor.get(def.reference && def.reference._ref) : def.href) || '';

  const fmValue = v => typeof v === 'string' ? `"${oneLine(v)}"` : String(v);
  const written = { property: new Set(), blogPost: new Set() };
  const now = Date.now();
  let scheduled = 0;

  for (const d of docs.sort((x, y) => x.slug.current.localeCompare(y.slug.current))) {
    const slug = d.slug.current;
    const isProp = d._type === 'property';
    if (!isProp && d.publishedAt && new Date(d.publishedAt).getTime() > now) { scheduled++; continue; }

    let src = d, keys = PROPERTY_KEYS, bodyMd = '';
    if (!isProp) {
      const robots = robotsFor(d);
      src = {
        ...d,
        date: d.publishedAt ? istDate(d.publishedAt) : '',
        // Only after a real edit: the import set _createdAt and _updatedAt together.
        updated: d._updatedAt && Date.parse(d._updatedAt) - Date.parse(d._createdAt) > 3600e3 ? istDate(d._updatedAt) : '',
        featuredImageAlt: d.featuredImage && d.featuredImage.alt,
        openGraphImageAlt: d.openGraphImage && d.openGraphImage.alt,
        twitterImageAlt: d.twitterImage && d.twitterImage.alt,
        robots: robots === DEFAULT_ROBOTS ? '' : robots,
        relatedProjects: (d.relatedProjects || []).map(r => (urlFor.get(r._ref) || '').replace(/^\/projects\//, '')).filter(Boolean),
        faqsJson: (d.faqs || []).filter(f => f.question && f.answer).length
          ? JSON.stringify(d.faqs.filter(f => f.question && f.answer).map(f => ({ q: oneLine(f.question), a: oneLine(f.answer) }))).replace(/'/g, '’')
          : '',
        excludeFromSitemap: d.excludeFromSitemap ? true : '',
        redirectPermanent: d.redirectUrl ? d.redirectPermanent !== false : '',
        schemaType: d.schemaType && d.schemaType !== 'BlogPosting' ? d.schemaType : '',
        twitterCard: d.twitterCard && d.twitterCard !== 'summary_large_image' ? d.twitterCard : '',
      };
      keys = BLOG_MAP;
      bodyMd = await portableTextToMd(d.body, hrefFor, assetPath);
    }

    const lines = [];
    for (const [field, k] of keys) {
      let v = src[field];
      if (v == null || v === '') continue;
      if (Array.isArray(v)) {
        const items = [];
        for (const it of v) items.push(typeof it === 'string' ? oneLine(it) : await assetPath(it));
        const clean = items.filter(Boolean);
        if (clean.length) lines.push(`${k}:`, ...clean.map(x => `  - "${x}"`));
        continue;
      }
      if (typeof v === 'object') v = await assetPath(v);
      if (v === '') continue;
      // JSON values go in single quotes (the build's parser strips one quote at each end).
      lines.push(k === 'faqs_json' ? `${k}: '${v}'` : `${k}: ${fmValue(v)}`);
    }
    const md = `---\n${lines.join('\n')}\n---\n${isProp ? '' : '\n' + bodyMd + '\n'}`;
    const dir = OUT ? path.join(OUT, isProp ? 'properties' : 'blog') : path.join(ROOT, isProp ? 'properties/posts' : 'blog/posts');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${slug}.md`), md);
    written[d._type].add(`${slug}.md`);
  }
  if (scheduled) console.log(`  ${scheduled} scheduled blog post(s) not due yet`);

  if (OUT) { console.log(`Sanity: wrote ${written.property.size} properties and ${written.blogPost.size} posts to ${OUT}`); return; }

  // Remove files for documents deleted (or unpublished) in Sanity.
  for (const [type, rel] of [['property', 'properties/posts'], ['blogPost', 'blog/posts']]) {
    const dir = path.join(ROOT, rel);
    const stale = fs.readdirSync(dir).filter(f => f.endsWith('.md') && !written[type].has(f));
    const total = stale.length + written[type].size;
    if (!written[type].size || (stale.length > total / 4 && !FORCE)) {
      throw new Error(`Refusing to delete ${stale.length} of ${total} files in ${rel}. Check the Sanity project, or rerun with --force if this is intended.`);
    }
    for (const f of stale) { fs.unlinkSync(path.join(dir, f)); console.log(`  removed ${rel}/${f}`); }
  }

  // Pages changed since the last production deploy, for the IndexNow ping
  // at the end of the build (scripts/indexnow-ping.js --content).
  let since = 0;
  try {
    const r = await fetch(`${SITE}/build-info.json`, { cache: 'no-store' });
    if (r.ok) since = Date.parse((await r.json()).builtAt) || 0;
  } catch { /* first deploy, or site unreachable */ }
  const changed = since
    // Edited since the last deploy, or a scheduled post that has just become due.
    ? docs.filter(d => written[d._type].has(`${d.slug.current}.md`)
        && (Date.parse(d._updatedAt) > since || (d.publishedAt && Date.parse(d.publishedAt) > since))).map(d => urlFor.get(d._id))
    : [];
  fs.writeFileSync(path.join(__dirname, '.changed-urls.json'), JSON.stringify(changed, null, 2) + '\n');
  fs.writeFileSync(path.join(ROOT, 'build-info.json'), JSON.stringify({ builtAt: new Date(now).toISOString() }) + '\n');
  if (changed.length) console.log(`  changed since the last deploy: ${changed.join(', ')}`);
  console.log(`Sanity: synced ${written.property.size} properties and ${written.blogPost.size} blog posts`);
}

if (require.main === module) main().catch(err => { console.error(err.message || err); process.exit(1); });
else module.exports = { portableTextToMd };

/**
 * Bulk property importer — turns a spreadsheet (CSV) of new listings into
 * properly-formatted properties/posts/*.md files in one shot, so adding
 * 30 projects doesn't mean 30 rounds of hand-writing frontmatter.
 *
 * Usage:
 *   node scripts/import-properties.js properties/import/batch.csv
 *
 * After running, review the generated .md files (and add hero/gallery
 * images either by editing the frontmatter paths directly, or by opening
 * the entry in /admin — Decap CMS — and using the image widgets there),
 * then run `npm run build` to regenerate every page + the sitemap.
 *
 * CSV columns (header row required, any order, extra columns ignored):
 *   slug (optional — auto-generated from title if blank)
 *   title, developer, location, config, area
 *   category        (apartment | plot | villa | commercial)
 *   status          (active | coming-soon | sold-out)
 *   rera, tagline, overview
 *   stat_1_value, stat_1_label ... stat_4_value, stat_4_label
 *   price           (number, ₹ Lakhs — 0 or blank for "Price on Request")
 *   unit_1_type, unit_1_area, unit_1_price, unit_1_featured (true/false) ... unit_3_*
 *   amenities       (pipe-separated: "Pool | Gym | Clubhouse")
 *   hero_1, hero_2, hero_3, hero_caption
 *   gallery_images  (pipe-separated image paths, optional)
 *   brochure        (optional path to a PDF)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const csvPath = process.argv[2];

if (!csvPath) {
  console.error('Usage: node scripts/import-properties.js <path-to-batch.csv>');
  process.exit(1);
}

// ---- minimal RFC4180-ish CSV parser (handles quoted fields with commas/newlines) ----
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  text = text.replace(/\r\n/g, '\n');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n') {
      row.push(field); field = '';
      rows.push(row); row = [];
    } else {
      field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(f => f.trim() !== ''));
}

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function yamlStr(val) {
  const s = String(val ?? '').replace(/"/g, '\\"');
  return `"${s}"`;
}

function buildFrontmatter(row) {
  const lines = ['---'];
  const push = (key, val, quote = true) => {
    if (val === undefined || val === '') return;
    lines.push(`${key}: ${quote ? yamlStr(val) : val}`);
  };

  push('title', row.title);
  push('developer', row.developer);
  push('location', row.location);
  push('config', row.config);
  push('area', row.area);
  push('category', (row.category || 'apartment').toLowerCase());
  push('status', (row.status || 'active').toLowerCase());
  push('rera', row.rera);
  if (row.hero_1) push('hero_1', row.hero_1);
  if (row.hero_2) push('hero_2', row.hero_2);
  if (row.hero_3) push('hero_3', row.hero_3);
  push('hero_caption', row.hero_caption);
  push('tagline', row.tagline || 'New Launch | Limited Units Available');
  push('overview', row.overview);

  for (let i = 1; i <= 4; i++) {
    push(`stat_${i}_value`, row[`stat_${i}_value`]);
    push(`stat_${i}_label`, row[`stat_${i}_label`]);
  }

  lines.push(`price: ${Number(row.price) || 0}`);

  for (let i = 1; i <= 3; i++) {
    const t = row[`unit_${i}_type`];
    if (!t) continue;
    push(`unit_${i}_type`, t);
    push(`unit_${i}_area`, row[`unit_${i}_area`]);
    push(`unit_${i}_price`, row[`unit_${i}_price`]);
    lines.push(`unit_${i}_featured: ${String(row[`unit_${i}_featured`]).toLowerCase() === 'true'}`);
  }

  const amenities = (row.amenities || '').split('|').map(a => a.trim()).filter(Boolean);
  if (amenities.length) {
    lines.push('amenities:');
    amenities.forEach(a => lines.push(`  - ${a}`));
  }

  const gallery = (row.gallery_images || '').split('|').map(g => g.trim()).filter(Boolean);
  if (gallery.length) {
    lines.push('gallery_images:');
    gallery.forEach(g => lines.push(`  - ${yamlStr(g)}`));
  }

  if (row.brochure) push('brochure', row.brochure);

  lines.push('---', '');
  return lines.join('\n');
}

const raw = fs.readFileSync(path.join(ROOT, csvPath), 'utf8');
const rows = parseCsv(raw);
if (!rows.length) { console.error('No rows found in CSV.'); process.exit(1); }

const header = rows[0].map(h => h.trim());
const dataRows = rows.slice(1);

const outDir = path.join(ROOT, 'properties', 'posts');
let written = 0, skipped = 0;
const results = [];

dataRows.forEach((cols, idx) => {
  const row = {};
  header.forEach((h, i) => { row[h] = (cols[i] || '').trim(); });

  if (!row.title) { skipped++; return; }

  const slug = slugify(row.slug || row.title);
  if (!slug) { skipped++; return; }

  const outPath = path.join(outDir, `${slug}.md`);
  if (fs.existsSync(outPath)) {
    console.warn(`SKIPPED (already exists): ${slug}.md — delete it first or change the slug to overwrite.`);
    skipped++;
    return;
  }

  fs.writeFileSync(outPath, buildFrontmatter(row));
  written++;
  results.push({ slug, title: row.title, hasImages: !!(row.hero_1) });
});

console.log(`\nImported ${written} propert${written === 1 ? 'y' : 'ies'} into properties/posts/  (${skipped} skipped)`);
if (results.length) {
  console.log('\nStill missing hero images (add via /admin or edit the .md frontmatter directly):');
  results.filter(r => !r.hasImages).forEach(r => console.log(`  - ${r.slug}`));
}
console.log('\nNext: run  npm run build  to regenerate every project page + the sitemap.');

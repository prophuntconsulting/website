/**
 * One-off import of the Sveltia-era Markdown content into Sanity.
 *
 *   cd studio && npx sanity exec scripts/migrate-from-markdown.js --with-user-token
 *   ... -- --dry-run      parse and check everything, upload nothing
 *
 * Re-runnable: documents use fixed ids (property-{slug}, blog-{slug}) and are
 * createOrReplace'd; Sanity dedupes re-uploaded files by content hash.
 * Every uploaded asset records its original repo path in `source.id`, so
 * scripts/sanity-pull.js writes the same /images/... paths back out and no
 * live image URL changes.
 */
import fs from 'node:fs'
import path from 'node:path'
import { getCliClient } from 'sanity/cli'
import { markdownToPortableText } from './lib/markdown-to-portable-text.js'

const ROOT = path.resolve(process.cwd(), '..')
const SITE = 'https://www.prophuntllp.com'
const DRY = process.argv.includes('--dry-run')
const client = getCliClient({ apiVersion: '2025-02-19' })

// Same parsing rules as scripts/build-properties.js (numbers/booleans typed).
function parseYaml(yaml) {
  const lines = yaml.split('\n'); const data = {}; let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim() || line.trim().startsWith('#')) { i++; continue }
    const c = line.indexOf(':'); if (c === -1) { i++; continue }
    const key = line.slice(0, c).trim(); const rest = line.slice(c + 1).trim()
    if (rest === '') {
      const items = []; i++
      while (i < lines.length && /^\s+- /.test(lines[i])) { items.push(lines[i].trim().slice(2).trim().replace(/^["']|["']$/g, '')); i++ }
      if (items.length) data[key] = items
    } else {
      let v = rest.replace(/^["']|["']$/g, '')
      if (v === 'true') v = true; else if (v === 'false') v = false; else if (!isNaN(v) && v !== '') v = Number(v)
      data[key] = v; i++
    }
  }
  return data
}
function parseFile(file) {
  const raw = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  return { data: parseYaml(m[1]), body: m[2].trim() }
}

const IMAGE = new Set(['hero_1', 'hero_2', 'hero_3', 'rera_qr', 'cover'])
const IMAGE_LIST = new Set(['gallery_images'])
const FILE = new Set(['brochure'])
const FILE_LIST = new Set(['gallery_videos'])
const NUMBER = new Set(['price', 'lat', 'lng'])
const BOOL = new Set(['unit_1_featured', 'unit_2_featured', 'unit_3_featured'])
const STRING_LIST = new Set(['amenities', 'tags'])
const PROPERTY_FIELDS = new Set(['title', 'date_added', 'developer', 'config', 'area', 'category', 'status', 'rera', 'last_verified', 'tagline',
  'location', 'area_alias', 'lat', 'lng', 'geo_confidence', 'hero_1', 'hero_2', 'hero_3', 'hero_caption', 'gallery_images', 'gallery_videos',
  'rera_qr', 'brochure', 'overview', 'stat_1_value', 'stat_1_label', 'stat_2_value', 'stat_2_label', 'stat_3_value', 'stat_3_label',
  'stat_4_value', 'stat_4_label', 'price', 'unit_1_type', 'unit_1_area', 'unit_1_price', 'unit_1_featured', 'unit_2_type', 'unit_2_area',
  'unit_2_price', 'unit_2_featured', 'unit_3_type', 'unit_3_area', 'unit_3_price', 'unit_3_featured', 'amenities'])
const BLOG_FIELDS = new Set(['title', 'date', 'author', 'category', 'excerpt', 'cover', 'tags', 'seo_title', 'seo_description', 'focus_keyword'])

const assetCache = new Map()
let uploads = 0
async function upload(kind, repoPath) {
  const rel = repoPath.startsWith('/') ? repoPath : '/' + repoPath
  if (assetCache.has(rel)) return assetCache.get(rel)
  const abs = path.join(ROOT, rel)
  if (!fs.existsSync(abs)) throw new Error(`Missing file ${rel}`)
  let id = `dry-${rel}`
  if (!DRY) {
    const asset = await client.assets.upload(kind, fs.readFileSync(abs), {
      filename: path.basename(rel),
      source: { name: 'prophunt-repo', id: rel, url: SITE + rel },
    })
    id = asset._id
  }
  uploads++
  assetCache.set(rel, id)
  return id
}
const key = (s, i) => `${i}-${s.replace(/[^a-z0-9]/gi, '').slice(-10)}`

async function toDoc(type, slug, data, body, allowed) {
  const doc = { _id: `${type === 'property' ? 'property' : 'blog'}-${slug}`, _type: type, slug: { _type: 'slug', current: slug } }
  for (const [k, v] of Object.entries(data)) {
    if (!allowed.has(k)) throw new Error(`${slug}: field "${k}" has no place in the Sanity schema; add it before migrating`)
    if (v === '' || v == null) continue
    if (IMAGE.has(k)) doc[k] = { _type: 'image', asset: { _type: 'reference', _ref: await upload('image', v) } }
    else if (FILE.has(k)) doc[k] = { _type: 'file', asset: { _type: 'reference', _ref: await upload('file', v) } }
    else if (IMAGE_LIST.has(k) || FILE_LIST.has(k)) {
      const kind = IMAGE_LIST.has(k) ? 'image' : 'file'
      doc[k] = []
      for (const [i, p] of [].concat(v).entries()) doc[k].push({ _type: kind, _key: key(p, i), asset: { _type: 'reference', _ref: await upload(kind, p) } })
    }
    else if (STRING_LIST.has(k)) doc[k] = [].concat(v).map(String)
    else if (NUMBER.has(k)) doc[k] = Number(v)
    else if (BOOL.has(k)) doc[k] = v === true || v === 'true'
    else doc[k] = String(v)
  }
  if (type === 'blogPost') doc.body = body
  return doc
}

const docs = []
// Property documents (flat fields, see toDoc)
for (const f of fs.readdirSync(path.join(ROOT, 'properties/posts')).filter(f => f.endsWith('.md')).sort()) {
  const { data, body } = parseFile(path.join(ROOT, 'properties/posts', f))
  docs.push(await toDoc('property', f.replace(/\.md$/, ''), data, body, PROPERTY_FIELDS))
  process.stdout.write(`\r${docs.length} documents, ${uploads} files`)
}

// Blog posts -> the ArthaLeads-style blog schema
const urlToId = new Map(docs.map(d => [`/projects/${d.slug.current}`, d._id]))
const blogFiles = fs.readdirSync(path.join(ROOT, 'blog/posts')).filter(f => f.endsWith('.md')).sort()
for (const f of blogFiles) urlToId.set(`/blog/${f.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '')}`, `blog-${f.replace(/\.md$/, '')}`)
for (const f of blogFiles) {
  const slug = f.replace(/\.md$/, '')
  const { data } = parseFile(path.join(ROOT, 'blog/posts', f))
  const body = fs.readFileSync(path.join(ROOT, 'blog/posts', f), 'utf8').replace(/\r\n/g, '\n').replace(/^---\n[\s\S]*?\n---\n?/, '')
  for (const key of Object.keys(data)) if (!BLOG_FIELDS.has(key)) throw new Error(`${slug}: field "${key}" has no place in the Sanity schema`)
  const s = v => (v === '' || v == null ? undefined : String(v))
  const doc = {
    _id: `blog-${slug}`, _type: 'blogPost',
    title: s(data.title), slug: { _type: 'slug', current: slug }, excerpt: s(data.excerpt), category: s(data.category),
    author: s(data.author) || 'PROPHUNT Advisory Team',
    publishedAt: new Date(`${String(data.date).slice(0, 10)}T09:00:00+05:30`).toISOString(),
    tags: data.tags ? [].concat(data.tags).map(String) : undefined,
    body: markdownToPortableText(body, urlToId),
    focusKeyword: s(data.focus_keyword), metaTitle: s(data.seo_title), metaDescription: s(data.seo_description),
    twitterCard: 'summary_large_image', schemaType: 'BlogPosting',
    robotsIndex: true, robotsFollow: true, robotsNoArchive: false, robotsNoImageIndex: false, robotsNoSnippet: false,
    robotsMaxSnippet: -1, robotsMaxVideoPreview: -1, robotsMaxImagePreview: 'large', excludeFromSitemap: false, redirectPermanent: true,
  }
  if (s(data.cover)) doc.featuredImage = { _type: 'image', asset: { _type: 'reference', _ref: await upload('image', data.cover) }, alt: s(data.title) }
  for (const key of Object.keys(doc)) if (doc[key] === undefined) delete doc[key]
  docs.push(doc)
  process.stdout.write(`\r${docs.length} documents, ${uploads} files`)
}
console.log()

if (DRY) {
  const sample = docs.find(d => d._type === 'blogPost' && d.slug.current.startsWith('2026'))
  console.log('Dry run: nothing uploaded. Blog sample:', JSON.stringify(sample.body.slice(0, 6), null, 1).slice(0, 2500))
  console.log('Link annotations:', docs.filter(d => d._type === 'blogPost').flatMap(d => d.body.flatMap(b => b.markDefs || [])).map(m => m._type + ' ' + (m.href || m.reference._ref)).join('\n'))
} else {
  const tx = client.transaction()
  docs.forEach(d => tx.createOrReplace(d))
  await tx.commit()
  console.log(`Imported ${docs.filter(d => d._type === 'property').length} properties and ${docs.filter(d => d._type === 'blogPost').length} blog posts (${uploads} files).`)
}

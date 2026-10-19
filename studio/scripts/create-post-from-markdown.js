/**
 * Create (or replace) and publish a blog post from Markdown + a JSON spec.
 * A future "publishedAt" schedules it: the site build holds it back and the
 * daily sanity-maintenance job deploys it once it is due.
 *
 *   npx sanity exec scripts/create-post-from-markdown.js --with-user-token -- spec.json [--dry-run]
 *
 * spec.json: {
 *   "slug": "how-to-check-maharera-registration",
 *   "title": "...", "excerpt": "...", "category": "legal",
 *   "publishedAt": "2026-10-23T05:30:00+05:30",
 *   "markdown": "body.md",                         body only, no frontmatter
 *   "cover": "cover.webp", "coverAlt": "...",
 *   "set": { "focusKeyword": "...", "metaTitle": "...", ... },
 *   "relatedProjects": ["slug"], "faqs": [{ "q": "...", "a": "..." }]
 * }
 */
import fs from 'node:fs'
import path from 'node:path'
import { getCliClient } from 'sanity/cli'
import { markdownToPortableText } from './lib/markdown-to-portable-text.js'

const args = process.argv.slice(2).filter(a => a !== '--')
const DRY = args.includes('--dry-run')
const specPath = args.find(a => a.endsWith('.json'))
if (!specPath) throw new Error('Pass a spec .json file')
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'))
const here = p => path.resolve(path.dirname(specPath), p)
const client = getCliClient({ apiVersion: '2025-02-19' })

for (const k of ['slug', 'title', 'excerpt', 'category', 'publishedAt', 'markdown']) if (!spec[k]) throw new Error(`spec.${k} is required`)

const docs = await client.fetch('*[_type in ["property", "blogPost"] && !(_id in path("drafts.**"))]{_id, _type, "slug": slug.current, publishedAt}')
const now = Date.now()
const urlToId = new Map(docs.map(d => [d._type === 'property' ? `/projects/${d.slug}` : `/blog/${d.slug.replace(/^\d{4}-\d{2}-\d{2}-/, '')}`, d._id]))
const bySlug = new Map(docs.filter(d => d._type === 'property').map(d => [d.slug, d._id]))

const body = markdownToPortableText(fs.readFileSync(here(spec.markdown), 'utf8'), urlToId)
// A link to a post that is not live yet would 404 until that post publishes.
for (const def of body.flatMap(b => b.markDefs || [])) {
  const target = def._type === 'internalLink' && docs.find(d => d._id === def.reference._ref)
  if (target && target._type === 'blogPost' && Date.parse(target.publishedAt) > Date.parse(spec.publishedAt)) {
    throw new Error(`Links to ${target.slug}, which publishes after this post`)
  }
}

const doc = {
  _id: `blog-${spec.slug}`, _type: 'blogPost',
  title: spec.title, slug: { _type: 'slug', current: spec.slug }, excerpt: spec.excerpt, category: spec.category,
  author: spec.author || 'PROPHUNT Advisory Team', publishedAt: new Date(spec.publishedAt).toISOString(),
  tags: spec.tags, body,
  twitterCard: 'summary_large_image', schemaType: 'BlogPosting',
  robotsIndex: true, robotsFollow: true, robotsNoArchive: false, robotsNoImageIndex: false, robotsNoSnippet: false,
  robotsMaxSnippet: -1, robotsMaxVideoPreview: -1, robotsMaxImagePreview: 'large', excludeFromSitemap: false, redirectPermanent: true,
  ...(spec.set || {}),
}
if (spec.relatedProjects) {
  doc.relatedProjects = spec.relatedProjects.map((s, i) => {
    if (!bySlug.has(s)) throw new Error(`Unknown project slug ${s}`)
    return { _type: 'reference', _key: `rp${i}`, _ref: bySlug.get(s) }
  })
}
if (spec.faqs) doc.faqs = spec.faqs.map((f, i) => ({ _type: 'faq', _key: `faq${i}`, question: f.q, answer: f.a }))

const words = body.filter(b => b._type === 'block').flatMap(b => b.children || []).map(c => c.text || '').join(' ').split(/\s+/).filter(Boolean).length
const links = body.flatMap(b => b.markDefs || [])
console.log(`${doc._id}: ${words} words, ${body.length} blocks, ${links.length} links, publishes ${doc.publishedAt}${Date.parse(doc.publishedAt) > now ? ' (scheduled)' : ''}`)
links.forEach(m => console.log('  ' + (m._type === 'internalLink' ? `ref  ${m.reference._ref}` : `link ${m.href}`)))

if (DRY) {
  console.log('Dry run, nothing saved.')
} else {
  if (spec.cover) {
    const file = here(spec.cover)
    const asset = await client.assets.upload('image', fs.readFileSync(file), { filename: path.basename(file) })
    doc.featuredImage = { _type: 'image', asset: { _type: 'reference', _ref: asset._id }, alt: spec.coverAlt || spec.title }
  }
  await client.createOrReplace(doc)
  console.log('Saved and published.')
}

/**
 * Replace a blog post's body (and optionally SEO fields, Related Projects
 * and FAQs) from a Markdown file plus a JSON spec, then publish.
 *
 *   npx sanity exec scripts/update-post-from-markdown.js --with-user-token -- spec.json [--dry-run]
 *
 * spec.json: {
 *   "id": "blog-...",                  document id
 *   "markdown": "path/to/body.md",     body only, no frontmatter
 *   "set": { "metaTitle": "..." },     any other fields to set
 *   "relatedProjects": ["slug", ...],  property slugs
 *   "faqs": [{ "q": "...", "a": "..." }]
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
const client = getCliClient({ apiVersion: '2025-02-19' })

const docs = await client.fetch('*[_type in ["property", "blogPost"] && !(_id in path("drafts.**"))]{_id, _type, "slug": slug.current}')
const urlToId = new Map(docs.map(d => [d._type === 'property' ? `/projects/${d.slug}` : `/blog/${d.slug.replace(/^\d{4}-\d{2}-\d{2}-/, '')}`, d._id]))
const bySlug = new Map(docs.filter(d => d._type === 'property').map(d => [d.slug, d._id]))
if (!docs.some(d => d._id === spec.id)) throw new Error(`No published document ${spec.id}`)

const md = fs.readFileSync(path.resolve(path.dirname(specPath), spec.markdown), 'utf8')
const body = markdownToPortableText(md, urlToId)
const patch = { ...(spec.set || {}), body }
if (spec.relatedProjects) {
  patch.relatedProjects = spec.relatedProjects.map((s, i) => {
    if (!bySlug.has(s)) throw new Error(`Unknown project slug ${s}`)
    return { _type: 'reference', _key: `rp${i}`, _ref: bySlug.get(s) }
  })
}
if (spec.faqs) patch.faqs = spec.faqs.map((f, i) => ({ _type: 'faq', _key: `faq${i}`, question: f.q, answer: f.a }))

const links = body.flatMap(b => b.markDefs || []).map(m => m._type === 'internalLink' ? `ref  ${m.reference._ref}` : `link ${m.href}`)
console.log(`${spec.id}: ${body.length} blocks, ${links.length} links`)
links.forEach(l => console.log('  ' + l))
if (DRY) {
  console.log('Dry run, nothing saved.')
} else {
  await client.patch(spec.id).set(patch).commit()
  console.log('Saved and published.')
}

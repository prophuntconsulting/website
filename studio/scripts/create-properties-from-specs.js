/**
 * Create new property documents (published, no photos) from spec files.
 * Photos are added afterwards with set-photos.js.
 *
 *   npx sanity exec scripts/create-properties-from-specs.js --with-user-token -- specs.json [--dry-run]
 *
 * specs.json: [{ slug, f: { title, location, ...fields } }]
 * Existing documents are never overwritten.
 */
import fs from 'node:fs'
import { getCliClient } from 'sanity/cli'

const args = process.argv.slice(2).filter(a => a !== '--')
const DRY = args.includes('--dry-run')
const file = args.find(a => a.endsWith('.json'))
if (!file) throw new Error('Usage: create-properties-from-specs.js specs.json')
const specs = JSON.parse(fs.readFileSync(file, 'utf8'))
const client = getCliClient({ apiVersion: '2025-02-19' })
const today = new Date().toISOString().slice(0, 10)

for (const { slug, f } of specs) {
  const _id = `property-${slug}`
  if (await client.fetch('count(*[_id == $id || slug.current == $slug])', { id: _id, slug })) { console.log(`SKIP (exists): ${slug}`); continue }
  const doc = {
    _id, _type: 'property', slug: { _type: 'slug', current: slug }, date_added: today,
    hero_caption: `${f.title}, ${f.location}`,
    ...f,
  }
  if (Array.isArray(doc.amenities)) doc.amenities = doc.amenities.filter(Boolean).slice(0, 12)
  if (DRY) { console.log(`DRY ${slug}: ${Object.keys(doc).length} fields`); continue }
  await client.create(doc)
  console.log(`created ${_id}`)
}

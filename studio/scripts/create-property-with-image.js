/**
 * Create one new property document (published) with a local cover image,
 * for projects that have no PROPHUNT YouTube video yet (create-properties.js
 * needs one).
 *
 *   npx sanity exec scripts/create-property-with-image.js --with-user-token -- spec.json
 *
 * spec.json: { slug, image: "C:/path/cover.webp", f: { title, location, ...fields } }
 * Existing documents are never overwritten.
 */
import fs from 'node:fs'
import path from 'node:path'
import { getCliClient } from 'sanity/cli'

const [file] = process.argv.slice(2).filter(a => a !== '--')
if (!file) throw new Error('Usage: create-property-with-image.js spec.json')
const { slug, image, f } = JSON.parse(fs.readFileSync(file, 'utf8'))
const client = getCliClient({ apiVersion: '2025-02-19' })
const _id = `property-${slug}`

if (await client.fetch('count(*[_id == $id])', { id: _id })) {
  console.log(`SKIP (exists): ${_id}`)
} else {
  const asset = await client.assets.upload('image', fs.readFileSync(image), { filename: `${slug}-${path.basename(image)}` })
  await client.create({
    _id, _type: 'property', slug: { _type: 'slug', current: slug },
    date_added: new Date().toISOString().slice(0, 10),
    hero_1: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } },
    hero_caption: `${f.title}, ${f.location}`,
    ...f,
  })
  console.log(`created ${_id}`)
}

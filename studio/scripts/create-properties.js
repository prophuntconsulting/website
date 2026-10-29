/**
 * Create new property documents (published) from a JSON list.
 *
 *   npx sanity exec scripts/create-properties.js --with-user-token -- new-projects.json
 *
 * new-projects.json: [{ slug, yt, f: { title, developer, ...fields } }]
 * hero_1 is the thumbnail of PROPHUNT's own YouTube video `yt` (maxres,
 * falling back to hq). Existing documents are never overwritten.
 */
import fs from 'node:fs'
import { getCliClient } from 'sanity/cli'

const [file] = process.argv.slice(2).filter(a => a !== '--')
if (!file) throw new Error('Usage: create-properties.js new-projects.json')
const items = JSON.parse(fs.readFileSync(file, 'utf8'))
const client = getCliClient({ apiVersion: '2025-02-19' })
const today = new Date().toISOString().slice(0, 10)

async function thumb(id) {
  for (const size of ['maxresdefault', 'hqdefault']) {
    const r = await fetch(`https://i.ytimg.com/vi/${id}/${size}.jpg`)
    if (r.ok) return Buffer.from(await r.arrayBuffer())
  }
  throw new Error(`No thumbnail for ${id}`)
}

for (const { slug, yt, f } of items) {
  const _id = `property-${slug}`
  if (await client.fetch('count(*[_id == $id])', { id: _id })) { console.log(`SKIP (exists): ${_id}`); continue }
  const asset = await client.assets.upload('image', await thumb(yt), { filename: `${slug}-video-cover.jpg` })
  await client.create({
    _id, _type: 'property', slug: { _type: 'slug', current: slug }, date_added: today,
    hero_1: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } },
    hero_caption: `${f.title}, ${f.location}`,
    ...f,
  })
  console.log(`created ${_id}`)
}

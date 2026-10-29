/**
 * Upload local photos and set them on property documents: first three become
 * hero_1..hero_3, the rest gallery_images (replacing the existing ones).
 *
 *   npx sanity exec scripts/set-photos.js --with-user-token -- photos.json
 *
 * photos.json: { "<slug>": ["C:/path/a.jpg", ...] }
 */
import fs from 'node:fs'
import path from 'node:path'
import { getCliClient } from 'sanity/cli'

const [file] = process.argv.slice(2).filter(a => a !== '--')
if (!file) throw new Error('Usage: set-photos.js photos.json')
const map = JSON.parse(fs.readFileSync(file, 'utf8'))
const client = getCliClient({ apiVersion: '2025-02-19' })
const img = id => ({ _type: 'image', asset: { _type: 'reference', _ref: id } })

for (const [slug, files] of Object.entries(map)) {
  const id = `property-${slug}`
  if (!(await client.fetch('count(*[_id == $id])', { id }))) { console.log(`SKIP (not found): ${id}`); continue }
  const assets = []
  for (const [i, f] of files.entries()) {
    const a = await client.assets.upload('image', fs.createReadStream(f), { filename: `${slug}-${i + 1}${path.extname(f)}` })
    assets.push(a._id)
  }
  const set = {}
  ;['hero_1', 'hero_2', 'hero_3'].forEach((k, i) => { if (assets[i]) set[k] = img(assets[i]) })
  set.gallery_images = assets.map((a, i) => ({ _key: `p${i + 1}`, ...img(a) }))
  await client.patch(id).set(set).commit()
  console.log(`${id}: ${assets.length} photos`)
}

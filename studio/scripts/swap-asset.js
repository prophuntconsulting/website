/**
 * Replace a repo-imported image with a new file at a new repo path, in Sanity.
 * Uploads the new file (recording its repo path as the asset source, like the
 * original import) and repoints every published document that used the old
 * asset. The old asset stays in Sanity's media library.
 *
 *   npx sanity exec scripts/swap-asset.js --with-user-token -- <old repo path> <new repo path>
 *   e.g. /images/blog/cover.png /images/blog/cover.webp
 */
import fs from 'node:fs'
import path from 'node:path'
import { getCliClient } from 'sanity/cli'

const [oldPath, newPath] = process.argv.slice(2).filter(a => a !== '--')
if (!oldPath || !newPath) throw new Error('Usage: swap-asset.js <old repo path> <new repo path>')
const client = getCliClient({ apiVersion: '2025-02-19' })
const ROOT = path.resolve(process.cwd(), '..')
const SITE = 'https://www.prophuntllp.com'

const old = await client.fetch('*[_type == "sanity.imageAsset" && source.id == $p][0]{_id}', { p: oldPath })
if (!old) throw new Error(`No Sanity asset imported from ${oldPath}`)
const asset = await client.assets.upload('image', fs.readFileSync(path.join(ROOT, newPath)), {
  filename: path.basename(newPath),
  source: { name: 'prophunt-repo', id: newPath, url: SITE + newPath },
})

const docs = await client.fetch('*[references($id) && !(_id in path("drafts.**"))]', { id: old._id })
for (const doc of docs) {
  const updated = JSON.parse(JSON.stringify(doc).split(`"${old._id}"`).join(`"${asset._id}"`))
  for (const k of ['_rev', '_createdAt', '_updatedAt']) delete updated[k]
  await client.createOrReplace(updated)
}
console.log(`${oldPath} -> ${newPath}: ${docs.length} document(s) updated (${docs.map(d => d._id).join(', ') || 'none'})`)

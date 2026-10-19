/**
 * Upload an image and set it as a blog post's featured image (with alt text).
 *
 *   npx sanity exec scripts/set-cover.js --with-user-token -- <document id> <image file> "<alt text>"
 */
import fs from 'node:fs'
import path from 'node:path'
import { getCliClient } from 'sanity/cli'

const [id, file, alt] = process.argv.slice(2).filter(a => a !== '--')
if (!id || !file || !alt) throw new Error('Usage: set-cover.js <document id> <image file> "<alt text>"')
const client = getCliClient({ apiVersion: '2025-02-19' })
const asset = await client.assets.upload('image', fs.readFileSync(file), { filename: path.basename(file) })
await client.patch(id).set({ featuredImage: { _type: 'image', asset: { _type: 'reference', _ref: asset._id }, alt } }).commit()
console.log(`Set cover on ${id}: ${asset.url}`)

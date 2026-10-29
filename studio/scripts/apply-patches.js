/**
 * Apply a list of field patches to published documents in one transaction.
 *
 *   npx sanity exec scripts/apply-patches.js --with-user-token -- patches.json
 *
 * patches.json: [{ id, set: {...}, unset: ['field', ...], why: 'source note' }]
 * Documents that don't exist are reported and skipped, never created.
 */
import fs from 'node:fs'
import { getCliClient } from 'sanity/cli'

const [file] = process.argv.slice(2).filter(a => a !== '--')
if (!file) throw new Error('Usage: apply-patches.js patches.json')
const patches = JSON.parse(fs.readFileSync(file, 'utf8'))
const client = getCliClient({ apiVersion: '2025-02-19' })

const ids = patches.map(p => p.id)
const existing = new Set(await client.fetch('*[_id in $ids]._id', { ids }))
const tx = client.transaction()
for (const p of patches) {
  if (!existing.has(p.id)) { console.log(`SKIP (not found): ${p.id}`); continue }
  let patch = client.patch(p.id)
  if (p.set) patch = patch.set(p.set)
  if (p.unset && p.unset.length) patch = patch.unset(p.unset)
  tx.patch(patch)
  console.log(`patch ${p.id}: set ${Object.keys(p.set || {}).join(', ')}${p.unset ? `; unset ${p.unset.join(', ')}` : ''}`)
}
await tx.commit()
console.log('Committed.')

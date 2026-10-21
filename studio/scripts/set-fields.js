/**
 * Set plain fields on any document and publish.
 *
 *   npx sanity exec scripts/set-fields.js --with-user-token -- <document id> fields.json
 */
import fs from 'node:fs'
import { getCliClient } from 'sanity/cli'

const [id, file] = process.argv.slice(2).filter(a => a !== '--')
if (!id || !file) throw new Error('Usage: set-fields.js <document id> fields.json')
const fields = JSON.parse(fs.readFileSync(file, 'utf8'))
const client = getCliClient({ apiVersion: '2025-02-19' })
await client.patch(id).set(fields).commit()
console.log(`Set ${Object.keys(fields).join(', ')} on ${id}`)

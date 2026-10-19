/**
 * Markdown -> Portable Text for blog bodies. Used by the one-off import
 * (migrate-from-markdown.js) and by update-post-from-markdown.js.
 * Links to /projects/{slug} and /blog/{slug} become "Link to a project /
 * post" references (urlToId maps those paths to document ids); everything
 * else stays a normal link.
 */
let keySeq = 0
const k = () => `k${(++keySeq).toString(36)}`
const INLINE = [
  { re: /\[([^\]]+)\]\(([^)\s]+)\)/, kind: 'link' },
  { re: /\*\*(.+?)\*\*/, kind: 'strong' },
  { re: /\*([^*\s][^*]*)\*/, kind: 'em' },
  { re: /`([^`]+)`/, kind: 'code' },
]
const SITE_RE = /^https?:\/\/(www\.)?prophuntllp\.com/i
function linkDef(href, urlToId) {
  const path = href.replace(SITE_RE, '').replace(/\/$/, '') || '/'
  const id = urlToId.get(path)
  return id ? { _type: 'internalLink', _key: k(), reference: { _type: 'reference', _ref: id } } : { _type: 'link', _key: k(), href: href.replace(/^http:\/\//, 'https://') }
}
function inline(text, marks, markDefs, urlToId) {
  const spans = []
  let rest = text
  while (rest) {
    let best = null
    for (const p of INLINE) { const m = rest.match(p.re); if (m && (!best || m.index < best.m.index)) best = { m, p } }
    if (!best) { spans.push({ _type: 'span', _key: k(), text: rest, marks }); break }
    if (best.m.index) spans.push({ _type: 'span', _key: k(), text: rest.slice(0, best.m.index), marks })
    let mark = best.p.kind
    if (mark === 'link') { const def = linkDef(best.m[2], urlToId); markDefs.push(def); mark = def._key }
    spans.push(...inline(best.m[1], [...marks, mark], markDefs, urlToId))
    rest = rest.slice(best.m.index + best.m[0].length)
  }
  return spans
}
function block(style, text, urlToId, list) {
  const markDefs = []
  const b = { _type: 'block', _key: k(), style, markDefs, children: inline(text.trim(), [], markDefs, urlToId) }
  if (list) { b.listItem = list; b.level = 1 }
  return b
}
export function markdownToPortableText(md, urlToId) {
  const out = []; let para = []; let table = []
  const flushPara = () => { if (para.length) out.push(block('normal', para.join(' '), urlToId)); para = [] }
  const flushTable = () => {
    if (!table.length) return
    const rows = table.map(l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())).filter(r => !r.every(c => /^:?-{3,}:?$/.test(c)))
    out.push({ _type: 'table', _key: k(), rows: rows.map(cells => ({ _type: 'row', _key: k(), cells })) })
    table = []
  }
  for (const raw of md.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trim()
    if (/^\|.+\|$/.test(line)) { flushPara(); table.push(line); continue }
    flushTable()
    if (!line) { flushPara(); continue }
    if (/^(\*\*\*|---)$/.test(line)) { flushPara(); out.push({ _type: 'divider', _key: k() }); continue }
    const h = line.match(/^(#{1,6})\s+(.+)$/)
    if (h) { flushPara(); out.push(block(`h${Math.min(4, Math.max(2, h[1].length))}`, h[2], urlToId)); continue }
    const ul = line.match(/^[-*]\s+(.+)$/), ol = line.match(/^\d+\.\s+(.+)$/)
    if (ul || ol) { flushPara(); out.push(block('normal', (ul || ol)[1], urlToId, ul ? 'bullet' : 'number')); continue }
    const q = line.match(/^>\s+(.+)$/)
    if (q) { flushPara(); out.push(block('blockquote', q[1], urlToId)); continue }
    para.push(line)
  }
  flushPara(); flushTable()
  return out
}

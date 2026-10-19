import { useFormValue } from 'sanity'
import { Badge, Card, Text } from '@sanity/ui'

// Layout uses plain CSS gaps: @sanity/ui's Stack spacing props changed
// between versions and collapsed to zero here.
const col = gap => ({ display: 'flex', flexDirection: 'column', gap })

// Live SEO score, Google preview and checklist for a blog post (same idea as
// the ArthaLeads studio). Read-only: it only looks at the other fields.

const SITE = 'https://www.prophuntllp.com'
const BRAND_SUFFIXES = [' | PROPHUNT LLP Blog', ' | PROPHUNT LLP', ' | PROPHUNT', '']

// Mirrors fitTitle() in scripts/hub-shared.js, so the preview shows the
// title the site will really use.
function pageTitle(base) {
  const list = BRAND_SUFFIXES.map(s => base + s)
  return list.find(t => t.length <= 65) || list[list.length - 1]
}

function blockText(block) {
  return (block.children || []).map(c => c.text || '').join('')
}

function analyse(doc) {
  const body = Array.isArray(doc.body) ? doc.body : []
  const blocks = body.filter(b => b._type === 'block')
  const text = blocks.map(blockText).join(' ')
  const words = text.split(/\s+/).filter(Boolean)
  const kw = (doc.focusKeyword || '').trim().toLowerCase()
  const has = s => Boolean(kw) && String(s || '').toLowerCase().includes(kw)

  const seoTitle = (doc.metaTitle || doc.title || '').trim()
  const seoDesc = (doc.metaDescription || doc.excerpt || '').trim()
  const slug = (doc.slug && doc.slug.current) || ''
  const kwSlug = kw.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  // Keyword density: occurrences x words in the phrase / total words.
  let count = 0
  if (kw) {
    const hay = ` ${text.toLowerCase().replace(/[^a-z0-9₹%]+/g, ' ')} `
    const needle = ` ${kw.replace(/[^a-z0-9₹%]+/g, ' ').trim()} `
    let i = hay.indexOf(needle)
    while (i !== -1) { count++; i = hay.indexOf(needle, i + 1) }
  }
  const density = words.length && kw ? (count * kw.split(/\s+/).length * 100) / words.length : 0

  const h2s = blocks.filter(b => b.style === 'h2').length
  const firstPara = blocks.find(b => (b.style || 'normal') === 'normal' && blockText(b).trim())
  const linkDefs = blocks.flatMap(b => b.markDefs || [])
  const isOwn = href => /^(\/|https?:\/\/(www\.)?prophuntllp\.com)/.test(href || '')
  // In-text links only: Related Projects cards don't count here.
  const internalLinks = linkDefs.filter(m => m._type === 'internalLink' || (m._type === 'link' && isOwn(m.href))).length
  // A source a reader can check: an https page that isn't ours, WhatsApp, phone or email.
  const externalLinks = linkDefs.filter(m => m._type === 'link' && /^https:\/\//.test(m.href || '') && !isOwn(m.href)
    && !/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(m.href)).length
  const image = doc.featuredImage && doc.featuredImage.asset
  const ogOk = Boolean((doc.openGraphTitle || seoTitle) && (doc.openGraphDescription || seoDesc) && ((doc.openGraphImage && doc.openGraphImage.asset) || image))
  const canonical = (doc.canonicalUrl || '').trim()

  const checks = [
    ['Focus keyword selected', Boolean(kw)],
    ['Keyword appears in article title', has(doc.title)],
    ['Keyword appears in SEO title', has(seoTitle)],
    ['Keyword appears in SEO description', has(seoDesc)],
    ['Keyword appears in URL slug', Boolean(kwSlug) && slug.includes(kwSlug)],
    ['Keyword appears in the first paragraph', has(firstPara && blockText(firstPara))],
    ['SEO title is 30 to 60 characters', seoTitle.length >= 30 && seoTitle.length <= 60],
    ['SEO description is 120 to 160 characters', seoDesc.length >= 120 && seoDesc.length <= 160],
    ['Article contains at least 600 words', words.length >= 600],
    ['Article uses descriptive subheadings', h2s >= 2],
    ['Links to at least 3 PropHunt pages in the article', internalLinks >= 3],
    ['Links to at least one trusted outside source', externalLinks >= 1],
    ['Related Projects selected', (doc.relatedProjects || []).length >= 1],
    ['Featured image has alt text', Boolean(image && doc.featuredImage.alt)],
    ['Social title, description, and image added', ogOk],
    ['Canonical URL is blank or secure', !canonical || canonical.startsWith('https://')],
    ['Keyword density is between 0.5% and 2.5%', density >= 0.5 && density <= 2.5],
  ]
  const passed = checks.filter(c => c[1]).length
  return {
    checks, words: words.length, density, score: Math.round((passed / checks.length) * 100),
    preview: {
      url: `${SITE}/blog/${slug.replace(/^\d{4}-\d{2}-\d{2}-/, '') || '<slug>'}`,
      title: pageTitle(seoTitle || 'Untitled post'),
      desc: seoDesc || 'Add an SEO description or a summary.',
      titleLen: seoTitle.length, descLen: seoDesc.length,
    },
  }
}

export function SeoAnalysisInput() {
  const doc = useFormValue([]) || {}
  const { checks, words, density, score, preview } = analyse(doc)
  const tone = score >= 80 ? 'positive' : score >= 50 ? 'caution' : 'critical'

  return (
    <div style={col(16)}>
      <Card padding={4} radius={3} tone={tone} border>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={col(10)}>
            <Text weight="semibold" size={2}>SEO score</Text>
            <Text size={1} muted>{words} words · {density.toFixed(1)}% keyword density</Text>
          </div>
          <Badge tone={tone} fontSize={3} padding={3}>{score}/100</Badge>
        </div>
      </Card>

      <Card padding={4} radius={3} border>
        <div style={col(10)}>
          <Text weight="semibold" size={2}>Google preview</Text>
          <Text size={1} style={{ color: '#1a7f37', wordBreak: 'break-all' }}>{preview.url}</Text>
          <Text size={3} style={{ color: '#4c8bf5' }}>{preview.title}</Text>
          <Text size={1} muted>{preview.desc}</Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Badge tone={preview.titleLen >= 30 && preview.titleLen <= 60 ? 'positive' : 'caution'}>{preview.titleLen}/60 title characters</Badge>
            <Badge tone={preview.descLen >= 120 && preview.descLen <= 160 ? 'positive' : 'caution'}>{preview.descLen}/160 description characters</Badge>
          </div>
        </div>
      </Card>

      <div style={col(10)}>
        <Text weight="semibold" size={2}>SEO checklist</Text>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
          {checks.map(([label, ok]) => (
            <Card key={label} padding={3} radius={2} border>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Badge tone={ok ? 'positive' : 'critical'}>{ok ? 'Pass' : 'Fix'}</Badge>
                <Text size={1}>{label}</Text>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

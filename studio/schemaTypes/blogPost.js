import { defineType, defineField, defineArrayMember } from 'sanity'
import { SeoAnalysisInput } from '../components/SeoAnalysisInput'

// Same layout as the ArthaLeads blog studio (Content / SEO / Social /
// Advanced SEO tabs, SEO score + checklist), plus PropHunt extras for
// internal linking: project links inside the article, Related Projects and
// FAQs. scripts/sanity-pull.js turns each post into blog/posts/{slug}.md.

const altField = defineField({ name: 'alt', title: 'Alternative Text', type: 'string', description: 'Describe the image for screen readers and Google Images.' })

export const blogPost = defineType({
  name: 'blogPost',
  title: 'Blog post',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' },
    { name: 'social', title: 'Social' },
    { name: 'advanced', title: 'Advanced SEO' },
  ],
  fieldsets: [
    { name: 'imageBrief', title: 'Image brief (editor notes, not shown on the site)', options: { collapsible: true, collapsed: true } },
    { name: 'openGraph', title: 'Facebook, LinkedIn and WhatsApp', options: { collapsible: true, collapsed: false } },
    { name: 'twitter', title: 'X / Twitter', options: { collapsible: true, collapsed: false } },
    { name: 'robots', title: 'Robots Directives', options: { collapsible: true, collapsed: false } },
    { name: 'previewLimits', title: 'Search preview limits', options: { collapsible: true, collapsed: true } },
    { name: 'redirect', title: 'Redirect', options: { collapsible: true, collapsed: true } },
  ],
  fields: [
    // ── Content ────────────────────────────────────────────────
    defineField({ name: 'title', title: 'Title', type: 'string', group: 'content', validation: r => r.required().max(100) }),
    defineField({
      name: 'slug', title: 'URL Slug', type: 'slug', group: 'content',
      description: 'The page will be at prophuntllp.com/blog/<this>. Click Generate. Do not change it after the post is live.',
      options: { source: 'title', maxLength: 96 }, validation: r => r.required(),
    }),
    defineField({
      name: 'excerpt', title: 'Summary', type: 'text', rows: 3, group: 'content',
      description: 'Displayed on the blog index and below the article title. 80 to 320 characters.',
      validation: r => r.required().min(80).max(320),
    }),
    defineField({
      name: 'category', title: 'Category', type: 'string', group: 'content', validation: r => r.required(),
      options: { list: [
        { title: 'Market Reports', value: 'market' }, { title: 'Buyer Guides', value: 'buyer' },
        { title: 'Investment', value: 'investment' }, { title: 'Legal & Docs', value: 'legal' }, { title: 'NRI Corner', value: 'nri' },
      ], layout: 'dropdown' },
    }),
    defineField({ name: 'author', title: 'Author', type: 'string', group: 'content', initialValue: 'PROPHUNT LLP' }),
    defineField({
      name: 'publishedAt', title: 'Publish at', type: 'datetime', group: 'content',
      initialValue: () => new Date().toISOString(), validation: r => r.required(),
      description: 'The post appears on the website from this date (and only after you click Publish). Set a future date to schedule it: the site picks it up within 6 hours of that time. Reading time is worked out automatically.',
    }),
    defineField({ name: 'imageBrief', title: 'Image brief', type: 'text', rows: 3, group: 'content', fieldset: 'imageBrief', description: 'What to find or create an image of for this post. 16:9, on-brand colours.' }),
    defineField({ name: 'imageAltSuggestion', title: 'Suggested Alt Text', type: 'string', group: 'content', fieldset: 'imageBrief', description: "Copy this into the Featured Image's alt text once you've added the image." }),
    defineField({ name: 'featuredImage', title: 'Featured Image', type: 'image', group: 'content', options: { hotspot: true }, fields: [altField], description: '1200 x 630 works best.' }),
    defineField({ name: 'tags', title: 'Tags', type: 'array', group: 'content', of: [defineArrayMember({ type: 'string' })], options: { layout: 'tags' } }),
    defineField({
      name: 'body', title: 'Article', type: 'array', group: 'content', validation: r => r.required().min(1),
      description: 'Use Heading 2 for each main section and Heading 3 inside them. Link to PropHunt project and location pages where it helps (select text, then the link icon or "Link to a project / post").',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            { title: 'Paragraph', value: 'normal' }, { title: 'Heading 2', value: 'h2' }, { title: 'Heading 3', value: 'h3' },
            { title: 'Heading 4', value: 'h4' }, { title: 'Quote', value: 'blockquote' },
          ],
          lists: [{ title: 'Bullets', value: 'bullet' }, { title: 'Numbered', value: 'number' }],
          marks: {
            decorators: [{ title: 'Bold', value: 'strong' }, { title: 'Italic', value: 'em' }, { title: 'Underline', value: 'underline' }, { title: 'Code', value: 'code' }],
            annotations: [
              defineArrayMember({
                name: 'link', type: 'object', title: 'Link',
                fields: [defineField({ name: 'href', type: 'url', title: 'Address', description: 'A full address, or a site path like /location/wakad', validation: r => r.uri({ scheme: ['http', 'https', 'mailto', 'tel'], allowRelative: true }) })],
              }),
              defineArrayMember({
                name: 'internalLink', type: 'object', title: 'Link to a project / post',
                fields: [defineField({ name: 'reference', type: 'reference', title: 'Page', to: [{ type: 'property' }, { type: 'blogPost' }], validation: r => r.required() })],
              }),
            ],
          },
        }),
        defineArrayMember({ type: 'image', options: { hotspot: true }, fields: [
          defineField({ name: 'alt', type: 'string', title: 'Describe the image' }),
          defineField({ name: 'caption', type: 'string', title: 'Caption' }),
        ] }),
        defineArrayMember({
          name: 'table', type: 'object', title: 'Table',
          fields: [defineField({
            name: 'rows', type: 'array', title: 'Rows', description: 'The first row is the header row.',
            of: [defineArrayMember({ name: 'row', type: 'object', fields: [defineField({ name: 'cells', type: 'array', title: 'Cells', of: [defineArrayMember({ type: 'string' })] })],
              preview: { select: { cells: 'cells' }, prepare: ({ cells }) => ({ title: (cells || []).join(' | ') }) } })],
          })],
          preview: { select: { rows: 'rows' }, prepare: ({ rows }) => ({ title: `Table: ${(rows && rows[0] && rows[0].cells || []).join(' | ')}`, subtitle: `${(rows || []).length} rows` }) },
        }),
        defineArrayMember({ name: 'code', type: 'object', title: 'Code', fields: [defineField({ name: 'language', type: 'string' }), defineField({ name: 'code', type: 'text' })] }),
        defineArrayMember({ name: 'divider', type: 'object', title: 'Divider line', fields: [defineField({ name: 'label', type: 'string', hidden: true })], preview: { prepare: () => ({ title: '──────── Divider ────────' }) } }),
      ],
    }),
    defineField({
      name: 'relatedProjects', title: 'Related Projects', type: 'array', group: 'content',
      description: 'Projects this article is about. Shown as project cards at the end of the article: the strongest internal link from the blog to a project page.',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'property' }] })], validation: r => r.unique().max(6),
    }),
    defineField({
      name: 'faqs', title: 'FAQs', type: 'array', group: 'content',
      description: 'Questions buyers actually ask about this topic. Shown at the end of the article and marked up for Google (FAQPage).',
      of: [defineArrayMember({ name: 'faq', type: 'object', fields: [
        defineField({ name: 'question', type: 'string', title: 'Question', validation: r => r.required() }),
        defineField({ name: 'answer', type: 'text', rows: 3, title: 'Answer', validation: r => r.required() }),
      ], preview: { select: { title: 'question', subtitle: 'answer' } } })],
    }),

    // ── SEO ────────────────────────────────────────────────────
    defineField({ name: 'seoAudit', title: 'SEO Analysis', type: 'string', group: 'seo', readOnly: true, components: { input: SeoAnalysisInput } }),
    defineField({ name: 'focusKeyword', title: 'Focus Keyword', type: 'string', group: 'seo', description: 'The main search phrase this article should rank for, e.g. stamp duty in Pune.' }),
    defineField({ name: 'secondaryKeywords', title: 'Secondary Keywords', type: 'array', group: 'seo', of: [defineArrayMember({ type: 'string' })], options: { layout: 'tags' }, description: 'Related phrases and variations (up to 8).', validation: r => r.max(8) }),
    defineField({ name: 'metaTitle', title: 'SEO Title', type: 'string', group: 'seo', description: 'The headline Google shows. Keep this near 50 to 60 characters.' }),
    defineField({ name: 'metaDescription', title: 'SEO Description', type: 'text', rows: 3, group: 'seo', description: 'The text Google shows under the headline. Keep this near 140 to 160 characters.' }),
    defineField({ name: 'breadcrumbTitle', title: 'Breadcrumb Title', type: 'string', group: 'seo', description: 'Optional shorter label used in breadcrumbs.' }),

    // ── Social ─────────────────────────────────────────────────
    defineField({ name: 'openGraphTitle', title: 'Social Title', type: 'string', group: 'social', fieldset: 'openGraph', description: 'Falls back to the SEO title when empty.' }),
    defineField({ name: 'openGraphDescription', title: 'Social Description', type: 'text', rows: 3, group: 'social', fieldset: 'openGraph', description: 'Falls back to the SEO description when empty.' }),
    defineField({ name: 'openGraphImage', title: 'Social Sharing Image', type: 'image', group: 'social', fieldset: 'openGraph', options: { hotspot: true }, fields: [altField], description: '1200 x 630 works best. Falls back to the featured image when empty.' }),
    defineField({
      name: 'twitterCard', title: 'Card Type', type: 'string', group: 'social', fieldset: 'twitter', initialValue: 'summary_large_image',
      options: { layout: 'radio', list: [{ title: 'Large image', value: 'summary_large_image' }, { title: 'Compact summary', value: 'summary' }] },
    }),
    defineField({ name: 'twitterTitle', title: 'X Title', type: 'string', group: 'social', fieldset: 'twitter', description: 'Falls back to the social title when empty.' }),
    defineField({ name: 'twitterDescription', title: 'X Description', type: 'text', rows: 3, group: 'social', fieldset: 'twitter', description: 'Falls back to the social description when empty.' }),
    defineField({ name: 'twitterImage', title: 'X Image', type: 'image', group: 'social', fieldset: 'twitter', options: { hotspot: true }, fields: [altField], description: 'Falls back to the social sharing image when empty.' }),

    // ── Advanced SEO ───────────────────────────────────────────
    defineField({
      name: 'canonicalUrl', title: 'Canonical URL', type: 'url', group: 'advanced',
      description: 'Leave empty to use the article URL automatically. Only set this when the article first appeared somewhere else.',
    }),
    defineField({
      name: 'schemaType', title: 'Article Schema Type', type: 'string', group: 'advanced', initialValue: 'BlogPosting',
      description: 'How Google is told to treat this page. Blog Posting suits almost every post.',
      options: { layout: 'radio', list: [{ title: 'Blog Posting', value: 'BlogPosting' }, { title: 'Article', value: 'Article' }, { title: 'News Article', value: 'NewsArticle' }] },
    }),
    defineField({ name: 'robotsIndex', title: 'Allow search engines to index this article', type: 'boolean', group: 'advanced', fieldset: 'robots', initialValue: true }),
    defineField({ name: 'robotsFollow', title: 'Allow search engines to follow links', type: 'boolean', group: 'advanced', fieldset: 'robots', initialValue: true }),
    defineField({ name: 'robotsNoArchive', title: 'Prevent cached copies', type: 'boolean', group: 'advanced', fieldset: 'robots', initialValue: false }),
    defineField({ name: 'robotsNoImageIndex', title: 'Prevent image indexing', type: 'boolean', group: 'advanced', fieldset: 'robots', initialValue: false }),
    defineField({ name: 'robotsNoSnippet', title: 'Prevent text snippets', type: 'boolean', group: 'advanced', fieldset: 'robots', initialValue: false }),
    defineField({ name: 'robotsMaxSnippet', title: 'Maximum Snippet Length', type: 'number', group: 'advanced', fieldset: 'previewLimits', initialValue: -1, description: 'Characters Google may show as a snippet. Use -1 for no limit.' }),
    defineField({ name: 'robotsMaxVideoPreview', title: 'Maximum Video Preview', type: 'number', group: 'advanced', fieldset: 'previewLimits', initialValue: -1, description: 'Seconds of video Google may preview. Use -1 for no limit.' }),
    defineField({
      name: 'robotsMaxImagePreview', title: 'Maximum Image Preview', type: 'string', group: 'advanced', fieldset: 'previewLimits', initialValue: 'large',
      options: { layout: 'radio', list: [{ title: 'Large', value: 'large' }, { title: 'Standard', value: 'standard' }, { title: 'None', value: 'none' }] },
    }),
    defineField({ name: 'excludeFromSitemap', title: 'Exclude from XML sitemap', type: 'boolean', group: 'advanced', initialValue: false, description: 'Posts that are not indexed are always left out.' }),
    defineField({ name: 'redirectUrl', title: 'Redirect Destination', type: 'url', group: 'advanced', fieldset: 'redirect', description: 'Optional. Visitors to this article are sent here instead (for example after merging two posts).', validation: r => r.uri({ allowRelative: true }) }),
    defineField({ name: 'redirectPermanent', title: 'Permanent Redirect', type: 'boolean', group: 'advanced', fieldset: 'redirect', initialValue: true, description: 'On uses a permanent (301) redirect. Off uses a temporary (302) redirect.' }),
  ],
  orderings: [{ title: 'Newest first', name: 'publishedDesc', by: [{ field: 'publishedAt', direction: 'desc' }] }],
  preview: {
    select: { title: 'title', category: 'category', date: 'publishedAt', media: 'featuredImage' },
    prepare: ({ title, category, date, media }) => ({
      title, media,
      subtitle: [{ market: 'Market Reports', buyer: 'Buyer Guides', investment: 'Investment', legal: 'Legal & Docs', nri: 'NRI Corner' }[category] || category, date && date.slice(0, 10)].filter(Boolean).join(' | '),
    }),
  },
})

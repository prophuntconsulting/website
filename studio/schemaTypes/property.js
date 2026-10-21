import { defineType, defineField, defineArrayMember } from 'sanity'

// Field names match the frontmatter keys the site build reads
// (scripts/build-properties.js and friends), so scripts/sanity-pull.js can
// write each document straight back out as properties/posts/{slug}.md.

const unitFields = n => [
  defineField({ name: `unit_${n}_type`, title: `Unit ${n}: Type`, type: 'string', group: 'pricing', description: n === 1 ? 'e.g. 2 BHK' : undefined }),
  defineField({ name: `unit_${n}_area`, title: `Unit ${n}: Area`, type: 'string', group: 'pricing', description: n === 1 ? 'e.g. 1,200 sqft' : undefined }),
  defineField({ name: `unit_${n}_price`, title: `Unit ${n}: Price`, type: 'string', group: 'pricing', description: n === 1 ? 'e.g. ₹1.25 Cr* or Price on Request' : undefined }),
  defineField({ name: `unit_${n}_featured`, title: `Unit ${n}: Featured (highlight this card)`, type: 'boolean', group: 'pricing', initialValue: false }),
]

const statFields = n => [
  defineField({ name: `stat_${n}_value`, title: `Stat ${n}: Value`, type: 'string', group: 'overview' }),
  defineField({ name: `stat_${n}_label`, title: `Stat ${n}: Label`, type: 'string', group: 'overview' }),
]

export const property = defineType({
  name: 'property',
  title: 'Property Listing',
  type: 'document',
  groups: [
    { name: 'basics', title: 'Basic info', default: true },
    { name: 'location', title: 'Location' },
    { name: 'media', title: 'Images & media' },
    { name: 'overview', title: 'Overview' },
    { name: 'pricing', title: 'Pricing' },
    { name: 'amenities', title: 'Amenities' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    // ── Basic info ─────────────────────────────────────────────
    defineField({ name: 'title', title: 'Project Name', type: 'string', group: 'basics', description: 'e.g. Godrej River Royale', validation: r => r.required() }),
    defineField({
      name: 'slug', title: 'Page address', type: 'slug', group: 'basics',
      description: 'The page lives at /projects/{this}. Click Generate for a new listing. Do not change it on a live listing: Google has indexed the old address.',
      options: { source: 'title', maxLength: 80 }, validation: r => r.required(),
    }),
    defineField({ name: 'date_added', title: 'Date Added', type: 'date', group: 'basics', initialValue: () => new Date().toISOString().slice(0, 10), description: 'Used to sort listings by Newest/Oldest. Leave as today unless backdating.' }),
    defineField({ name: 'developer', title: 'Developer / Builder', type: 'string', group: 'basics', description: 'e.g. Godrej Properties' }),
    defineField({ name: 'config', title: 'Configuration', type: 'string', group: 'basics', description: 'e.g. 2 & 3 BHK or Villa Plots' }),
    defineField({ name: 'area', title: 'Area', type: 'string', group: 'basics', description: 'e.g. From 1,200 sqft' }),
    defineField({
      name: 'category', title: 'Category', type: 'string', group: 'basics',
      options: { list: [
        { title: 'Apartment', value: 'apartment' }, { title: 'Plot', value: 'plot' },
        { title: 'Villa', value: 'villa' }, { title: 'Commercial', value: 'commercial' },
      ], layout: 'radio', direction: 'horizontal' },
    }),
    defineField({
      name: 'status', title: 'Status', type: 'string', group: 'basics', initialValue: 'active',
      options: { list: [
        { title: 'Active / Ongoing', value: 'active' }, { title: 'Coming Soon', value: 'coming-soon' }, { title: 'Sold Out', value: 'sold-out' },
      ], layout: 'radio', direction: 'horizontal' },
    }),
    defineField({ name: 'rera', title: 'RERA Number', type: 'string', group: 'basics', description: 'MahaRERA project registration number, copied from maharera.maharashtra.gov.in. Several phases: "P521... (Phase 1), P521... (Tower B)".' }),
    defineField({ name: 'last_verified', title: 'Last Verified Date', type: 'date', group: 'basics', description: "Date you last checked this project's price, inventory and possession with the developer. Shown publicly as 'Last verified', so only fill it in when you have actually re-checked." }),
    defineField({ name: 'tagline', title: 'Alert Bar Text', type: 'string', group: 'basics', initialValue: 'New Launch | Limited Units Available', description: "Short announcement in the red bar, e.g. 'New Launch | Limited Units Available'" }),

    // ── Location ───────────────────────────────────────────────
    defineField({ name: 'location', title: 'Location', type: 'string', group: 'location', description: 'e.g. Baner–Hinjewadi Rd, Pune. The locality here decides which location pages list the project.' }),
    defineField({ name: 'area_alias', title: 'Area Name Buyers Search (optional)', type: 'string', group: 'location', description: "Only if buyers search this project under a different area name than the Location, e.g. Tathawade for a 'Downtown Wakad' project. Used in the page title." }),
    defineField({ name: 'lat', title: 'Map Latitude', type: 'number', group: 'location', description: 'Project site latitude, e.g. 18.5987. Right-click the project on Google Maps to copy it. Used for "What\'s nearby" and "near landmark" pages. Leave blank if unsure.' }),
    defineField({ name: 'lng', title: 'Map Longitude', type: 'number', group: 'location', description: 'Project site longitude, e.g. 73.7651.' }),
    defineField({
      name: 'geo_confidence', title: 'How exact is the map point?', type: 'string', group: 'location',
      description: 'Only "exact" and "street" points are used for distance-based pages.',
      options: { list: ['exact', 'street', 'locality'] },
    }),

    // ── Media ──────────────────────────────────────────────────
    defineField({ name: 'hero_1', title: 'Hero Image 1 (Main)', type: 'image', group: 'media', options: { hotspot: true }, description: 'Primary project photo: listing card and detail page hero.' }),
    defineField({ name: 'hero_2', title: 'Hero Image 2', type: 'image', group: 'media', options: { hotspot: true } }),
    defineField({ name: 'hero_3', title: 'Hero Image 3', type: 'image', group: 'media', options: { hotspot: true } }),
    defineField({ name: 'hero_caption', title: 'Hero Caption', type: 'string', group: 'media', description: 'Optional caption below the hero. Leave blank to auto-generate from the project name.' }),
    defineField({ name: 'gallery_images', title: 'Gallery Images', type: 'array', group: 'media', of: [defineArrayMember({ type: 'image' })], options: { layout: 'grid' } }),
    defineField({ name: 'gallery_videos', title: 'Gallery Videos (MP4)', type: 'array', group: 'media', of: [defineArrayMember({ type: 'file', options: { accept: 'video/mp4' } })] }),
    defineField({ name: 'rera_qr', title: 'RERA QR Code', type: 'image', group: 'media', description: 'Upload the OFFICIAL QR code image from the MahaRERA certificate, never a generated one. Leave blank to hide the QR (the registration number still shows).' }),
    defineField({ name: 'brochure', title: 'Brochure PDF', type: 'file', group: 'media', options: { accept: 'application/pdf' }, description: 'Leave blank to hide the download button.' }),

    // ── Overview ───────────────────────────────────────────────
    defineField({ name: 'overview', title: 'Project Overview', type: 'text', rows: 5, group: 'overview', description: '2–4 sentences describing the project.' }),
    ...[1, 2, 3, 4].flatMap(statFields),

    // ── Pricing ────────────────────────────────────────────────
    defineField({ name: 'price', title: 'Starting Price (₹ Lakhs)', type: 'number', group: 'pricing', initialValue: 0, description: 'In Lakhs, for filters: 84 for ₹84L, 265 for ₹2.65Cr. Enter 0 for Price on Request.' }),
    ...[1, 2, 3].flatMap(unitFields),

    // ── Amenities ──────────────────────────────────────────────
    defineField({ name: 'amenities', title: 'Amenities', type: 'array', group: 'amenities', of: [defineArrayMember({ type: 'string' })], description: 'One amenity per item, e.g. Swimming Pool, Gymnasium, Club House' }),

    // ── SEO (optional overrides) ───────────────────────────────
    defineField({
      name: 'seo_title', title: 'SEO Title (optional)', type: 'string', group: 'seo',
      description: 'The headline Google shows. Leave empty to generate one from the project name, area, configuration and RERA. "| PROPHUNT" is added when it fits.',
      validation: r => r.max(60).warning('Over 60 characters gets cut off in Google.'),
    }),
    defineField({
      name: 'seo_description', title: 'SEO Description (optional)', type: 'text', rows: 3, group: 'seo',
      description: 'The text Google shows under the headline. Leave empty to generate one. Lead with what searchers want: configuration, size, location, price or RERA.',
      validation: r => r.max(160).warning('Keep under 160 characters.'),
    }),
  ],
  orderings: [
    { title: 'Project name', name: 'titleAsc', by: [{ field: 'title', direction: 'asc' }] },
    { title: 'Newest first', name: 'dateDesc', by: [{ field: 'date_added', direction: 'desc' }] },
  ],
  preview: {
    select: { title: 'title', developer: 'developer', status: 'status', media: 'hero_1' },
    prepare: ({ title, developer, status, media }) => ({
      title, media,
      subtitle: [developer, status === 'coming-soon' ? 'Coming soon' : status === 'sold-out' ? 'Sold out' : null].filter(Boolean).join(' · '),
    }),
  },
})

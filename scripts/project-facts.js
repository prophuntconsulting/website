/**
 * Public MahaRERA registration facts for project pages, kept in the repo
 * because the Sanity property schema has no fields for them. build-properties
 * merges them into each project as rera_* keys, so they reach both the
 * prerendered page and properties/posts.json (which the client renderer uses).
 *
 * Only facts a public source states; leave a field out rather than guess.
 *   possession   MahaRERA proposed (or revised) completion date, "Mon YYYY"
 *   revised      true when that date is an extension of the original one
 *   registered   MahaRERA registration date, "Mon YYYY"
 *   promoter     legal entity registered as promoter
 *   land         land / plot area as registered, e.g. "1.9 acres"
 *   buildings    e.g. "4 towers, G+3P+23 storeys"
 *   units        total units registered, e.g. "about 936" (shown as "... units")
 *   checked      date these facts were last checked (YYYY-MM-DD)
 *   source       where they were checked
 */
// 28 Oct 2026: cross-checked across aurumproptech.in, cityair.in and
// reunionhq.in (which republish MahaRERA filings) plus the developers' sites.
// Left out: unit totals where sources disagree, and possession dates for
// Memento (Sep 2026 date has passed, no extension or OC found), City Avenue
// (status unclear) and Western Avenue (completed, so a date adds nothing).
const SRC = 'public MahaRERA filing data';
const PROJECT_FACTS = {
  'anp-memento': {
    promoter: 'Five Star Construction Company',
    land: 'about 2.07 acres (8,358 sq m)',
    buildings: '4 towers, G+3P+23 storeys',
    registered: 'Aug 2020',
    checked: '2026-10-28', source: SRC,
  },
  'anp-ultimus': {
    possession: 'Jun 2027',
    promoter: 'Swadik Trade Pvt Ltd',
    land: 'about 4.16 acres (16,827 sq m)',
    buildings: '6 towers, B+G+2P+35 storeys',
    checked: '2026-10-28', source: SRC,
  },
  'city-avenue-wakad': {
    promoter: 'Carnation Landmarks LLP',
    land: 'about 17 acres (68,605 sq m, whole registered layout)',
    registered: 'Aug 2017',
    checked: '2026-10-28', source: SRC,
  },
  'western-avenue-wakad': {
    promoter: 'Kolte-Patil Developers Ltd',
    land: 'about 13.4 acres (54,205 sq m)',
    units: 'about 936',
    registered: 'Jul 2017',
    checked: '2026-10-28', source: SRC,
  },
  'rohan-viti': {
    possession: 'Dec 2027',
    revised: true,
    promoter: 'Rohan Builders & Developers Pvt Ltd',
    land: 'about 0.9 acres (3,620 sq m)',
    buildings: '3 towers',
    checked: '2026-10-28', source: SRC,
  },
};

module.exports = { PROJECT_FACTS };

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
// Rule for every entry: a field is kept only when the developer states it or
// two independent sources agree; passed dates with no extension are left out.
// First five: unit totals left out where sources disagree, and possession for
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
  // Group 3 (cityair.in, squareyards, reunionhq, housing, housiey, nobroker, 360realtors, developer sites)
  'anp-bizsquare': { registered: 'May 2024', promoter: 'Five Star Vighnesh Associates (AOP)', land: 'about 0.23 acres (944 sq m)', units: 'about 68', checked: '2026-10-28', source: SRC },
  'ashokvillas': { units: '19 villas', checked: '2026-10-28', source: SRC },
  'kalpataru-blossoms': { possession: 'Mar 2029 (Towers 1 and 3)', checked: '2026-10-28', source: SRC },
  'kohinoor-westview-reserve': { possession: 'Dec 2028 (P52100048589 registration)', promoter: 'Goldway Realty', land: 'about 4.25 acres (17,214 sq m, P52100048589 registration)', units: 'about 782 (P52100048589 registration)', checked: '2026-10-28', source: SRC },
  'lodha-altero': { possession: 'Jun 2030', buildings: '3 towers', checked: '2026-10-28', source: SRC },
  'merlin-ventana': { possession: 'Dec 2028', promoter: 'Merlin Bhingarwala Developers LLP', land: 'about 1.08 acres (4,378 sq m)', checked: '2026-10-28', source: SRC },
  'supreme-estia': { registered: 'Mar 2020 (Phase 1)', promoter: 'Supreme Palatial Developers LLP', checked: '2026-10-28', source: SRC },
  // Group 4 (aurumproptech.in, cityair.in, housiey, housing.com, keystone, digipace, 360realtors); single-source fields dropped
  'anp-landmark': { registered: 'Nov 2019', promoter: 'Five Star Construction Company', checked: '2026-10-28', source: SRC },
  'kings-county-wakad': { possession: 'Dec 2027', checked: '2026-10-28', source: SRC },
  'kumar-panache': { possession: 'Dec 2027', buildings: '1 tower, G+11 storeys', checked: '2026-10-28', source: SRC },
  'lodha-massimo': { possession: 'Jun 2029', checked: '2026-10-28', source: SRC },
  'tej-elevia': { possession: 'Dec 2028 (Bldg A/B and C)', registered: 'Oct 2018 (Bldg A/B)', promoter: 'Tejraj Realtors LLP', land: 'about 0.88 acres (3,547 sq m, Bldg A/B registration)', checked: '2026-10-28', source: SRC },
  'venkatesh-tresor': { possession: 'Mar 2030', checked: '2026-10-28', source: SRC },
  // Group 2 (aurumproptech.in, reunionhq.in, cityair.in, propertypistol, 360realtors); Regalia skipped (RERA no. also attached to other Kohinoor projects)
  'abil-imperial-atria': { land: 'about 0.97 acres (3,917 sq m, Tower 2 registration)', checked: '2026-10-28', source: SRC },
  'anp-retreat': { promoter: 'Five Star Construction Company', land: 'about 0.88 acres (3,550 sq m)', units: 'about 186', checked: '2026-10-28', source: SRC },
  'livience-unione': { possession: 'Dec 2030', checked: '2026-10-28', source: SRC },
  'regency-astra': { possession: 'Dec 2026 (Phase III, P52100053943)', promoter: 'Regency Aawishkar Sarsan Developers LLP', land: 'about 1.42 acres (5,745 sq m, Phase III registration)', units: 'about 168 (Phase III registration)', checked: '2026-10-28', source: SRC },
  'the-ornate-baner': { possession: 'Dec 2029', promoter: 'Empresa Estate Pvt Ltd', land: 'about 2.23 acres (9,028 sq m)', buildings: '2 towers', checked: '2026-10-28', source: SRC },
  'yashwin-urbo-centro': { possession: 'Dec 2027 (Phase 1, P52100053194)', promoter: 'Vilas Javdekar Infinitee Developers Pvt Ltd', land: 'about 3.1 acres (12,500 sq m, Phase 1 registration)', units: 'about 700 (Phase 1 registration)', checked: '2026-10-28', source: SRC },
  // Group 1 (squareyards, cityair.in, housiey, realestateindia, digipace, gharpe, mahindralifespaces.com); Tower D left out of 24K Altura (site's number unconfirmed)
  '24k-altura': { possession: 'Mar 2028 (Tower A/B), Dec 2030 (Tower C)', promoter: 'Kolte-Patil Developers Ltd', land: 'about 0.68 acres (2,740 sq m, Tower A/B registration)', units: 'about 264 (Tower A/B registration)', checked: '2026-10-28', source: SRC },
  'anp-privado': { possession: 'Sep 2031 (Phase 1)', checked: '2026-10-28', source: SRC },
  'kumar-parth-towers': { possession: 'Dec 2027 (Tower C1), Mar 2028 (Tower C2)', checked: '2026-10-28', source: SRC },
  'mahindra-citadel': { possession: 'Jun 2028 (Phase 1, Towers A-D), Mar 2030 (Bastion I)', promoter: 'Mahindra Lifespace Developers Ltd', checked: '2026-10-28', source: SRC },
  'nyati-emerald': { possession: 'May 2027 (Phase I), Aug 2028 (Phase III)', checked: '2026-10-28', source: SRC },
  'the-balmoral-hillside': { possession: 'Dec 2028 (Tower B)', checked: '2026-10-28', source: SRC },
};

module.exports = { PROJECT_FACTS };

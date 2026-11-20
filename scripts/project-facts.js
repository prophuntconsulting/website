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
  // 13 Nov 2026: possession Mar 2032 and land ~35,067 sq m agree across listing
  // sites republishing the MahaRERA filing (dwello.in, nobrokerage.com,
  // bookmywing.com); unit totals disagree (618 / 1,250 / 1,301), so left out.
  'kohinoor-avantara': {
    possession: 'Mar 2032',
    land: 'about 8.7 acres (35,067 sq m)',
    checked: '2026-11-13', source: SRC,
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
  'peninsula-ashok-villas-ravet': { units: '19 villas', checked: '2026-10-28', source: SRC },
  'kalpataru-blossoms': { possession: 'Mar 2029 (Towers 1 and 3)', checked: '2026-10-28', source: SRC },
  // Registered 6 Nov 2026 (S. No. 31/32B Plot B, Wadgaon Bk; Blossoms is Plot A).
  'kalpataru-aurevia': { registered: 'Nov 2026', promoter: 'Kalpataru Limited', units: '109 (Tower 5)', possession: 'Sep 2032', checked: '2026-11-19', source: SRC },
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

// 20 Nov 2026 MahaRERA pass (registered-projects search + the cityair mirror).
// Same rule as above: only proposed completion dates still ahead, and only
// extensions MahaRERA itself shows (mirror-only "extended" dates are left out).
const NOV20 = {
  '24k-altura': { possession: 'Mar 2028 (Tower A/B), Mar 2029 (Tower D), Dec 2030 (Tower C)' },
  'joyville-sensorium-hinjewadi': { possession: 'Dec 2026 (Phase VII)', units: '258 (Phase VII)' },
  'kohinoor-abhimaan-shirgaon': { possession: 'Dec 2026 (Phase 3)', promoter: 'Rising Propcon LLP' },
  'kolte-patil-qrious-life-republic': { possession: 'Apr 2030 (Phase 1), Dec 2030 (Phase 2)', units: '452 (Phase 1), 863 (Phase 2)' },
  'lodha-bella-vita-nibm': { possession: 'Dec 2026 (Tower 10)' },
  'regency-astra': { possession: 'Dec 2026 (Phase III), Dec 2028 (Phase V)' },
  'shapoorji-pallonji-treetopia-jadhavwadi': { possession: 'Sep 2028 (Phases 2-6)' },
  'godrej-aqua-vista-keshav-nagar': { possession: 'Mar 2032', units: 'about 1,582', land: 'about 42.9 acres' },
  'kalpataru-aria': { possession: 'Dec 2026 (Phase D), Mar 2028 (Phase E)' },
  'rohan-ekam-balewadi': { possession: 'Dec 2027 (Phase 1), Mar 2030 (Phase 2), Sep 2030 (Phase 3)', units: '414 (Phase 1), 100 (Phase 2), 104 (Phase 3)' },
  'shapoorji-vanaha-verdant-bavdhan': { possession: 'Jun 2030 (Mahogany I & II), Dec 2030 (Elm I & II)', units: '363 (Mahogany), 240 (Elm)' },
  'mahindra-citadel': { possession: 'Jun 2028 (Phase 1, Towers A-D), Jun 2029 (Bastion J, K), Mar 2030 (Bastion I), Aug 2031 (Phase 5)' },
  'neoliv-grand-forest-prive': { possession: 'Sep 2030 (Privé 1-4)' },
  'rohan-harita-tathawade': { possession: 'Dec 2027 (Phase 1)', units: '499 (Phase 1)' },
  'shapoorji-wildernest-hadapsar': { possession: 'Jun 2027 to Mar 2028 (Towers 1-4)', units: '76 per tower' },
  'the-balmoral-hillside': { possession: 'Dec 2028 (Tower B), Jun 2029 (Tower A)', units: '136 per tower' },
  'bramha-sun-valley-bavdhan': { possession: 'Dec 2030 (Phase 1)', units: '411 (Phase 1)' },
  'godrej-river-royale': { possession: 'Mar 2029', units: '370' },
  'kalpataru-blossoms': { possession: 'Mar 2029 (Towers 1 and 2)' },
  'kohinoor-satori-baner': { possession: 'Dec 2028', units: '652', land: 'about 6 acres' },
  'mahindra-rivenza-mahalunge': { possession: 'Dec 2031 (Phases 1 and 2)', units: '612 (Phase 1), 654 (Phase 2)' },
  'nyati-emerald': { possession: 'Feb 2027 (Phase II), May 2027 (Phase I), Aug 2028 (Phase III)' },
  'supreme-villagio-somatane': { possession: 'Dec 2027 (Phase III)', promoter: 'Turquoise Housing LLP' },
  'kohinoor-avantara': { units: 'about 1,373' },
  'peninsula-ashok-villas-ravet': { possession: 'Dec 2029' },
};
for (const [slug, f] of Object.entries(NOV20)) {
  PROJECT_FACTS[slug] = { ...(PROJECT_FACTS[slug] || {}), ...f, checked: '2026-11-20', source: SRC };
}

// Every project whose MahaRERA number(s) we found on the MahaRERA search under
// the project's own name on 20 Nov 2026. Pages show "MahaRERA verified" with
// this date. Left out on purpose: numbers registered under another name or
// promoter (greenfinity-wakad, majestique-elements, vtp-altitude) and projects
// with no number yet.
const VERIFIED_NOV20 = [
  '24k-altura', 'anp-privado', 'joyville-sensorium-hinjewadi', 'kohinoor-abhimaan-shirgaon', 'kolte-patil-qrious-life-republic',
  'lodha-bella-vita-nibm', 'merlin-ventana', 'regency-astra', 'shapoorji-pallonji-treetopia-jadhavwadi', 'tej-elevia',
  'abil-imperial-atria', 'anp-retreat', 'godrej-aqua-vista-keshav-nagar', 'kalpataru-aria', 'kohinoor-avantara', 'kumar-panache',
  'lodha-massimo', 'rohan-ekam-balewadi', 'shapoorji-vanaha-verdant-bavdhan', 'western-avenue-wakad',
  'anp-bizsquare', 'anp-ultimus', 'godrej-evergreen-square-hinjewadi', 'kalpataru-aurevia', 'kohinoor-regalia-towers',
  'kumar-parth-towers', 'mahindra-citadel', 'neoliv-grand-forest-prive', 'rohan-harita-tathawade', 'shapoorji-wildernest-hadapsar',
  'the-balmoral-hillside', 'yashwin-urbo-centro',
  'anp-landmark', 'bramha-sun-valley-bavdhan', 'godrej-river-royale', 'kalpataru-blossoms', 'kohinoor-satori-baner', 'livience-unione',
  'mahindra-rivenza-mahalunge', 'nyati-emerald', 'rohan-viti', 'supreme-estia', 'the-ornate-baner',
  'anp-memento', 'city-avenue-wakad', 'kings-county-wakad', 'kohinoor-westview-reserve', 'lodha-altero',
  'peninsula-ashok-villas-ravet', 'supreme-villagio-somatane', 'venkatesh-tresor',
];
for (const slug of VERIFIED_NOV20) {
  PROJECT_FACTS[slug] = { ...(PROJECT_FACTS[slug] || {}), checked: '2026-11-20', verified: true, source: (PROJECT_FACTS[slug] || {}).source || SRC };
}

// 20 Nov 2026: projects added from the Hinjewadi and high-demand research (MahaRERA search + cityair mirror).
const NEW_NOV20 = {
  "godrej-park-world-hinjewadi": {possession: "Mar 2029 (The Gale), Dec 2030 (The Greenfront, extended), Sep 2031 (The Aqua Retreat)",units: "4,471 registered units: The Aqua Retreat 1,864; The Greenfront 1,152; The Gale 1,455",promoter: "Maan-Hinje Township Developers Pvt Ltd (The Gale registered as Maan-Hinje Township Developers LLP)",registered: "Feb 2024 (The Gale), Feb 2025 (The Greenfront), Jun 2025 (The Aqua Retreat)",land: "about 8.67 acres (The Aqua Retreat) + 7.14 acres (The Greenfront) + 6.30 acres (The Gale), within the 50+ acre Godrej Park World"},
  "lodha-sylvan-hinjewadi": {possession: "Dec 2030 (Tower 15, extended date on MahaRERA)",units: "124 (Tower 15)",promoter: "Bellissimo Infratech Pvt Ltd",registered: "Feb 2026",land: "about 14.9 acres (layout plot area shared by the Phase 3 registrations)"},
  "lodha-panache-hinjewadi": {possession: "Jun 2027 (Hinjewadi Project & Tower 1), Jun 2028 (Towers 4 & 5), Jun 2031 (Towers A & B)",units: "1,573 across five registrations: Tower A 260, Tower B 263, Hinjewadi Project 427, Tower 1 212, Towers 4 & 5 411 (Tower 6 not confirmed)",promoter: "Lodha Developers Ltd",registered: "Mar 2023 (Hinjewadi Project), Jun 2023 (Towers 1, 4 & 5), Sep 2025 (Towers A & B)",land: "about 2.75 acres (Tower A & B registration)"},
  "lodha-belmondo-gahunje": {possession: "Oct 2028 (Tower 32, extended), Aug 2030 (Townhouse 4)",units: "Tower 32: 85; Townhouse 4: 7",promoter: "Macrotech Developers Ltd (Lodha)",registered: "Mar 2019 (Tower 32), Aug 2026 (Townhouse 4)",land: "about 100+ acres"},
  "shapoorji-vyomora-maan": {possession: "Apr 2031 (Phase 1), Aug 2031 (Phase 3), Dec 2031 (Phase 2)",units: "720 registered: Phase 1 330, Phase 2 60, Phase 3 330",promoter: "Joyville Shapoorji Housing Pvt Ltd",registered: "Jul 2026 (Phase 1), Oct 2026 (Phases 2 & 3)",land: "about 24.4 acres (MahaRERA); developer states 25 acres"},
  "life-republic-canvas": {possession: "Sep 2029 (Phase I); Dec 2030 (Phase II)",units: "948 (487 Phase I + 461 Phase II)",promoter: "Kolte-Patil Developers Ltd",registered: "Jul 2024 (Phase I); Oct 2025 (Phase II)",land: "about 8.4 acres (2.16 Phase I + 6.25 Phase II)"},
  "life-republic-echoes": {possession: "Dec 2030 (Phase 1)",units: "545",promoter: "Kolte-Patil Developers Ltd",registered: "Feb 2026"},
  "life-republic-duet": {possession: "Dec 2029 (Phase I); Dec 2030 (Phase II)",units: "1,231 (388 Phase I + 843 Phase II)",promoter: "Kolte-Patil Developers Ltd",registered: "Mar 2025 (Phase I); Aug 2025 (Phase II)",land: "about 8.1 acres (2.38 Phase I + 5.69 Phase II)"},
  "life-republic-atmos": {possession: "Oct 2027 (Phase I); Dec 2028 (Phase II)",units: "1,118 (635 Phase I + 483 Phase II)",promoter: "Kolte-Patil Developers Ltd",registered: "Jun 2023 (Phase I); May 2024 (Phase II)",land: "about 6.1 acres (4.04 Phase I + 2.03 Phase II)"},
  "life-republic-aros": {possession: "Dec 2026 (Phase I); Jun 2028 (Phase II)",units: "1,439 (739 Phase I + 700 Phase II)",promoter: "Kolte-Patil Developers Ltd (Phase I); Kolte-Patil Integrated Townships Ltd (Phase II)",registered: "Dec 2022 (Phase I); Jan 2024 (Phase II)",land: "about 4.5 acres (2.27 Phase I + 2.26 Phase II)"},
  "kolte-patil-little-earth-kiwale": {possession: "Jun 2028 (C13, C14); Jun 2029 (D1, D2)",units: "487 in D1 (170), D2 (149), C13 (84) and C14 (84); B7 not confirmed",promoter: "Kolte-Patil Developers Ltd",registered: "Jan 2024 (C13, C14); Jan 2025 (D1, D2)"},
  "vtp-monarque-hinjewadi": {possession: "Dec 2029 (Phase 1 & Phase 2); Dec 2030 (Phase 3)",units: "1,086 (Phase 1: 504, Phase 2: 144, Phase 3: 438)",promoter: "Mexus Real Estate Developers LLP",registered: "Aug 2024 (Phase 1); Mar 2025 (Phase 2 & Phase 3)",land: "about 0.9 acres (Phase 2) and 4.83 acres (Phase 3); developer states 9 acres overall"},
  "vtp-volare-hinjewadi": {possession: "Dec 2029",units: "739",promoter: "Mexus Real Estate Developers LLP",registered: "Sep 2024",land: "about 2.63 acres"},
  "kohinoor-royale-towers-hinjewadi": {possession: "Dec 2030",units: "454",promoter: "Intofinity Promoters Pvt Ltd",registered: "Oct 2025",land: "about 2.59 acres"},
  "gera-joy-on-the-treetops-hinjewadi": {possession: "Mar 2030 (Project A); Dec 2031 (Project B)",units: "1,050 registered",promoter: "Gera Projects Pvt Ltd",registered: "Oct 2024 (Project A); Dec 2025 (Project B)",land: "about 10.7 acres"},
  "paranjape-the-ridges-41-hinjewadi": {possession: "Dec 2029",units: "632",promoter: "Aurigaa Realtors",registered: "Apr 2024",land: "about 2.29 acres"},
  "nanded-city-saajgiri": {possession: "Aug 2029 (Saajgiri); Dec 2027 (Aalaap-I)",units: "648 homes in Saajgiri; 936 in Aalaap-I",promoter: "Nanded City Development & Construction Co. Ltd.",registered: "Nov 2025 (Saajgiri); Mar 2024 (Aalaap-I)",land: "about 8.3 acres (Saajgiri)"},
  "pride-world-city-valencia": {possession: "Dec 2031 (Valencia D-E-F-G)",units: "449 homes",promoter: "Prime Centre & Developers Private Limited",registered: "Oct 2026",land: "about 7.8 acres"},
  "amanora-gateway-towers": {possession: "Jun 2029 (Towers 102 & 103); Dec 2030 (Tower 101)",units: "485 homes (170 in Tower 101, 315 in Towers 102 & 103)",promoter: "City Corporation Limited",registered: "Mar 2025 (Towers 102 & 103); Sep 2025 (Tower 101)",land: "about 4.3 acres"},
  "sukhwani-skylines-wakad": {possession: "Ready to move (MahaRERA status: completed)",units: "853 homes",promoter: "Sukhwani Chawla Developers",registered: "Jun 2019",land: "about 6.2 acres"},
  "sobha-nesara-kothrud": {possession: "Mar 2027 (Block 3)",units: "293 apartments; Block 1: 92, Block 3: 111 (MahaRERA)",promoter: "SOBHA LIMITED",registered: "Mar 2019"},
};
for (const [slug, f] of Object.entries(NEW_NOV20)) {
  PROJECT_FACTS[slug] = { ...f, checked: '2026-11-20', verified: true, source: SRC };
}

module.exports = { PROJECT_FACTS };

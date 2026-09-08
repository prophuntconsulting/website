/**
 * Locality SEO content — shared by build-properties.js
 *
 * Maps each project's free-text `location` string to one of the curated
 * micro-market buckets (same buckets used by the Location filter on the
 * projects page, js/projects.js — keep both lists in sync if you add one),
 * then supplies per-bucket FAQ copy and a curated landmarks list.
 *
 * This is the single source of truth for locality SEO content: it feeds
 * both the FAQPage JSON-LD written into each generated project page's
 * <head>, and the visible "Frequently Asked Questions" / "Explore Nearby"
 * sections rendered client-side on property.html. Add a new locality once
 * here and every current + future project in that area picks it up
 * automatically.
 */

const MICRO_MARKETS = [
  ['mahalunge',       'mahalunge'],
  ['karjat',          'karjat'],
  ['khopoli',         'khopoli'],
  ['wakad',           'wakad'],
  ['pimpri',          'pimpri-chinchwad'],
  ['ravet',           'ravet-gahunje'],
  ['gahunje',         'ravet-gahunje'],
  ['sinhagad',        'sinhagad-road'],
  ['hadapsar',        'hadapsar'],
  ['baner',           'baner'],
];

function getMicroMarket(location) {
  const loc = (location || '').toLowerCase();
  for (const [needle, bucket] of MICRO_MARKETS) {
    if (loc.includes(needle)) return bucket;
  }
  return '';
}

// Only facts that are broadly documented/well-known about each locality —
// no invented statistics, no fabricated distances. Landmarks are named,
// real places; proximity is described qualitatively ("close to", "a short
// drive from") since we don't have per-project geocoding to state exact
// distances honestly.
const LOCALITY_CONTENT = {
  'baner': {
    name: 'Baner',
    faqs: [
      { q: 'Where is Baner located and why is it popular with homebuyers?', a: 'Baner is a premium residential and IT corridor in west Pune, close to the Mumbai-Pune Expressway and adjoining Balewadi and Pashan. Its mix of IT parks, malls, restaurants and schools has made it one of Pune’s most sought-after addresses for professionals and families.' },
      { q: 'How well connected is Baner to the rest of Pune?', a: 'Baner sits on the Baner-Pashan Link Road and is close to the Mumbai-Pune Expressway, giving quick access to Hinjewadi, Aundh and central Pune. The Pune Metro’s extension towards Baner is further improving connectivity.' },
      { q: 'What is the investment case for buying property in Baner?', a: 'Baner has seen sustained demand from IT professionals and NRIs due to its proximity to employment hubs and strong social infrastructure, which has historically supported steady appreciation and healthy rental demand in the corridor.' },
      { q: 'What lifestyle and social infrastructure does Baner offer?', a: 'Residents have access to established malls and high streets (including the Balewadi High Street area), multiplexes, restaurants, gyms and the Balewadi Sports Complex, alongside reputed schools and hospitals in the vicinity.' },
    ],
    landmarks: {
      education: ['Symbiosis International University', 'Vishwakarma Institute of Technology', 'Orchids International School'],
      business:  ['Baner-Pashan Link Road IT corridor', 'Panchshil Business Park (Balewadi)', 'World Trade Center, Kharadi (short drive)'],
      hospital:  ['Sahyadri Super Speciality Hospital, Baner', 'Ruby Hall Clinic, Pimple Saudagar (nearby)'],
      lifestyle: ['Balewadi High Street', 'Balewadi Sports Complex', 'Baner-Pashan Link Road restaurants & cafes'],
    },
  },
  'wakad': {
    name: 'Wakad',
    faqs: [
      { q: 'Where is Wakad located and what are its key advantages?', a: 'Wakad is a prominent suburb in Pune, Maharashtra, close to the Mumbai-Pune Expressway. Its biggest advantage is proximity to the Hinjewadi IT Park (Rajiv Gandhi Infotech Park), making it a preferred residential choice for IT professionals, with good connectivity to Pimpri-Chinchwad as well.' },
      { q: 'How is the connectivity and public transport in Wakad?', a: 'Wakad has strong public transport via the Wakad and Hinjewadi bus stands, and connectivity is set to improve further with the under-construction Metro line extending towards Hinjewadi. The Mumbai-Pune Expressway and Aundh-Ravet Road provide smooth travel to the rest of Pune.' },
      { q: 'What kind of lifestyle does Wakad offer residents?', a: 'Wakad offers a self-sufficient, modern lifestyle with shopping malls, multiplexes and restaurants alongside established educational institutions and healthcare facilities, making it popular with both young professionals and families.' },
      { q: 'Are there prominent developers active in Wakad?', a: 'Wakad has attracted several established developers building apartments and mixed-use projects, reflecting continued builder confidence in the micro-market’s long-term demand.' },
    ],
    landmarks: {
      education: ['A.P.J. College of Science and Commerce', 'IBMR College', 'Indira College of Commerce & Science'],
      business:  ['Hinjewadi IT Park (Rajiv Gandhi Infotech Park)', 'EON West Tech Park'],
      hospital:  ['Lifepoint Multispeciality Hospital', 'Aditya Birla Memorial Hospital (nearby)'],
      transit:   ['Wakad Bus Stand', 'Hinjewadi Bus Stand', 'Bhujbal Chowk (upcoming Metro corridor)'],
      lifestyle: ['Xion Mall, Hinjewadi', 'Pimpri-Chinchwad Municipal Corporation Garden'],
    },
  },
  'mahalunge': {
    name: 'Mahalunge',
    faqs: [
      { q: 'Where is Mahalunge and how does it relate to Baner?', a: 'Mahalunge is an emerging locality adjoining Baner in west Pune, often marketed as the next growth corridor as Baner itself matures and land availability there tightens.' },
      { q: 'Why are developers launching projects in Mahalunge?', a: 'Mahalunge offers relatively larger parcels of land close to the established Baner-Balewadi belt and within reach of Hinjewadi Phase 3, letting developers offer larger-format homes at comparatively accessible pricing versus core Baner.' },
      { q: 'What is the connectivity like in Mahalunge?', a: 'Mahalunge benefits from its proximity to the Baner-Pashan Link Road and the Mumbai-Pune Expressway, with onward access to Hinjewadi’s IT parks.' },
    ],
    landmarks: {
      education: ['Schools and colleges of the Baner-Balewadi belt (short drive)'],
      business:  ['Hinjewadi Phase 3 IT Park', 'Baner-Pashan IT corridor'],
      hospital:  ['Sahyadri Super Speciality Hospital, Baner (nearby)'],
      lifestyle: ['Balewadi High Street (short drive)'],
    },
  },
  'pimpri-chinchwad': {
    name: 'Pimpri-Chinchwad',
    faqs: [
      { q: 'What kind of area is Pimpri-Chinchwad?', a: 'Pimpri-Chinchwad is one of Pune’s established twin-city industrial and residential belts, governed by its own municipal corporation (PCMC), with a long-standing manufacturing and automotive industry base alongside growing residential demand.' },
      { q: 'How is Pimpri-Chinchwad connected to the rest of Pune?', a: 'The area is served by the Pune Metro’s PCMC-Swargate corridor and sits along the Mumbai-Pune Expressway and Old Mumbai-Pune Highway, giving direct access to Wakad, Hinjewadi and central Pune.' },
      { q: 'Is Pimpri-Chinchwad a good option for value-conscious buyers?', a: 'Pimpri-Chinchwad is generally viewed as a comparatively more accessible entry point than the core western IT corridor, while still offering established civic infrastructure through the PCMC.' },
    ],
    landmarks: {
      education: ['Established PCMC-area schools and colleges'],
      business:  ['Pimpri-Chinchwad industrial belt', 'PCMC commercial zones'],
      transit:   ['Pune Metro (PCMC-Swargate corridor)', 'Mumbai-Pune Expressway access'],
      lifestyle: ['PCMC civic gardens and sports facilities'],
    },
  },
  'ravet-gahunje': {
    name: 'Ravet-Gahunje',
    faqs: [
      { q: 'Where is Ravet-Gahunje located?', a: 'Ravet and Gahunje sit along the Old Mumbai-Pune Highway on the northern edge of Pimpri-Chinchwad, within reach of Wakad and Hinjewadi.' },
      { q: 'What is Gahunje known for?', a: 'Gahunje is home to the Maharashtra Cricket Association Stadium, and the broader Ravet-Gahunje belt has seen growing residential development along the highway corridor.' },
      { q: 'How connected is this area to the IT corridor?', a: 'The Ravet flyover and Old Mumbai-Pune Highway connect the area to Wakad and onward to Hinjewadi’s IT parks, making it a relevant option for buyers priced out of the core corridor.' },
    ],
    landmarks: {
      business:  ['Hinjewadi IT Park (via Wakad)'],
      transit:   ['Ravet flyover', 'Old Mumbai-Pune Highway'],
      lifestyle: ['Maharashtra Cricket Association Stadium, Gahunje'],
    },
  },
  'sinhagad-road': {
    name: 'Sinhagad Road',
    faqs: [
      { q: 'Where is Sinhagad Road located?', a: 'Sinhagad Road is an established residential corridor in south Pune, leading towards the historic Sinhagad Fort, and is popular with buyers who work in south and central Pune rather than the western IT belt.' },
      { q: 'What makes Sinhagad Road attractive to homebuyers?', a: 'The area offers a more settled, established residential character with reasonable pricing relative to the western corridor, along with proximity to south Pune’s commercial and educational institutions.' },
    ],
    landmarks: {
      lifestyle: ['Sinhagad Fort (weekend recreation)'],
    },
  },
  'hadapsar': {
    name: 'Hadapsar',
    faqs: [
      { q: 'Why is Hadapsar an important location in Pune?', a: 'Hadapsar in east Pune is a major established IT and business hub, anchored by Magarpatta City and the EON IT Park, hosting several large domestic and multinational offices.' },
      { q: 'What social infrastructure does Hadapsar offer?', a: 'Hadapsar has well-developed social infrastructure including malls such as Seasons Mall and Phoenix Marketcity nearby, along with established schools and hospitals.' },
      { q: 'How connected is Hadapsar to the rest of Pune?', a: 'Hadapsar lies along the Solapur Highway and is comparatively closer to Pune Railway Station than the western suburbs, with good road connectivity to central Pune and the airport.' },
    ],
    landmarks: {
      business:  ['Magarpatta City', 'EON IT Park'],
      lifestyle: ['Seasons Mall', 'Phoenix Marketcity (nearby)'],
      transit:   ['Solapur Highway', 'Pune Railway Station (comparatively closer)'],
    },
  },
  'karjat': {
    name: 'Karjat',
    faqs: [
      { q: 'Where is Karjat and why do buyers consider it?', a: 'Karjat is a scenic town on the Mumbai-Pune corridor at the base of the Sahyadri hills, popular for weekend homes, farmhouse plots and second-home investments thanks to its greenery and proximity to both Mumbai and Pune.' },
      { q: 'Is Karjat suitable as an investment for a second home?', a: 'Karjat’s appeal for plotted developments comes from its natural surroundings and weekend-getaway demand from both Mumbai and Pune, distinct from the end-user apartment demand seen in the city’s IT corridors.' },
      { q: 'How is Karjat connected to Mumbai and Pune?', a: 'Karjat sits along the Mumbai-Pune rail line and old highway, making it accessible as a weekend destination from both cities.' },
    ],
    landmarks: {
      lifestyle: ['Sahyadri hill surroundings', 'Popular weekend-getaway destination'],
      transit:   ['Mumbai-Pune rail corridor', 'Old Mumbai-Pune Highway'],
    },
  },
  'khopoli': {
    name: 'Khopoli',
    faqs: [
      { q: 'Where is Khopoli located?', a: 'Khopoli is a town at the base of the Western Ghats along the old Mumbai-Pune highway, and serves as a gateway towards hill stations such as Matheran and Lonavala.' },
      { q: 'Why do buyers look at plots or villas in Khopoli?', a: 'Khopoli attracts buyers seeking weekend homes and villa plots for its natural surroundings and relative affordability compared to core Pune and Mumbai, alongside some established industrial activity in the belt.' },
      { q: 'How is Khopoli connected to Mumbai and Pune?', a: 'Khopoli lies on the Mumbai-Pune expressway/NH48 corridor and the Mumbai-Pune rail line, giving reasonable access to both cities.' },
    ],
    landmarks: {
      lifestyle: ['Gateway to Matheran and Lonavala', 'Western Ghats surroundings'],
      transit:   ['Mumbai-Pune Expressway (NH48)', 'Mumbai-Pune rail corridor'],
    },
  },
};

module.exports = { MICRO_MARKETS, getMicroMarket, LOCALITY_CONTENT };

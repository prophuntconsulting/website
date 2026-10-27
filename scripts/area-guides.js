/**
 * Long-form copy for the area, category and landmark pages, kept apart from
 * locality-content.js (which holds the short FAQ + landmark data used on
 * project pages). Every page type gets its own angle so the pages do not
 * repeat each other:
 *   AREA_GUIDES      /location/<area>          the area itself
 *   TYPE_GUIDES      /apartments-in-<area> ... buying that property type there
 *   LANDMARK_GUIDES  /flats-near-<landmark>    living near one employer/station
 *   INDEX_GUIDES     /location, /developer, /projects/plots, /projects/villas
 *
 * Paragraph strings may use [text](/url) links and **bold**; everything else
 * is escaped. Only documented facts: see the sources noted next to each block.
 */

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inline = s => esc(s)
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => `<a href="${u}"${/^https?:/.test(u) ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`);

// sections: [{ h: 'Heading', p: ['para', ...], list: ['item', ...] }]
function renderGuide(title, sections, label = 'Area guide') {
  if (!sections || !sections.length) return '';
  return `
<section class="section area-guide-section">
  <div class="container">
    <div class="area-guide">
      <span class="section-label"><i class="fas fa-book-open"></i> ${esc(label)}</span>
      <h2 class="section-title">${esc(title)}</h2>
      ${sections.map(s => `
      <h3>${esc(s.h)}</h3>
      ${(s.p || []).map(p => `<p>${inline(p)}</p>`).join('\n      ')}
      ${s.list ? `<ul>${s.list.map(li => `<li>${inline(li)}</li>`).join('')}</ul>` : ''}`).join('\n')}
    </div>
  </div>
</section>`;
}

// Area facts checked 27 Oct 2026. Prices: Knight Frank India H1 2026 (p.91).
// Civic/water/flood: Punekar News, Pune Pulse, Free Press Journal, PMRDA, MoEF.
const KF = '[Knight Frank India’s H1 2026 report](https://content.knightfrank.com/research/3116/documents/en/india-real-estate-office-and-residential-market-h1-2026-12927.pdf)';
const AREA_GUIDES = {
  'baner': {
    sections: [
      { h: 'Why Baner is one of Pune’s most sought-after addresses', p: [
        'Baner, in West Pune, sits between Aundh and Pashan on one side and Balewadi and the Mumbai–Pune Expressway on the other, with the green Baner hills along its southern edge. It falls under the Pune Municipal Corporation and has grown from a quiet suburb into a premium residential and office district, close to the Hinjewadi IT parks but with its own restaurants, shops and schools.',
        'Much of the newest supply is in premium 3, 4 and 5 BHK towers, especially along [Pan Card Club Road](/blog/pan-card-club-road-baner) at the foot of the hills, while older parts of Baner and Balewadi offer more 2 and 3 BHK homes.',
      ] },
      { h: 'Prices', p: [
        `${KF} recorded Baner at about ₹16,418 to ₹16,987 per sq ft, up 4% over 12 months, against about ₹17,734 to ₹18,274 in neighbouring Aundh and ₹12,115 to ₹12,588 in Wakad. Prices vary widely by road, tower and view, so compare projects on the full cost sheet, not the rate per sq ft.`,
      ] },
      { h: 'Connectivity', p: [
        'Baner Road and the Baner–Pashan link road connect the area to Aundh, the university and central Pune, and the Expressway is close by for Mumbai and Hinjewadi. Pune Metro Line 3, from Hinjewadi to Shivajinagar, has stations at Balewadi Phata, Baner Gaon and Baner, but these are among the six stations due to open after the first section on the Hinjewadi side. Our [Metro Line 3 guide](/blog/pune-metro-line-3-property) explains what it means for property.',
      ] },
      { h: 'Who Baner suits', list: [
        'Professionals working in Baner, Balewadi, Aundh or Hinjewadi who want an established neighbourhood with good restaurants, shops and schools.',
        'Families upgrading to a larger home with a premium address.',
        'Buyers comparing it with nearby areas: see our [Baner vs Wakad vs Hinjewadi vs Tathawade guide](/blog/baner-vs-wakad-vs-hinjewadi-vs-tathawade-where-to-buy-in-2026).',
      ] },
      { h: 'What to check', list: [
        '**Water.** Parts of Baner and Balewadi rely on tankers, tanker rates rose in 2026, and some areas moved to alternate-day supply. Ask each project how it gets its water.',
        '**Flooding.** Low-lying parts of Baner and Balewadi near the river flooded in July 2026. Check the site against the river’s flood lines.',
        '**Traffic.** Baner Road is busy at peak hours; drive your commute before you decide.',
      ] },
    ],
    faqs: [
      { q: 'What are property prices in Baner in 2026?', a: 'Knight Frank India recorded Baner at about ₹16,418 to ₹16,987 per sq ft in H1 2026, up 4% over 12 months. New launches on Pan Card Club Road and other premium projects are often priced above that range.' },
      { q: 'When will the Baner metro stations open?', a: 'Baner’s stations on Metro Line 3, at Balewadi Phata, Baner Gaon and Baner, are among the six stations due to open after the first section, which runs from Maan in Hinjewadi to Balewadi. Check the latest status before relying on them.' },
    ],
  },
  'wakad': {
    sections: [
      { h: 'Wakad at a glance', p: [
        'Wakad lies in West Pune, between the Hinjewadi IT parks and the Mumbai–Bengaluru highway, and falls under the Pimpri-Chinchwad Municipal Corporation (PCMC). Its location, a short drive from Hinjewadi with quick highway access, made it one of the city’s fastest-growing residential areas, with large gated projects, the Phoenix Mall of the Millennium and a wide choice of schools and hospitals.',
      ] },
      { h: 'Prices: a pause after a strong run', p: [
        `${KF} recorded Wakad at about ₹12,115 to ₹12,588 per sq ft, unchanged over 12 months, after a strong 2025. Heavy new supply in and around Wakad is being absorbed, which gives buyers more choice and more room to negotiate than a year ago. It remains well below Baner, at about ₹16,418 to ₹16,987.`,
      ] },
      { h: 'Connectivity', p: [
        'Wakad’s draw is its position: the Hinjewadi IT parks on one side, the highway towards Mumbai, Bengaluru and the rest of Pune on the other. Pune Metro Line 3 has a Wakad Chowk station in its first section, from Maan to Balewadi. The flip side is traffic: Bhumkar Chowk and the Wakad flyover are among Hinjewadi’s best-known choke points at peak hours.',
      ] },
      { h: 'Who Wakad suits', list: [
        'IT professionals working in Hinjewadi who want an established neighbourhood rather than a newer one further out.',
        'Families who want malls, schools and hospitals close by at a lower price than Baner.',
        'Buyers weighing it against its neighbour: see our [Tathawade vs Wakad comparison](/blog/tathawade-vs-wakad).',
      ] },
      { h: 'What to check', list: [
        '**Water.** PCMC cut supply in 2026 when the Pavana dam ran low, and many Wakad societies rely partly on tankers. Ask any project how it is supplied and what the society spends on tankers.',
        '**Monsoon flooding.** Heavy rain in 2026 waterlogged roads in Wakad and closed underpasses towards Tathawade and Punawale. Check the approach roads.',
        '**Traffic.** Drive the route to work at peak hours, especially through Bhumkar Chowk.',
      ] },
    ],
    faqs: [
      { q: 'Did Wakad property prices rise in 2026?', a: 'No. Knight Frank India recorded Wakad at about ₹12,115 to ₹12,588 per sq ft in H1 2026, unchanged over 12 months after a strong 2025, as heavy new supply was absorbed.' },
      { q: 'Is Wakad under PMC or PCMC?', a: 'Wakad falls under the Pimpri-Chinchwad Municipal Corporation (PCMC), which handles its water supply, roads and property tax.' },
    ],
  },
  'mahalunge': {
    sections: [
      { h: 'Where Mahalunge is', p: [
        'Mahalunge sits right next to Baner, across the Mumbai–Pune Expressway, between Baner–Balewadi and the Hinjewadi IT parks. Developers often market it as "Baner Annex". It is one of the 23 villages merged into the Pune Municipal Corporation (PMC) in 2021, and in 2026 planning powers moved from PMRDA to PMC.',
        'Much of the newer development here follows the PMRDA’s Mahalunge–Maan "Hi-Tech City" town planning scheme, about 250 hectares of planned roads and plots. That planned layout is the main reason large developers have launched here.',
      ] },
      { h: 'Connectivity and jobs', p: [
        'The Hinjewadi IT parks are the main employer, with the offices of Baner and Balewadi just across the Expressway. Pune Metro Line 3 runs from Hinjewadi through Wakad and Balewadi towards Shivajinagar; its first stations, from Maan to Balewadi, received safety clearance in 2026. Day to day, the Hinjewadi junctions are the bottleneck to plan around.',
      ] },
      { h: 'What it costs and who it suits', p: [
        `Knight Frank names Mahalunge among West Pune’s leading residential micro-markets in ${KF}. It suits buyers who work in Hinjewadi or Baner, want a newer planned neighbourhood and are prepared to wait for its roads and services to mature. Buyers who want an established neighbourhood today will find more of that in [Baner](/location/baner).`,
      ] },
      { h: 'What to check', list: [
        '**Water.** In merged villages, developers must arrange water at their own cost until PMC can supply it. Ask exactly how the project will be supplied.',
        '**Flood line.** Parts of the town planning scheme were revised for the Mula river’s blue flood line. Check the plot’s position on the planning map.',
        '**Property tax.** Residents of merged villages have complained about PMC tax rates, so ask for an estimate before you buy.',
      ] },
    ],
    faqs: [
      { q: 'Is Mahalunge under PMC or PMRDA?', a: 'Mahalunge was merged into the Pune Municipal Corporation in 2021, and in 2026 planning powers were moved from PMRDA to PMC. Some older approvals and the Hi-Tech City town planning scheme were originally PMRDA’s.' },
    ],
  },
  'pimpri-chinchwad': {
    sections: [
      { h: 'Pimpri-Chinchwad at a glance', p: [
        'Pimpri-Chinchwad is Pune’s twin city to the north-west, governed by its own municipal corporation (PCMC). It grew around industry, from the Pimpri and Bhosari MIDC areas to automotive suppliers, and today includes established neighbourhoods such as Pimpri, Chinchwad and Nigdi as well as fast-growing ones like Moshi, Tathawade and Punawale.',
      ] },
      { h: 'Connectivity', p: [
        'The Pune Metro Purple Line runs from PCMC Bhavan to Swargate, fully open since September 2024, and an extension north to Nigdi is under construction. The Mumbai–Pune highway and suburban railway stations at Pimpri, Chinchwad and Akurdi connect the city to Pune and Lonavala, and the Mumbai–Pune Expressway is close to the western neighbourhoods.',
      ] },
      { h: 'Prices', p: [
        `Pimpri-Chinchwad is generally more affordable than West Pune. In ${KF}, Moshi was recorded at about ₹7,128 to ₹7,247 per sq ft, up 8% over the year, against about ₹12,115 to ₹12,588 in neighbouring Wakad. Knight Frank also found North Pune, which includes Pimpri, Chinchwad and Moshi, to be the tightest market in the city, with unsold stock that would sell in under two quarters.`,
      ] },
      { h: 'What to check', list: [
        '**Water supply.** PCMC cut supply by 15% in June 2026 when the Pavana dam ran low, and in September 2026 dozens of societies in Tathawade, Punawale and Pimple Saudagar relied on tankers.',
        '**Flooding.** In July 2026 high water in the Pavana, Mula and Indrayani rivers closed underpasses at Ravet, Punawale and Tathawade. Check whether the project is near a river or a low-lying road.',
        '**Metro access.** Use today’s Purple Line stations, not future lines, when comparing commutes.',
      ] },
    ],
    faqs: [
      { q: 'Is Pimpri-Chinchwad cheaper than Wakad or Baner?', a: 'Generally, yes. Knight Frank India recorded Moshi at about ₹7,128 to ₹7,247 per sq ft in H1 2026, against about ₹12,115 to ₹12,588 in Wakad and over ₹16,000 in Baner.' },
    ],
  },
  'ravet-gahunje': {
    sections: [
      { h: 'Where Ravet and Gahunje are', p: [
        'Ravet is a fast-growing PCMC neighbourhood where the Mumbai–Pune Expressway meets the Katraj–Dehu Road bypass, with the Pavana river on its southern edge and Punawale, Kiwale and Nigdi Pradhikaran around it. Gahunje, just beyond, is a village in Maval taluka best known for the Maharashtra Cricket Association stadium.',
        'Planning in Gahunje falls under PMRDA rather than PCMC, which affects approvals and services, so check which authority approved any project you look at.',
      ] },
      { h: 'Connectivity', p: [
        'The area’s draw is road access: the Expressway towards Mumbai, the bypass towards Hinjewadi and south Pune, and the Aundh–Ravet BRTS corridor. Akurdi is the nearest suburban railway station. The Missing Link on the Expressway, opened in May 2026, has shortened the drive towards Mumbai.',
      ] },
      { h: 'What to check', list: [
        '**The defence "red zone".** Parts of Ravet, Kiwale, Nigdi and nearby areas fall inside the restricted zone around the Dehu Road ammunition depot, where construction is prohibited and owners report trouble getting repairs approved and home loans sanctioned. A revised boundary was still awaiting approval in 2026. Confirm in writing that the project is outside it.',
        '**Flood line.** The Pavana river and the Ravet barrage overflowed in July 2026. Check the site’s position against the blue flood line.',
        '**Water.** Many societies in this belt rely on tanker water in the dry months.',
        '**Highway noise.** Homes facing the Expressway or bypass can be noisy; visit at night as well as by day.',
      ] },
    ],
    faqs: [
      { q: 'What is the red zone in Ravet?', a: 'It is a restricted area around the Dehu Road ammunition depot, notified under the Works of Defence Act, covering parts of Ravet, Kiwale, Nigdi, Chikhali and Mamurdi. Construction is prohibited inside it. Always confirm in writing that a project is outside the zone before you pay.' },
    ],
  },
  'sinhagad-road': {
    sections: [
      { h: 'Where Sinhagad Road is', p: [
        'Sinhagad Road runs south-west from central Pune along the Mutha river towards Khadakwasla, through neighbourhoods such as Vadgaon Budruk, Anand Nagar, Hingne and Dhayari. It falls under the Pune Municipal Corporation and is one of the city’s longest-established residential belts, popular with families who want to stay within reach of the old city.',
      ] },
      { h: 'Connectivity: better roads, a metro on the way', p: [
        'The Rajaram Bridge–Fun Time flyover, about 2.1 km, opened in 2025 and cut that stretch from around half an hour at peak times to a few minutes. A Khadakwasla–Swargate–Hadapsar–Kharadi metro line was approved by the Union Cabinet in November 2025 and was still being surveyed in 2026, so treat it as a long-term benefit. The western section of the Pune Ring Road, which crosses near Khadakwasla, was about 30% built by September 2026.',
      ] },
      { h: 'Who it suits', p: [
        'Families who want an established neighbourhood with schools, shops and quick access to central Pune, and buyers who want more space for their budget than in Kothrud or the west. Knight Frank counts Sinhgad Road as part of South Pune, whose share of the city’s home sales grew in 2026.',
      ] },
      { h: 'What to check', list: [
        '**Flood lines.** Low-lying pockets such as Ekta Nagar flood when Khadakwasla dam releases water, as happened again in July 2026. Check the building’s position against the river’s blue and red flood lines.',
        '**Construction traffic.** Expect disruption while the flyover and metro works continue.',
      ] },
    ],
    faqs: [
      { q: 'Does Sinhagad Road flood?', a: 'Some low-lying areas next to the river, such as Ekta Nagar, flood when Khadakwasla dam releases large volumes of water, as happened in July 2025 and July 2026. Most of the road is unaffected, but check any project against the river’s blue and red flood lines.' },
      { q: 'Is there a metro planned for Sinhagad Road?', a: 'Yes. A Khadakwasla–Swargate–Hadapsar–Kharadi line was approved by the Union Cabinet in November 2025 with a five-year target. It was still at the survey stage in 2026.' },
    ],
  },
  'hadapsar': {
    sections: [
      { h: 'Hadapsar at a glance', p: [
        'Hadapsar is East Pune’s largest residential hub, on the Pune–Solapur highway, and includes Magarpatta City, Amanora and the Saswad Road belt towards Jadhavwadi. It grew with the IT offices of Magarpatta and nearby Kharadi and now has its own malls, schools and hospitals.',
      ] },
      { h: 'Prices', p: [
        `${KF} recorded Hadapsar at about ₹11,510 to ₹11,822 per sq ft, up 8% over 12 months, one of the stronger gains in the city. Unsold stock in East Pune rose 34% over the year, the fastest of any zone, so buyers here have choice and room to negotiate.`,
      ] },
      { h: 'Connectivity and what is coming', list: [
        '**Rail:** Hadapsar is being developed as a satellite railway terminal, with long-distance trains starting from it in 2026.',
        '**Metro:** a Khadakwasla–Swargate–Hadapsar–Kharadi line was approved in November 2025, and extensions towards Loni Kalbhor and Saswad have state approval.',
        '**Roads:** a 36.5 km elevated corridor along the Solapur highway has been proposed, but construction had not started in 2026.',
      ] },
      { h: 'What to check', list: [
        '**The Uruli Devachi–Fursungi garbage depot.** Disputes over the depot continued in 2026, with protests halting waste transport in August. If you are looking towards Fursungi or Saswad Road, ask how close the site is.',
        '**Traffic on the Solapur highway** at peak hours, especially around Magarpatta.',
      ] },
    ],
    faqs: [
      { q: 'What are property prices in Hadapsar in 2026?', a: 'Knight Frank India recorded Hadapsar at about ₹11,510 to ₹11,822 per sq ft in H1 2026, up 8% over 12 months. Individual projects vary, so ask for a current cost sheet.' },
    ],
  },
  'karjat': {
    sections: [
      { h: 'Why buyers look at Karjat', p: [
        'Karjat, in Raigad district between Mumbai and Pune, is known for its hills, rivers and weekend homes. Buyers here are usually looking for a second home, a plot to build on later or a quieter place to live with a long-distance commute.',
      ] },
      { h: 'Connectivity', p: [
        'Karjat is the end of the Central Railway suburban line, with fast locals taking a little over two hours to CSMT. A new Panvel–Karjat rail corridor, close to completion in late 2026, will shorten the trip towards Panvel and the new Navi Mumbai airport, which opened in December 2025. Check whether it has opened before relying on it.',
      ] },
      { h: 'What to check', list: [
        '**The Matheran eco-sensitive zone.** Around 70 villages of Karjat taluka fall inside it, where mining and polluting activities are banned and building is restricted. Check whether the project’s village is on the list.',
        '**Civic body.** Many projects lie outside the Karjat Municipal Council, under gram panchayats, so water, roads and approvals differ. Ask who supplies water and who maintains the roads.',
        '**Monsoon access.** Visit in the rains to see the approach road and drainage.',
      ] },
    ],
    faqs: [
      { q: 'Is Karjat in an eco-sensitive zone?', a: 'Parts of it are. The Matheran eco-sensitive zone, notified in 2003, includes around 70 villages of Karjat taluka, where mining and polluting activities are banned and development is restricted. Check whether a project’s village is listed before you buy.' },
    ],
  },
  'khopoli': {
    sections: [
      { h: 'Khopoli at a glance', p: [
        'Khopoli, in Khalapur taluka of Raigad, sits at the foot of the ghats where the Mumbai–Pune Expressway climbs towards Lonavala. It is an established industrial town, home to steel and engineering plants, and its surroundings have become a market for plotted developments and second homes.',
      ] },
      { h: 'Connectivity', p: [
        'The **Missing Link** on the Expressway, opened on 1 May 2026, runs from Khopoli to Kusgaon near Lonavala and bypasses the ghat section, saving around 20 to 30 minutes on the Mumbai–Pune drive. Khopoli is also the end of a Central Railway suburban line, and the new Navi Mumbai airport is about 50 km away by road.',
      ] },
      { h: 'Who it suits', p: [
        'Buyers who want land or a weekend home within reach of both Mumbai and Pune, and those buying for the long term on the strength of the new road links. It suits people who need to commute daily into either city less well.',
      ] },
    ],
  },
};

const TYPE_GUIDES = {
  'mahalunge:apartment': {
    sections: [
      { h: 'What the apartments here are like', p: [
        'Most apartments in Mahalunge are in large new projects from national developers, typically 2, 3 and 4 BHK homes in high-rise towers with big clubhouses. Because the area is still being built out, many are under construction, so compare possession dates as carefully as prices. Our guide to [ready-to-move vs under-construction flats](/blog/ready-to-move-vs-under-construction-flats-pune) explains the trade-offs.',
      ] },
      { h: 'Questions to ask the developer', list: [
        'How will the project get water until PMC supplies the area, and who pays for it?',
        'Which access roads in the town planning scheme are already built, and which are still on paper?',
        'What is the MahaRERA completion date, and has it been extended before?',
      ] },
      {"h":"Who these apartments suit","p":["People who work in the Hinjewadi IT parks or in Baner and Balewadi, and want a newer home in a planned layout rather than an older building closer to the city. Buyers who can wait two or three years for possession, and for the area’s roads, shops and services to fill in, get the most from Mahalunge."]},
    ],
    faqs: [{"q":"Are Mahalunge apartments ready to move in?","a":"Most apartment projects in Mahalunge are under construction, because the area is being built out under a planned town planning scheme. Check each project’s MahaRERA completion date before you book."},{"q":"Is Mahalunge close to Hinjewadi?","a":"Yes. Mahalunge lies between Baner–Balewadi and the Hinjewadi IT parks, across the Mumbai–Pune Expressway from Baner. Peak-hour traffic at the Hinjewadi junctions is the main thing to plan around."}],
  },
  'pimpri-chinchwad:apartment': {
    sections: [
      { h: 'Apartments in Pimpri-Chinchwad: value and space', p: [
        'Apartments in Pimpri-Chinchwad usually give more carpet area for the money than West Pune, which makes the city popular with families upgrading from a 2 BHK to a 3 BHK. Projects range from mid-market towers near the old industrial areas to larger townships towards Moshi and Tathawade.',
      ] },
      { h: 'How to compare two projects', list: [
        'Compare the price per sq ft of **carpet area**, not the "super built-up" figure. See our [carpet area guide](/blog/carpet-area-vs-built-up-vs-super-built-up).',
        'Check the walk to the nearest Purple Line station if you will commute by metro.',
        'Ask the society or developer what they spend on water tankers in summer.',
      ] },
      {"h":"Who these apartments suit","p":["Families who want more space for their budget, people working in the Pimpri, Chinchwad, Bhosari or Chakan industrial belts, and commuters who can use the Purple Line metro into central Pune. Buyers who need to reach Hinjewadi every day should compare the drive with nearer areas such as Wakad and Tathawade."]},
    ],
    faqs: [{"q":"Is there a metro in Pimpri-Chinchwad?","a":"Yes. The Pune Metro Purple Line runs from PCMC Bhavan to Swargate and has been fully open since September 2024, with an extension to Nigdi under construction."},{"q":"Do Pimpri-Chinchwad societies face water shortages?","a":"Some do in the dry months. PCMC cut supply by 15% in June 2026 when the Pavana dam ran low, and several societies in Tathawade, Punawale and Pimple Saudagar relied on tankers. Ask any project how it is supplied."}],
  },
  'sinhagad-road:apartment': {
    sections: [
      { h: 'Apartments on Sinhagad Road', p: [
        'Sinhagad Road has a mix of older buildings and newer gated projects, including larger developments from established Pune developers. It is a good fit for families who want to stay close to schools and the old city while getting a more modern home.',
      ] },
      { h: 'Before you book', list: [
        'Check the building’s position against the river’s flood lines, especially near Ekta Nagar and Vadgaon.',
        'For resale flats, check the society’s records and occupancy certificate.',
        'Use our [stamp duty calculator](/stamp-duty-calculator-pune) to work out the full cost.',
      ] },
      {"h":"Who these apartments suit","p":["Families who want to stay close to central Pune, established schools and markets, and buyers moving up from an older flat in the same part of the city. Commuters to Hinjewadi or Kharadi face long drives, so this belt suits people who work in central or south Pune best."]},
    ],
    faqs: [{"q":"Is Sinhagad Road good for families?","a":"It is one of Pune’s longest-established residential belts, with schools, hospitals and markets close by and quick access to the old city. Check the flood line for buildings close to the river."},{"q":"Has traffic on Sinhagad Road improved?","a":"Yes, in part. The Rajaram Bridge–Fun Time flyover opened in 2025 and cut that stretch from around half an hour at peak times to a few minutes, though more flyover and metro works are planned."}],
  },
  'karjat:apartment': {
    sections: [
      { h: 'Apartments in Karjat', p: [
        'Apartment projects in Karjat are mostly aimed at second-home buyers and those looking for a quieter base within reach of Mumbai. Many are part of larger townships that also offer plots or townhouses, with clubhouse and leisure facilities taking centre stage.',
      ] },
      { h: 'Before you book', list: [
        'If you will not live there full time, ask about rental management and the maintenance charges you will pay while it is empty.',
        'Check whether the township is inside the Matheran eco-sensitive zone and what that means for future phases.',
        'Visit during the monsoon to see access roads and drainage.',
      ] },
      {"h":"Who these apartments suit","p":["Buyers who want a weekend home within reach of Mumbai and Pune, retirees looking for a quieter town, and people who can work remotely most of the week. Daily commuters to Mumbai should weigh the two-hour train journey carefully."]},
    ],
    faqs: [{"q":"How long does it take to reach Mumbai from Karjat?","a":"Fast suburban trains take a little over two hours to CSMT. A new Panvel–Karjat rail line, close to completion in late 2026, will shorten trips towards Panvel and Navi Mumbai once it opens."},{"q":"Is Karjat good for a second home?","a":"Many buyers choose it for weekend homes because of its hills, rivers and rail link to Mumbai. Check maintenance charges and rental management if the home will be empty for long periods."}],
  },
  'khopoli:plot': {
    sections: [
      { h: 'Buying a plot near Khopoli', p: [
        'Plotted projects around Khopoli let you buy land in a gated layout with roads, water lines and common amenities, and build later. They are popular with buyers who want a weekend home or a long-term holding between Mumbai and Pune, especially since the Missing Link opened in 2026.',
      ] },
      { h: 'The checks that matter for land', list: [
        'The **NA (non-agricultural) order** for the layout, the 7/12 extract and the mutation entries.',
        'The project’s **MahaRERA registration**: plotted layouts above the threshold must be registered. [Check it yourself](/blog/how-to-check-maharera-registration-pune).',
        'Whether any part of the land is classified as forest or hill slope.',
        'The source of water and electricity, and who maintains them after handover.',
      ] },
      { h: 'Read more', p: [
        'Our [checklist for NA plots near Pune](/blog/na-plots-near-pune-checklist) walks through each document in detail.',
      ] },
      {"h":"Who these plots suit","p":["Buyers who want to build a weekend home or a retirement home in a few years, and long-term buyers betting on the Missing Link and the new Navi Mumbai airport bringing more people to the area. Because land earns no rent until you build, it suits buyers who do not need an income from the property soon."]},
    ],
    faqs: [{"q":"Is the Missing Link open near Khopoli?","a":"Yes. The Mumbai–Pune Expressway Missing Link, from Khopoli to Kusgaon near Lonavala, opened on 1 May 2026 and saves around 20 to 30 minutes by bypassing the ghat section."},{"q":"What should I check before buying a plot in Khopoli?","a":"The NA order, 7/12 extract and mutation entries, a 30-year title search, the project’s MahaRERA registration, and whether any part of the land is forest or hill-slope land."}],
  },
  'hadapsar:plot': {
    sections: [
      { h: 'Plots in the Hadapsar belt', p: [
        'Plotted projects in the Hadapsar area are mostly on the edges, along Saswad Road towards Jadhavwadi, where large gated villa-plot layouts offer land within driving distance of Magarpatta and Kharadi. They suit buyers who want to build their own home rather than buy an apartment.',
      ] },
      { h: 'Before you buy', list: [
        'Check the NA order, 7/12 extract and the layout approval, and confirm the MahaRERA registration.',
        'Ask how far the site is from the Uruli Devachi–Fursungi garbage depot.',
        'Check what is included: internal roads, water lines, power and boundary walls.',
        'Read our [NA plots checklist](/blog/na-plots-near-pune-checklist).',
      ] },
      {"h":"Who these plots suit","p":["Families who want to build their own home in East Pune while staying within reach of Magarpatta, Kharadi and the Solapur highway, and buyers who prefer land in a gated layout to a flat in a tower. Plan for the cost and time of construction on top of the plot price."]},
    ],
    faqs: [{"q":"Where are the plotted projects near Hadapsar?","a":"Mostly on the edges of the Hadapsar belt, along Saswad Road towards Jadhavwadi, where larger land parcels allow gated villa-plot layouts."},{"q":"Is the Uruli Devachi garbage depot a concern near Hadapsar?","a":"It can be for sites towards Fursungi and Uruli Devachi, where disputes over the depot continued in 2026. Ask how far any project is from it and visit the site yourself."}],
  },
  'ravet-gahunje:villa': {
    sections: [
      { h: 'Villas and row houses here', p: [
        'Ravet and Gahunje are among the few places within PCMC’s reach where row houses and villas are still being built, thanks to larger land parcels near the Expressway. They suit families who want their own entrance and terrace while staying close to Hinjewadi and the Mumbai road.',
      ] },
      { h: 'What to check for a villa', list: [
        '**The defence red zone** around Dehu Road: get written confirmation that the plot is outside it.',
        '**Maintenance:** in villa communities you share road, security and amenity costs with fewer owners, so ask for the expected monthly charge.',
        '**Carpet area and plot area:** a villa price covers both; get each in writing.',
      ] },
      {"h":"Who these villas suit","p":["Families who want the space of a row house or villa but need quick access to the Mumbai–Pune Expressway, Hinjewadi or Pimpri-Chinchwad. Buyers should be comfortable with a growing neighbourhood whose roads and services are still catching up."]},
    ],
    faqs: [{"q":"Are there villas for sale in Ravet?","a":"Yes. Ravet and Gahunje are among the few areas near Pimpri-Chinchwad where row houses and villas are still being built, because larger land parcels are available near the Expressway."},{"q":"How do I check if a Ravet property is in the red zone?","a":"Ask the developer for written confirmation and check the project’s approvals with the planning authority. The restricted zone around the Dehu Road ammunition depot covers parts of Ravet, Kiwale and Nigdi."}],
  },
};
// Sources: Embassy REIT / CRISIL / IIFL (Embassy TechZone), CapitaLand (BlueRidge 3),
// Wikipedia + Punekar News + Free Press Journal (Metro Line 3, Hinjewadi roads),
// Maha-Metro via The Metro Rail Guy (PCMC line). Checked 27 Oct 2026.
const HINJEWADI_COMMUTE = {
  h: 'Getting around: traffic and Metro Line 3',
  p: [
    'Hinjewadi traffic is the biggest day-to-day issue for anyone living or working here. The usual choke points are the Wakad flyover, Bhumkar Chowk and the Tathawade–Punawale underpass, and heavy rain in September 2026 waterlogged roads across the IT park, Wakad and Punawale. In September 2026 the Pune Collector picked six Hinjewadi roads for priority widening, but these were announcements, not finished work, so judge a commute by driving it at peak hours.',
    'Pune Metro Line 3, an elevated line from Maan through the Hinjewadi phases, Wakad Chowk and Balewadi to Shivajinagar, is the change to watch. The first 12 stations, Maan to Balewadi, received safety clearance in July 2026 and 17 of 23 by late September. See our [Metro Line 3 guide](/blog/pune-metro-line-3-property) for what it means for property, and check the current opening status before you rely on it for a commute.',
  ],
};
const LANDMARK_GUIDES = {
  'flats-near-embassy-tech-zone': {
    sections: [
      { h: 'What Embassy TechZone is', p: [
        'Embassy TechZone is an office campus of about 68 acres in Hinjewadi Phase 2, owned by Embassy Office Parks REIT. It had about 3 million sq ft of offices by the end of 2023, with more under development, and its occupiers include Infosys BPM, Volkswagen Group Technology Solutions and NICE Interactive. Several thousand people work on the campus, which is why flats within a short drive of it stay in demand from both owner-occupiers and tenants.',
      ] },
      HINJEWADI_COMMUTE,
      { h: 'Where to look for a home nearby', list: [
        '**Hinjewadi Phase 2 and Phase 3, Maan and Marunji:** the shortest commutes, with newer and often more affordable projects.',
        '**Mahalunge and Baner Annex:** larger planned developments a little further out. See [projects in Mahalunge](/location/mahalunge).',
        '**Wakad and Tathawade:** more established neighbourhoods with schools and shopping, but the drive in crosses the busiest junctions. Compare them in our [Tathawade vs Wakad guide](/blog/tathawade-vs-wakad).',
      ] },
      { h: 'Before you book', list: [
        'Drive or ride the route at 9 am and 6 pm, not on a Sunday.',
        'Ask how the society gets its water. Hinjewadi residents have protested over roads and water as recently as September 2026.',
        'Check the project’s [MahaRERA registration](/blog/how-to-check-maharera-registration-pune) and its committed completion date.',
      ] },
    ],
    faqs: [
      { q: 'Which companies are at Embassy TechZone in Hinjewadi?', a: 'Embassy TechZone, an Embassy Office Parks REIT campus in Hinjewadi Phase 2, has occupiers including Infosys BPM, Volkswagen Group Technology Solutions and NICE Interactive, among others.' },
      { q: 'Will Metro Line 3 help people who work at Embassy TechZone?', a: 'Yes. Line 3 has stations in Hinjewadi Phase 2, and the first 12 stations from Maan to Balewadi received safety clearance in July 2026. Check the current opening status, because the launch date has moved several times.' },
    ],
  },
  'office-space-near-blue-ridge-sez': {
    sections: [
      { h: 'Blue Ridge and the BlueRidge SEZ', p: [
        'Blue Ridge is Paranjape Schemes’ integrated township in Hinjewadi Phase 1, on the bank of the Mula river. Alongside its residential towers it includes an IT special economic zone. One part of it, BlueRidge 3 Phase 1, a 1.4 million sq ft SEZ, was bought by CapitaLand India Trust in March 2024, when it was about 60% leased to occupiers such as Panasonic Avionics, Aptiv, Forvia, Axtria, Cerence and Würth IT.',
        'That mix of global engineering and technology tenants is what drives demand for offices and shops around Hinjewadi Phase 1: suppliers, consultants and service businesses want to be near their clients.',
      ] },
      { h: 'What to check before buying or leasing an office here', list: [
        '**Who your visitors are.** If clients come by car, check parking and the access road at peak hours.',
        '**Carpet area versus chargeable area.** Commercial projects often quote larger chargeable areas; ask for the carpet area in writing. Our [carpet area guide](/blog/carpet-area-vs-built-up-vs-super-built-up) explains the difference.',
        '**Rental yield claims.** Ask for recent registered lease rents in the same building, not brochure figures.',
        '**Metro access.** Line 3 has a Hinjawadi Phase-I station; check the walking route from the building.',
      ] },
      HINJEWADI_COMMUTE,
    ],
    faqs: [
      { q: 'Who owns the BlueRidge SEZ in Hinjewadi?', a: 'Blue Ridge is a Paranjape Schemes township in Hinjewadi Phase 1. Its BlueRidge 3 Phase 1 SEZ, about 1.4 million sq ft, was acquired by CapitaLand India Trust in March 2024.' },
    ],
  },
  'flats-near-blue-ridge-sez': {
    sections: [
      { h: 'Living near Blue Ridge', p: [
        'Blue Ridge is a large township in Hinjewadi Phase 1, on the Mula river, with residential towers, offices and its own school, Blue Ridge Public School, inside the campus. The IT SEZ next to it, including BlueRidge 3, houses technology and engineering companies such as Panasonic Avionics and Aptiv, so homes nearby suit people who want to walk or take a short drive to work.',
        'Beyond the township, nearby options include projects along the Baner–Hinjewadi road, in Mahalunge and in Wakad. Compare them on travel time at peak hours, not on the map distance in this list.',
      ] },
      HINJEWADI_COMMUTE,
    ],
  },
  'flats-near-pcmc-metro-station': {
    sections: [
      { h: 'The PCMC metro station', p: [
        'PCMC Bhavan is the northern terminus of Pune Metro’s Purple Line, at Morwadi, opposite the Pimpri-Chinchwad Municipal Corporation headquarters. The full line from PCMC to Swargate opened in September 2024; Maha-Metro puts the journey at about 34 minutes for ₹30, and trains run from 6 am to 10 pm, every few minutes at peak times.',
        'An extension of about 4.5 km north to Nigdi, with stations at Chinchwad, Akurdi, Nigdi and Bhakti Shakti Chowk, is under construction. By August 2026 most of the viaduct was built and track-laying had begun, with completion expected in 2027.',
      ] },
      { h: 'Who a home near the station suits', list: [
        'People who work in central Pune, Shivajinagar or near the court and want to avoid driving down the old Mumbai–Pune highway.',
        'Families who want an established neighbourhood: the Pimpri-Chinchwad civic centre, markets and YCM Hospital, near Sant Tukaram Nagar station, are close by.',
        'Buyers looking at [Pimpri-Chinchwad projects](/location/pimpri-chinchwad) who want metro access today rather than a promised future line.',
      ] },
      { h: 'Before you book', list: [
        'Walk from the project gate to the station: the straight-line distances in this list are shorter than the real route.',
        'Check water supply: PCMC has rationed supply in parts of the city, and many societies buy tanker water.',
        'Compare the price with similar projects a little further from the line before paying a "metro premium".',
      ] },
    ],
    faqs: [
      { q: 'How long does the metro take from PCMC to Swargate?', a: 'About 34 minutes for the 16.6 km Purple Line journey, according to Maha-Metro, with a fare of about ₹30. Trains run from 6 am to 10 pm.' },
      { q: 'Is the PCMC metro being extended to Nigdi?', a: 'Yes. A roughly 4.5 km extension to Nigdi, with stations at Chinchwad, Akurdi, Nigdi and Bhakti Shakti Chowk, is under construction, with completion expected in 2027.' },
    ],
  },
};
const INDEX_GUIDES = {
  location: {
    sections: [
      { h: 'How Pune’s housing market divides up', p: [
        `${KF} splits Pune into five zones. **West Pune** (Baner, Aundh, Wakad, Hinjewadi) is the largest market and the most expensive outside the centre, driven by the Hinjewadi IT parks. **East Pune** (Kharadi, Hadapsar, Wagholi) has grown around its own IT hubs. **North Pune**, which takes in Pimpri-Chinchwad and Moshi, is the most affordable large market and was the tightest in 2026. **South Pune** (Sinhgad Road, Undri, Kondhwa) is popular with families, and **Central Pune** is the smallest and costliest.`,
      ] },
      { h: 'Choosing an area: start with your commute', list: [
        'Work out where you, and anyone else in the household, will travel to every day, and drive it at peak hours.',
        'Check what is open today: the Purple Line from PCMC to Swargate, the new Line 3 in Hinjewadi, and the Missing Link on the Expressway.',
        'Ask about water. Several fast-growing areas, including Wakad, Tathawade, Punawale and the villages merged into PMC, rely partly on tankers.',
        'Compare the price per sq ft of carpet area across two or three areas before deciding. Our [Pune real estate market report](/blog/pune-real-estate-market-h1-2025) shows how prices differ.',
      ] },
      { h: 'Plots and second homes outside Pune', p: [
        'Karjat and Khopoli in Raigad district attract buyers looking for plots and weekend homes between Mumbai and Pune, helped by the Missing Link that opened in May 2026. Land has its own checks; see our [NA plots checklist](/blog/na-plots-near-pune-checklist).',
      ] },
    ],
  },
  developer: {
    sections: [
      { h: 'Why the developer matters as much as the location', p: [
        'For an under-construction home, the developer decides when you get possession, what quality you get and how disputes are handled. The same micro-market can have a project that delivers early and one that runs years late. Before you compare prices, compare developers.',
      ] },
      { h: 'Five checks on any developer', list: [
        '**Past delivery.** Visit one or two completed projects and ask residents whether possession was on time and what has gone wrong since.',
        '**MahaRERA record.** Search the developer’s other projects and check for complaints, extensions and quarterly progress updates. Our guide shows [how to check MahaRERA registration](/blog/how-to-check-maharera-registration-pune).',
        '**Title and approvals.** Ask for the title certificate and commencement certificate for the phase you are buying.',
        '**The agreement.** Read the possession clause and the penalty for delay. Under RERA you are entitled to interest for delays beyond the agreed date.',
        '**Cost sheet.** Ask for the full cost in writing: parking, maintenance deposit, society charges, GST and stamp duty.',
      ] },
      { h: 'Large developer or smaller local builder?', p: [
        'National developers usually bring stronger balance sheets, standard specifications and established after-sales teams, and often charge a premium for them. Experienced local developers can offer better value and more flexibility on layouts and payment plans. Either can be a good choice: what matters is the track record of the team building your specific project. Browse each developer’s current projects above and compare them like for like.',
      ] },
    ],
  },
  plot: {
    sections: [
      { h: 'Plots versus apartments', p: [
        'A plot gives you land you can build on in your own time and to your own design, and land in a well-located layout has historically held its value. But it earns no rent until you build, and building adds cost and effort. Plots suit buyers planning a home in a few years, a weekend home, or a long-term holding.',
      ] },
      { h: 'The documents that matter', list: [
        'The **NA (non-agricultural) order** and the approved layout plan.',
        'The **7/12 extract** and mutation entries, showing ownership and any loans or disputes.',
        'A **title search** by your own lawyer, going back at least 30 years.',
        'The project’s **MahaRERA registration**, required for plotted layouts above the threshold.',
        'Whether the land is in a **flood line, eco-sensitive zone or defence restricted zone**.',
      ] },
      { h: 'Read more', p: [
        'Our [NA plots near Pune checklist](/blog/na-plots-near-pune-checklist) covers each step, and our [stamp duty calculator](/stamp-duty-calculator-pune) works out the registration cost.',
      ] },
    ],
    faqs: [
      { q: 'Do plotted projects need MahaRERA registration?', a: 'Yes, plotted layouts above the RERA threshold must be registered with MahaRERA, like apartment projects. Check the registration number on the MahaRERA website before paying any advance.' },
    ],
  },
  villa: {
    sections: [
      { h: 'Is a villa right for you?', p: [
        'A villa or row house gives you your own entrance, more privacy and usually a terrace or garden, in a gated community with shared security and amenities. In and around Pune, villas are mostly found on the edges of the city, where larger land parcels are available, such as Ravet and Gahunje near the Expressway.',
      ] },
      { h: 'What to check', list: [
        '**Carpet area and plot area** separately, in writing.',
        '**Maintenance charges:** with fewer homes sharing the costs, they can be higher than in an apartment tower.',
        '**Restrictions on the land:** flood lines, eco-sensitive zones and, around Dehu Road, the defence red zone.',
        '**Resale:** villa resale markets are thinner than apartment markets, so plan to hold for the long term.',
      ] },
    ],
  },
};

module.exports = { AREA_GUIDES, TYPE_GUIDES, LANDMARK_GUIDES, INDEX_GUIDES, renderGuide };

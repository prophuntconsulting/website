/**
 * PROPHUNT LLP's own YouTube walkthroughs, matched to project pages by slug.
 * build-properties merges them into each project as `youtube` (so they reach
 * the prerender and properties/posts.json), renders a click-to-play facade
 * and adds a VideoObject so the video can show in Google video results.
 * Channel: youtube.com/channel/UCX9xvRLtAiDhEqrbSgl5IFg. Only add a video
 * here when it is clearly about the same project as the page.
 */
const PROJECT_VIDEOS = {
  'tej-elevia': [
    { id: 's1rWxxeqqPw', title: 'Tej Elevia Baner Walkthrough | Sky-High Luxury Living in Pune', uploadDate: '2025-11-26T23:00:52-08:00',
      description: 'Walkthrough of Tej Elevia, a luxury high-rise by Tejraj Group on Pan Card Club Road, Baner, Pune.' },
  ],
  'kalpataru-blossoms': [
    { id: '9GAjrYlKCq8', title: 'Kalpataru Blossoms: Luxurious Living in Pune, Manik Baug, Sinhagad Road', uploadDate: '2024-10-24T05:09:42-07:00',
      description: 'Video tour of Kalpataru Blossoms, 2 to 4.5 BHK homes by Kalpataru at Manik Baug, Sinhagad Road, Pune.' },
  ],
  'khopoli': [
    { id: '4rHIg9gLWIo', title: 'Premium Plots Near Khopoli | ~900-Acre Nature-Led Development by Shapoorji Pallonji', uploadDate: '2026-08-31T01:13:22-07:00',
      description: 'Overview of the Shapoorji Pallonji residential plots and private hamlets near Khopoli, Maharashtra.' },
  ],
};

module.exports = { PROJECT_VIDEOS };

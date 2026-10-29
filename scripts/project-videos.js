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
  'godrej-evergreen-square-hinjewadi': [
    { id: 'amuWRae6OmY', title: 'Godrej Evergreen Square, Hinjewadi: Video Walkthrough', uploadDate: '2025-08-16T06:08:15-07:00',
      description: 'Video walkthrough of Godrej Evergreen Square by Godrej Properties, Rajiv Gandhi Infotech Park Phase 3, Hinjewadi, Pune.' },
  ],
  'godrej-aqua-vista-keshav-nagar': [
    { id: 'ZoaSRzyh7Yg', title: 'Godrej Aqua Vista, Keshav Nagar: Video Walkthrough', uploadDate: '2025-08-06T23:25:17-07:00',
      description: 'Video walkthrough of Godrej Aqua Vista by Godrej Properties, Keshav Nagar, Mundhwa, Pune.' },
  ],
  'lodha-bella-vita-nibm': [
    { id: '12zgdggH1m8', title: 'Lodha Bella Vita, NIBM Road: Video Walkthrough', uploadDate: '2021-08-23T02:36:51-07:00',
      description: 'Video walkthrough of Lodha Bella Vita by Lodha, Off NIBM Road, Mohammadwadi, Pune.' },
  ],
  'shapoorji-vanaha-verdant-bavdhan': [
    { id: 'HR1c4AyecpU', title: 'Shapoorji Pallonji Vanaha, Bavdhan: Video Walkthrough', uploadDate: '2025-06-14T03:38:42-07:00',
      description: 'Video walkthrough of Shapoorji Pallonji Vanaha Verdant by Shapoorji Pallonji, Vanaha Township, Lavale, near Bavdhan, Pune.' },
  ],
  'joyville-sensorium-hinjewadi': [
    { id: 'IFA65VGJX8g', title: 'Joyville Sensorium, Hinjewadi: Video Walkthrough', uploadDate: '2025-06-13T22:00:30-07:00',
      description: 'Video walkthrough of Joyville Sensorium by Shapoorji Pallonji, Maan, near Hinjewadi Phase 1, Pune.' },
  ],
  'shapoorji-wildernest-hadapsar': [
    { id: '5kQG93JwRAs', title: 'Shapoorji Pallonji Wildernest, Hadapsar: Video Walkthrough', uploadDate: '2024-11-15T05:01:46-08:00',
      description: 'Video walkthrough of Shapoorji Pallonji Wildernest by Shapoorji Pallonji, SP Kingstown, Shewalewadi, Hadapsar Annexe, Pune.' },
  ],
  'supreme-villagio-somatane': [
    { id: 'RpKkO4Mt3mQ', title: 'Supreme Villagio, Somatane: Video Walkthrough', uploadDate: '2024-10-12T04:29:58-07:00',
      description: 'Video walkthrough of Supreme Villagio by Supreme Universal, Somatane, near Talegaon, Pune.' },
  ],
  'bramha-sun-valley-bavdhan': [
    { id: '_DpSrzpIErA', title: 'Bramha Sun Valley, Bavdhan: Video Walkthrough', uploadDate: '2025-05-15T03:32:50-07:00',
      description: 'Video walkthrough of Bramha Sun Valley by BramhaCorp, Bavdhan, Pune (on the Mumbai-Bengaluru Highway).' },
  ],
  'kohinoor-satori-baner': [
    { id: 'TrZCbFxJJvQ', title: 'Satori by Kohinoor, New Baner: Video Walkthrough', uploadDate: '2024-10-02T04:05:23-07:00',
      description: 'Video walkthrough of Kohinoor Satori by Kohinoor Group, Mahalunge (New Baner), Pune.' },
  ],
  'rohan-ekam-balewadi': [
    { id: 'sO3-ipZAj98', title: 'Rohan Ekam, Balewadi: Video Walkthrough', uploadDate: '2025-12-02T23:50:11-08:00',
      description: 'Video walkthrough of Rohan Ekam by Rohan Builders, Riverside, Balewadi, near Baner, Pune.' },
  ],
  'rohan-harita-tathawade': [
    { id: 'rJ9-hlh6lek', title: 'Rohan Harita, Tathawade: Video Walkthrough', uploadDate: '2024-12-12T02:23:40-08:00',
      description: 'Video walkthrough of Rohan Harita by Rohan Builders, Ashok Nagar Road, Tathawade, Pune.' },
  ],
  'kolte-patil-qrious-life-republic': [
    { id: 'YTDlUyty01w', title: 'Qrious by Kolte Patil, Life Republic: Video Walkthrough', uploadDate: '2025-06-21T00:30:32-07:00',
      description: 'Video walkthrough of Qrious, Life Republic by Kolte-Patil Developers, Life Republic Township, Marunji, Hinjewadi, Pune.' },
  ],
  'kohinoor-abhimaan-shirgaon': [
    { id: '6pvcVSpW8eU', title: 'Kohinoor Abhimaan Homes, Shirgaon: Video Walkthrough', uploadDate: '2022-05-13T00:17:34-07:00',
      description: 'Video walkthrough of Kohinoor Abhimaan Homes by Kohinoor Group, Shirgaon, near Talegaon, Pune.' },
  ],
};

module.exports = { PROJECT_VIDEOS };

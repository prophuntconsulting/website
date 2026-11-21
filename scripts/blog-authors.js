/**
 * The blog's named authors: one roster for the byline, the author box, the
 * Person schema, the /blog/authors pages and the sitemap.
 *
 * Rules: roles and bios say only what we know (title where given, firm,
 * topics covered); no pronouns, no invented experience or credentials. A photo
 * is shown as an avatar only; there are no links to personal profiles.
 */
const FIRM = 'PROPHUNT LLP, a MahaRERA-registered real estate channel partner (A52100037156) in Baner, Pune';
const TAIL = 'Articles are for general information; check current prices, approvals and registration details before you book.';

const AUTHORS = {
  'Saurabh Shedolkar': {
    role: 'Real Estate Consultant',
    photo: '/images/authors/saurabh-shedolkar.webp',
    topics: 'Pune Metro Line 3, area guides, Hinjewadi and other localities, infrastructure and flat rates',
    bio: `Saurabh Shedolkar is a real estate consultant at ${FIRM}. Saurabh helps homebuyers and investors compare new projects across Pune, plan site visits and check pricing and MahaRERA details before booking. ${TAIL}`,
  },
  'Sandeep Yadav': {
    role: 'Real Estate Consultant',
    topics: 'Pune market reports, buying and budget guides, resale flats and home loans',
    bio: `Sandeep Yadav is a real estate consultant at ${FIRM}. Sandeep works with buyers on shortlisting homes by budget and location, comparing developers and negotiating the final deal. ${TAIL}`,
  },
  'Abhishek Ghadge': {
    role: '',
    photo: '/images/authors/abhishek-ghadge.webp',
    topics: 'MahaRERA checks, stamp duty and registration, Index II, ready reckoner rates, 7/12 extracts, property tax and occupancy certificates',
    bio: `Abhishek Ghadge is part of the team at ${FIRM}, and writes about property documents, taxes and the steps from booking to registration. ${TAIL}`,
  },
  'Pranav Nair': {
    role: '',
    photo: '/images/authors/pranav-nair.webp',
    topics: 'carpet area and RERA terms, NA plots, NRI buying, PMRDA zones and plans, capital gains, GST and MahaRERA complaints',
    bio: `Pranav Nair is part of the team at ${FIRM}, and writes about planning rules, approvals and buyer rights in Pune real estate. ${TAIL}`,
  },
};

const authorSlug = name => String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const authorUrl = name => `/blog/authors/${authorSlug(name)}`;

module.exports = { FIRM, TAIL, AUTHORS, authorSlug, authorUrl };

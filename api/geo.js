// Approximate visitor location from Vercel's IP geolocation headers, so js/clarity.js
// can tag each session with its city, region and PIN code (the ad platforms only
// report country). Nothing is stored here.
const header = (req, name) => {
  const v = req.headers[name];
  if (!v) return '';
  try { return decodeURIComponent(String(v)); } catch (e) { return String(v); }
};

const geo = (req) => ({
  city: header(req, 'x-vercel-ip-city'),
  region: header(req, 'x-vercel-ip-country-region'),
  postal: header(req, 'x-vercel-ip-postal-code'),
  country: header(req, 'x-vercel-ip-country'),
});

module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(200).json(geo(req));
};
module.exports.geo = geo;

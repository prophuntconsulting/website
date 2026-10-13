const crypto = require('crypto');

// Starts the GitHub login for the CMS (/admin). A random `state` is stored in a
// short-lived cookie and checked in /api/callback, so a login that this site
// did not start (CSRF / login-forcing) is rejected.
module.exports = (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  res.setHeader('Set-Cookie', `cms_oauth_state=${state}; Path=/api; Max-Age=600; HttpOnly; Secure; SameSite=Lax`);
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    scope: 'repo,user',
    redirect_uri: 'https://www.prophuntllp.com/api/callback',
    state
  });
  res.redirect(302, `https://github.com/login/oauth/authorize?${params}`);
};

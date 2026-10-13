module.exports = async (req, res) => {
  const { code, state } = req.query;
  const cookieState = (req.cookies && req.cookies.cms_oauth_state) || '';
  // One-time use: clear the state cookie whatever happens next.
  res.setHeader('Set-Cookie', 'cms_oauth_state=; Path=/api; Max-Age=0; HttpOnly; Secure; SameSite=Lax');

  let msg;
  if (!state || !cookieState || state !== cookieState) {
    msg = 'authorization:github:error:Login expired or was not started from this site. Please try again.';
  } else {
    const r = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      })
    });
    const data = await r.json();
    msg = data.access_token
      ? `authorization:github:success:${JSON.stringify({ token: data.access_token, provider: 'github' })}`
      : `authorization:github:error:${data.error_description || 'Authentication failed'}`;
  }

  // Only hand the token to a window on this site's own origin (the CMS at /admin).
  // Posting to '*' let any page that opened this popup receive the GitHub token.
  // JSON is escaped for a <script> context so "</script>" in an error can't break out.
  const payload = JSON.stringify(msg).replace(/</g, '\\u003c');
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'no-store');
  res.end(`<!doctype html><html><script>
    if (window.opener) window.opener.postMessage(${payload}, window.location.origin);
    window.close();
  </script></html>`);
};

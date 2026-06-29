module.exports = async (req, res) => {
  const code = req.query.code;

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
  const msg = data.access_token
    ? `authorization:github:success:${JSON.stringify({ token: data.access_token, provider: 'github' })}`
    : `authorization:github:error:${data.error_description || 'Authentication failed'}`;

  res.setHeader('Content-Type', 'text/html');
  res.end(`<!doctype html><html><script>
    window.opener.postMessage(${JSON.stringify(msg)}, '*');
    window.close();
  </script></html>`);
};

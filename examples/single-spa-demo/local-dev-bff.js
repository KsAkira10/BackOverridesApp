import http from 'node:http';

const PORT = 8080;

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname;
  const method = req.method || 'GET';

  // Local development headers
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. New Orders Endpoint (Feature being developed locally)
  if (pathname === '/bff/core/v1/orders' && method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          source: 'Local Dev BFF (Port 8080) ⚡',
          orderId: 'LOCAL-V2-ORD-8080',
          status: 'created_with_new_instant_checkout_v2',
          featureFlag: 'NEW_CHECKOUT_PIPELINE_ACTIVE',
          discountApplied: '20% OFF DEV_SPECIAL',
          timestamp: new Date().toISOString(),
          details: body ? JSON.parse(body) : null,
        })
      );
    });
    return;
  }

  // 2. OAuth Authorize (New SSO / Identity Provider being tested locally)
  if (pathname === '/bff/core/v1/oauth2/authorize') {
    res.writeHead(302, {
      Location: 'https://new-sso.idp.example.io/as/authorization.oauth2?client_id=local_bff_dev_app',
    });
    res.end();
    return;
  }

  // Fallback 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      error: 'Not Found on Local Dev BFF',
      pathname,
      hint: 'Only overridden endpoints are implemented on this local dev server.',
    })
  );
});

server.listen(PORT, () => {
  console.log(`💻 [Local Dev BFF] Running at http://localhost:${PORT} (Simulating Developer Workspace)`);
});

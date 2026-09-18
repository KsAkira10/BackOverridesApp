import http from 'node:http';

const PORT = 9001;

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname;
  const method = req.method || 'GET';

  // Basic CORS headers
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Session Endpoint (stays on cloud)
  if (pathname === '/bff/core/v1/session') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        user: 'Jane Doe',
        email: 'jane.doe@enterprise.corp',
        role: 'Standard User',
        environment: 'Cloud Production Cluster (Port 9001)',
        activeTenant: 'Global-Enterprise',
      })
    );
    return;
  }

  // 2. Catalog Endpoint (stays on cloud)
  if (pathname === '/bff/core/v1/catalog') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        source: 'Remote Cloud API (Port 9001)',
        items: [
          { id: 'srv-101', name: 'Enterprise Cloud DB v16', price: '$299/mo', stock: 'Unlimited' },
          { id: 'srv-102', name: 'Dedicated Kubernetes Cluster', price: '$850/mo', stock: 'Available' },
          { id: 'srv-103', name: 'Global CDN Acceleration', price: '$99/mo', stock: 'Instant' },
        ],
      })
    );
    return;
  }

  // 3. Orders Endpoint (Legacy Cloud implementation)
  if (pathname === '/bff/core/v1/orders' && method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          source: 'Remote Cloud API (Port 9001)',
          orderId: 'CLOUD-LEGACY-ORD-9001',
          status: 'processed_by_remote_cloud',
          timestamp: new Date().toISOString(),
          details: body ? JSON.parse(body) : null,
        })
      );
    });
    return;
  }

  // 4. OAuth Authorize (Legacy Cloud IdP)
  if (pathname === '/bff/core/v1/oauth2/authorize') {
    res.writeHead(302, {
      Location: 'https://idp.enterprise-cloud.corp/login?client_id=legacy_portal_app',
    });
    res.end();
    return;
  }

  // Fallback 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found on Remote Cloud BFF', pathname }));
});

server.listen(PORT, () => {
  console.log(`☁️  [Remote Cloud BFF] Running at http://localhost:${PORT} (Simulating Cloud API)`);
});

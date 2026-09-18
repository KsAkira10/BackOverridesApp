import http from 'node:http';

const PORT = 3000;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  console.log(`[LOCAL DEV SERVICE 3000] Received ${req.method} ${url.pathname}${url.search}`);

  res.setHeader('Content-Type', 'application/json');

  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });

  req.on('end', () => {
    let parsedBody = {};
    try {
      if (body) parsedBody = JSON.parse(body);
    } catch {
      parsedBody = { raw: body };
    }

    if (url.pathname === '/v1/users' && req.method === 'POST') {
      res.writeHead(201);
      res.end(JSON.stringify({
        environment: 'local-development-service',
        action: 'user_created_locally_on_port_3000',
        receivedData: parsedBody,
        timestamp: new Date().toISOString(),
      }));
      return;
    }

    if (url.pathname.startsWith('/v1/users/')) {
      const id = url.pathname.split('/')[3];
      res.writeHead(200);
      res.end(JSON.stringify({
        environment: 'local-development-service',
        userId: id,
        name: `Local User Mock #${id}`,
        query: Object.fromEntries(url.searchParams),
      }));
      return;
    }

    res.writeHead(200);
    res.end(JSON.stringify({
      environment: 'local-development-service',
      path: url.pathname,
    }));
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`💻 Local Dev Service running at http://localhost:${PORT}`);
});

import http from 'node:http';

const PORT = 4000;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  console.log(`[REMOTE API 4000] Received ${req.method} ${url.pathname}${url.search}`);

  res.setHeader('Content-Type', 'application/json');

  if (url.pathname === '/v1/users' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      environment: 'remote-production-api',
      data: [
        { id: 1, name: 'Remote Alice' },
        { id: 2, name: 'Remote Bob' },
      ],
    }));
    return;
  }

  if (url.pathname === '/v1/posts') {
    res.writeHead(200);
    res.end(JSON.stringify({
      environment: 'remote-production-api',
      posts: [
        { id: 101, title: 'Release 2.0 published from remote API' },
      ],
    }));
    return;
  }

  res.writeHead(200);
  res.end(JSON.stringify({
    environment: 'remote-production-api',
    path: url.pathname,
    message: 'Hello from remote API',
  }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`📡 Remote API Mock running at http://localhost:${PORT}`);
});

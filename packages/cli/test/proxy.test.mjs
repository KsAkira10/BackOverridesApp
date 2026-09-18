import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createProxyServer } from '../dist/index.js';

// Helper to start a lightweight HTTP server on an ephemeral port
function startHttpServer(handler) {
  return new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({
        server,
        port,
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise((res) => server.close(res)),
      });
    });
  });
}

test('ProxyServer end-to-end integration', async (t) => {
  // 1. Mock Remote Server
  const remoteMock = await startHttpServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ source: 'remote', method: req.method, url: req.url }));
  });

  // 2. Mock Local Service Server
  const localMock = await startHttpServer((req, res) => {
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ source: 'local', method: req.method, url: req.url }));
  });

  // 3. BackOverrides Proxy Server
  const proxyInstance = createProxyServer({
    port: 0,
    remote: remoteMock.url,
    local: localMock.url,
    cors: { enabled: true },
    silent: true,
    overrides: [
      {
        methods: ['POST'],
        path: '/v1/users',
      },
      {
        methods: ['GET'],
        path: '/v1/users/:id',
      },
      {
        methods: ['GET'],
        path: '/v1/offline-service',
        target: 'http://127.0.0.1:59999/v1/offline-service', // intentionally offline port
      },
      {
        methods: ['GET'],
        path: '/v1/oauth2/authorize',
      },
      {
        methods: ['POST'],
        path: '/v1/oauth2/tokenRequest',
      },
    ],
  });

  await new Promise((resolve) => {
    proxyInstance.server.listen(0, '127.0.0.1', resolve);
  });
  const proxyPort = proxyInstance.server.address().port;
  const proxyUrl = `http://127.0.0.1:${proxyPort}`;

  t.after(async () => {
    await proxyInstance.close();
    await localMock.close();
    await remoteMock.close();
  });

  // Test 1: POST /v1/users is intercepted and redirected to local service
  await t.test('POST /v1/users redirects to local mock', async () => {
    const res = await fetch(`${proxyUrl}/v1/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
      body: JSON.stringify({ name: 'Alice' }),
    });

    assert.equal(res.status, 201);
    assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:5173');
    assert.equal(res.headers.get('access-control-allow-credentials'), 'true');

    const body = await res.json();
    assert.equal(body.source, 'local');
    assert.equal(body.method, 'POST');
    assert.equal(body.url, '/v1/users');
  });

  // Test 2: GET /v1/users is NOT intercepted because rule only specified POST -> forwards to remote
  await t.test('GET /v1/users passes through to remote mock', async () => {
    const res = await fetch(`${proxyUrl}/v1/users`, {
      method: 'GET',
      headers: { Origin: 'http://localhost:5173' },
    });

    assert.equal(res.status, 200);
    assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:5173');

    const body = await res.json();
    assert.equal(body.source, 'remote');
    assert.equal(body.method, 'GET');
    assert.equal(body.url, '/v1/users');
  });

  // Test 3: Dynamic parameter /v1/users/:id matches and preserves query strings
  await t.test('GET /v1/users/42?active=true redirects to local with query string', async () => {
    const res = await fetch(`${proxyUrl}/v1/users/42?active=true`, {
      method: 'GET',
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.source, 'local');
    assert.equal(body.url, '/v1/users/42?active=true');
  });

  // Test 4: Preflight OPTIONS request returns 204 with CORS headers
  await t.test('OPTIONS preflight returns 204 with CORS headers', async () => {
    const res = await fetch(`${proxyUrl}/v1/users`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://staging.example.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Authorization, Content-Type',
      },
    });

    assert.equal(res.status, 204);
    assert.equal(res.headers.get('access-control-allow-origin'), 'https://staging.example.com');
    assert.equal(res.headers.get('access-control-allow-credentials'), 'true');
    assert.ok(res.headers.get('access-control-allow-methods').includes('POST'));
    assert.equal(res.headers.get('access-control-allow-headers'), 'Authorization, Content-Type');
  });

  // Test 5: Local target offline returns 502 Bad Gateway with diagnostic JSON and CORS
  await t.test('Offline local service returns 502 with CORS headers intact', async () => {
    const res = await fetch(`${proxyUrl}/v1/offline-service`, {
      method: 'GET',
      headers: { Origin: 'http://localhost:5173' },
    });

    assert.equal(res.status, 502);
    assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:5173');

    const body = await res.json();
    assert.equal(body.error, 'Bad Gateway');
    assert.equal(body.code, 'ECONNREFUSED');
    assert.equal(body.isOverride, true);
    assert.ok(body.hint.includes('running'));
  });

  // Test 6: Navigation route (/v1/oauth2/authorize) injects x-back-overrides-nav-hint header
  await t.test('GET /v1/oauth2/authorize includes x-back-overrides-nav-hint', async () => {
    const res = await fetch(`${proxyUrl}/v1/oauth2/authorize`, {
      method: 'GET',
    });

    assert.equal(res.status, 201);
    const navHint = res.headers.get('x-back-overrides-nav-hint');
    assert.ok(navHint);
    assert.ok(navHint.includes('BackOverrides Extension'));
  });
});

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { checkBackOverridesPort, discoverCliUrl } from '../dist/index.js';

function createMockServer(port, handler) {
  return new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(port, '127.0.0.1', () => {
      resolve({
        server,
        port: server.address().port,
        close: () => new Promise((res) => server.close(res)),
      });
    });
  });
}

test('Port discovery in client', async (t) => {
  await t.test('checkBackOverridesPort returns true for a BackOverrides proxy', async () => {
    const mock = await createMockServer(0, (req, res) => {
      if (req.url === '/__back-overrides/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', app: 'back-overrides', port: mock.port }));
        return;
      }
      res.writeHead(404);
      res.end();
    });

    try {
      const active = await checkBackOverridesPort(mock.port, '127.0.0.1');
      assert.equal(active, true, 'Port with status ok should be detected as active');

      const nonActive = await checkBackOverridesPort(mock.port + 999, '127.0.0.1', 100);
      assert.equal(nonActive, false, 'Unopened port should report false');
    } finally {
      await mock.close();
    }
  });

  await t.test('discoverCliUrl finds BackOverrides server running on non-default port', async () => {
    // Start proxy mock on port P
    const mock = await createMockServer(0, (req, res) => {
      if (req.url === '/__back-overrides/rules') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ remote: 'https://api.example.com', overrides: [] }));
        return;
      }
      res.writeHead(404);
      res.end();
    });

    try {
      // Search starting from mock.port - 2 up to range 5
      const startPort = mock.port - 2;
      const discovered = await discoverCliUrl({
        preferredPort: startPort,
        searchRange: 5,
        host: '127.0.0.1',
        timeoutMs: 200,
      });

      assert.equal(discovered, `http://127.0.0.1:${mock.port}`);
    } finally {
      await mock.close();
    }
  });
});

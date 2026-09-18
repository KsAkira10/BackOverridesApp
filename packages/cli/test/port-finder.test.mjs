import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {
  isPortAvailable,
  findAvailablePort,
  startProxyServer,
  getActiveRuntimeInfo,
  RUNTIME_FILENAME,
} from '../dist/index.js';

test('Port finder and dynamic resolution', async (t) => {
  await t.test('isPortAvailable correctly detects occupied ports', async () => {
    // Start a server on an ephemeral port
    const server = http.createServer((req, res) => res.end('ok'));
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const occupiedPort = server.address().port;

    const availableBefore = await isPortAvailable(occupiedPort, '127.0.0.1');
    assert.equal(availableBefore, false, 'Occupied port should report unavailable');

    await new Promise((resolve) => server.close(resolve));

    const availableAfter = await isPortAvailable(occupiedPort, '127.0.0.1');
    assert.equal(availableAfter, true, 'Freed port should report available');
  });

  await t.test('findAvailablePort finds the next available port when starting port is occupied', async () => {
    // Occupy a port
    const blocker = http.createServer((req, res) => res.end('blocker'));
    await new Promise((resolve) => blocker.listen(0, '127.0.0.1', resolve));
    const occupiedPort = blocker.address().port;

    // findAvailablePort starting from occupiedPort should return a different port > occupiedPort
    const nextPort = await findAvailablePort(occupiedPort, 10, '127.0.0.1');
    assert.notEqual(nextPort, occupiedPort, 'Next port should differ from occupied port');
    assert.ok(nextPort > occupiedPort, 'Next port should be greater than occupied port');

    await new Promise((resolve) => blocker.close(resolve));
  });

  await t.test('startProxyServer switches port automatically and manages runtime info', async () => {
    // 1. Occupy a starting port with a dummy server
    const dummyServer = http.createServer((req, res) => res.end('dummy'));
    await new Promise((resolve) => dummyServer.listen(0, '127.0.0.1', resolve));
    const occupiedPort = dummyServer.address().port;

    // 2. Start proxy specifying the occupied port
    const instance = await startProxyServer({
      port: occupiedPort,
      remote: 'https://api.example.com',
      silent: true,
      autoPort: true,
    });

    try {
      assert.notEqual(instance.port, occupiedPort, 'Proxy port should be different from occupied port');
      assert.ok(instance.port > 0, 'Proxy port should be valid');

      // Verify runtime info was recorded
      const runtime = getActiveRuntimeInfo();
      assert.ok(runtime, 'Runtime info should be present while running');
      assert.equal(runtime.port, instance.port);

      // Verify /__back-overrides/status endpoint
      const statusRes = await fetch(`http://127.0.0.1:${instance.port}/__back-overrides/status`);
      assert.equal(statusRes.status, 200);
      const statusData = await statusRes.json();
      assert.equal(statusData.status, 'ok');
      assert.equal(statusData.port, instance.port);
    } finally {
      await instance.close();
      await new Promise((resolve) => dummyServer.close(resolve));
    }

    // Verify runtime file was cleaned up
    const runtimeAfter = getActiveRuntimeInfo();
    assert.equal(runtimeAfter, null, 'Runtime info should be cleaned up after server close');
  });
});

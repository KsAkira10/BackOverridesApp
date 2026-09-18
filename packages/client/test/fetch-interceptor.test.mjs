import test from 'node:test';
import assert from 'node:assert/strict';
import { setupFetchInterceptor } from '../dist/index.js';

test('setupFetchInterceptor intercepts fetch with full URL matching rules', async () => {
  // Mock window and window.fetch
  const originalCalls = [];
  const fakeWindow = {
    fetch: async (input, init) => {
      originalCalls.push({ input, init });
      return { ok: true, status: 200, json: async () => ({ mock: true }) };
    },
  };
  globalThis.window = fakeWindow;

  const control = setupFetchInterceptor(
    {
      remote: 'https://api.corporate-cloud.io',
      local: 'http://localhost:8080',
      overrides: [
        {
          methods: ['*'],
          path: '/bff/core/v1/*',
        },
      ],
    },
    { debug: false }
  );

  // 1. Call to matching URL: should be rewritten to local target
  await fakeWindow.fetch('https://api.corporate-cloud.io/bff/core/v1/users?active=true');
  assert.equal(originalCalls.length, 1);
  assert.equal(originalCalls[0].input, 'http://localhost:8080/bff/core/v1/users?active=true');

  // 2. Call to non-matching URL on remote: should NOT be rewritten
  await fakeWindow.fetch('https://api.corporate-cloud.io/v1/other-service');
  assert.equal(originalCalls.length, 2);
  assert.equal(originalCalls[1].input, 'https://api.corporate-cloud.io/v1/other-service');

  // 3. Restore
  control.restore();
  await fakeWindow.fetch('https://api.corporate-cloud.io/bff/core/v1/users');
  assert.equal(originalCalls.length, 3);
  assert.equal(originalCalls[2].input, 'https://api.corporate-cloud.io/bff/core/v1/users');
});

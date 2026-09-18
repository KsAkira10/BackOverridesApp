import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isPreflightRequest,
  getCorsPreflightHeaders,
  getCorsResponseHeaders,
} from '../dist/index.js';

test('isPreflightRequest identifies OPTIONS requests with CORS headers', () => {
  assert.equal(
    isPreflightRequest({
      method: 'OPTIONS',
      url: '/v1/users',
      headers: { origin: 'http://localhost:5173', 'access-control-request-method': 'POST' },
    }),
    true
  );

  assert.equal(
    isPreflightRequest({
      method: 'GET',
      url: '/v1/users',
      headers: { origin: 'http://localhost:5173' },
    }),
    false
  );
});

test('getCorsPreflightHeaders produces correct CORS headers reflecting origin', () => {
  const headers = getCorsPreflightHeaders(
    { enabled: true },
    {
      origin: 'http://localhost:5173',
      'access-control-request-headers': 'authorization, content-type',
    }
  );

  assert.equal(headers['Access-Control-Allow-Origin'], 'http://localhost:5173');
  assert.equal(headers['Access-Control-Allow-Credentials'], 'true');
  assert.equal(headers['Access-Control-Allow-Headers'], 'authorization, content-type');
  assert.ok(headers['Access-Control-Allow-Methods'].includes('POST'));
  assert.equal(headers['Access-Control-Max-Age'], '86400');
});

test('getCorsResponseHeaders injects origin and credentials into responses', () => {
  const headers = getCorsResponseHeaders(
    { enabled: true },
    { origin: 'http://localhost:5173' }
  );

  assert.equal(headers['Access-Control-Allow-Origin'], 'http://localhost:5173');
  assert.equal(headers['Access-Control-Allow-Credentials'], 'true');
  assert.equal(headers['Access-Control-Expose-Headers'], '*');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { RouteMatcher, compilePathPattern, parseRuleShorthand } from '../dist/index.js';

test('compilePathPattern and matching', () => {
  const { regex, paramNames } = compilePathPattern('/v1/users/:id');
  assert.deepEqual(paramNames, ['id']);
  assert.ok(regex.test('/v1/users/42'));
  assert.ok(regex.test('/v1/users/42/'));
  const { regex: rOpenApi, paramNames: pOpenApi } = compilePathPattern('/bff/v1/profile/{scope}/me');
  assert.deepEqual(pOpenApi, ['scope']);
  assert.ok(rOpenApi.test('/bff/v1/profile/GOVAPPProfile/me'));
  assert.ok(rOpenApi.test('/bff/v1/profile/admin/me/'));
  assert.ok(!rOpenApi.test('/bff/v1/profile/me'));
});

test('compilePathPattern with wildcard', () => {
  const { regex, paramNames } = compilePathPattern('/v1/*');
  assert.ok(regex.test('/v1/users'));
  assert.ok(regex.test('/v1/users/123/profile'));
  assert.ok(!regex.test('/v2/users'));
});

test('parseRuleShorthand parses various formats', () => {
  const r1 = parseRuleShorthand('POST /v1/users');
  assert.deepEqual(r1.methods, ['POST']);
  assert.equal(r1.path, '/v1/users');
  assert.equal(r1.target, undefined);

  const r2 = parseRuleShorthand('POST,GET /v1/users -> http://localhost:3000/mock/users');
  assert.deepEqual(r2.methods, ['POST', 'GET']);
  assert.equal(r2.path, '/v1/users');
  assert.equal(r2.target, 'http://localhost:3000/mock/users');

  const r3 = parseRuleShorthand('/v1/products');
  assert.deepEqual(r3.methods, ['*']);
  assert.equal(r3.path, '/v1/products');
});

test('RouteMatcher matches specific method and overrides target', () => {
  const matcher = new RouteMatcher({
    remote: 'https://api.example.com',
    local: 'http://localhost:3000',
    overrides: [
      {
        methods: ['POST'],
        path: '/v1/users',
      },
      {
        methods: ['GET'],
        path: '/v1/users/:id',
        target: 'http://localhost:3000/custom/user-:id',
      },
    ],
  });

  // POST /v1/users -> OVERRIDE localhost:3000/v1/users
  const res1 = matcher.match({ method: 'POST', url: '/v1/users?source=web' });
  assert.equal(res1.isOverride, true);
  assert.equal(res1.targetUrl, 'http://localhost:3000/v1/users?source=web');

  // GET /v1/users -> REMOTE https://api.example.com/v1/users (because rule was POST only)
  const res2 = matcher.match({ method: 'GET', url: '/v1/users?source=web' });
  assert.equal(res2.isOverride, false);
  assert.equal(res2.targetUrl, 'https://api.example.com/v1/users?source=web');

  // GET /v1/users/99 -> OVERRIDE custom target with param substitution
  const res3 = matcher.match({ method: 'GET', url: '/v1/users/99' });
  assert.equal(res3.isOverride, true);
  assert.equal(res3.targetUrl, 'http://localhost:3000/custom/user-99');
  assert.equal(res3.params.id, '99');

  // Other route -> REMOTE
  const res4 = matcher.match({ method: 'GET', url: '/v1/posts/10' });
  assert.equal(res4.isOverride, false);
  assert.equal(res4.targetUrl, 'https://api.example.com/v1/posts/10');
});

test('RouteMatcher matches full absolute URLs without changing frontend remote domain', () => {
  const matcher = new RouteMatcher({
    remote: 'https://api.corporate-cloud.io',
    local: 'http://localhost:8080',
    overrides: [
      {
        methods: ['*'],
        path: '/bff/core/v1/*',
      },
    ],
  });

  // Full URL matching rule
  const res1 = matcher.match({
    method: 'GET',
    url: 'https://api.corporate-cloud.io/bff/core/v1/users?active=true',
  });
  assert.equal(res1.isOverride, true);
  assert.equal(
    res1.targetUrl,
    'http://localhost:8080/bff/core/v1/users?active=true'
  );

  // Full URL on same remote not matching rule -> stays pointing to remote API
  const res2 = matcher.match({
    method: 'GET',
    url: 'https://api.corporate-cloud.io/v1/other-service',
  });
  assert.equal(res2.isOverride, false);
  assert.equal(res2.targetUrl, 'https://api.corporate-cloud.io/v1/other-service');

  // External URL (different domain) -> untouched
  const res3 = matcher.match({
    method: 'GET',
    url: 'https://cdn.example.com/bundle.js',
  });
  assert.equal(res3.isOverride, false);
  assert.equal(res3.targetUrl, 'https://cdn.example.com/bundle.js');
});

test('RouteMatcher respects passthrough rules before wildcard overrides', () => {
  const matcher = new RouteMatcher({
    remote: 'https://api.corporate-cloud.io',
    local: 'http://localhost:8080',
    overrides: [
      {
        methods: ['*'],
        path: '/bff/core/v1/oauth2/profile/*',
        passthrough: true,
      },
      {
        methods: ['*'],
        path: '/bff/core/v1/*',
      },
    ],
  });

  // Profile URL matches passthrough rule -> goes to remote
  const resProfile = matcher.match({
    method: 'GET',
    url: 'https://api.corporate-cloud.io/bff/core/v1/oauth2/profile/UserProfile/me',
  });
  assert.equal(resProfile.isOverride, false);
  assert.equal(
    resProfile.targetUrl,
    'https://api.corporate-cloud.io/bff/core/v1/oauth2/profile/UserProfile/me'
  );

  // Logout matches wildcard -> overrides to localhost
  const resLogout = matcher.match({
    method: 'POST',
    url: 'https://api.corporate-cloud.io/bff/core/v1/oauth2/logout',
  });
  assert.equal(resLogout.isOverride, true);
  assert.equal(
    resLogout.targetUrl,
    'http://localhost:8080/bff/core/v1/oauth2/logout'
  );
});


import {
  RouteMatcher,
  getCorsPreflightHeaders,
  getCorsResponseHeaders,
} from '@back-overrides/core';
import { loadConfig } from '@back-overrides/cli';
import { getProjectPaths } from '../utils/paths.js';

export interface TestRouteOptions {
  url: string;
  method?: string;
  origin?: string;
  configPath?: string;
  cwd?: string;
}

export interface TestRouteResult {
  matched: boolean;
  method: string;
  inputUrl: string;
  action: 'OVERRIDE_LOCAL' | 'PASSTHROUGH_REMOTE';
  targetUrl: string;
  isRedirect: boolean;
  rule?: {
    path: string;
    methods: string[];
    description?: string;
    target?: string;
  };
  remoteBase: string;
  localBase: string;
  cors: {
    enabled: boolean;
    sampleResponseHeaders: Record<string, string>;
    samplePreflightHeaders: Record<string, string>;
  };
  explanation: string;
}

/**
 * Tests a URL and method against the configured BackOverrides rules.
 */
export async function testRoute(options: TestRouteOptions): Promise<TestRouteResult> {
  const paths = getProjectPaths(options.cwd);
  const config = loadConfig(
    {
      config: options.configPath || paths.defaultConfigFile,
    },
    paths.repoRoot
  );

  const matcher = new RouteMatcher(config);
  const method = (options.method || 'GET').toUpperCase();
  const sampleOrigin = options.origin || 'http://localhost:3000';

  const matchResult = matcher.match({
    method,
    url: options.url,
    headers: { origin: sampleOrigin },
  });

  const sampleHeaders = { origin: sampleOrigin };
  const responseCors = getCorsResponseHeaders(config.cors, sampleHeaders);
  const preflightCors = getCorsPreflightHeaders(config.cors, sampleHeaders);

  const isOverride = matchResult.isOverride;
  const action = isOverride ? 'OVERRIDE_LOCAL' : 'PASSTHROUGH_REMOTE';
  const explanation = isOverride
    ? `Request [${method} ${options.url}] MATCHES rule "${matchResult.rule?.path}" and will be intercepted and redirected to local: ${matchResult.targetUrl}`
    : `Request [${method} ${options.url}] does NOT match any active override rule and will pass through to remote: ${matchResult.targetUrl}`;

  return {
    matched: matchResult.matched,
    method,
    inputUrl: options.url,
    action,
    targetUrl: matchResult.targetUrl,
    isRedirect: isOverride,
    rule: matchResult.rule
      ? {
          path: matchResult.rule.path,
          methods: matchResult.rule.methods || ['*'],
          description: matchResult.rule.description,
          target: matchResult.rule.target,
        }
      : undefined,
    remoteBase: config.remote,
    localBase: config.local || 'http://localhost:3000',
    cors: {
      enabled: config.cors?.enabled !== false,
      sampleResponseHeaders: responseCors,
      samplePreflightHeaders: preflightCors,
    },
    explanation,
  };
}

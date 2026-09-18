import { DEFAULT_PROXY_PORT, type BackOverridesConfig, type HttpMethod, type OverrideRule } from './types.js';

const VALID_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', '*'];

/**
 * Parses a shorthand rule string into an OverrideRule object.
 * Examples:
 * - "POST /v1/users"
 * - "POST,GET /v1/users"
 * - "POST /v1/users -> http://localhost:3000/api/users"
 * - "/v1/users"
 */
export function parseRuleShorthand(input: string): OverrideRule {
  const trimmed = input.trim();
  let leftPart = trimmed;
  let target: string | undefined = undefined;

  if (trimmed.includes('->')) {
    const parts = trimmed.split('->');
    leftPart = parts[0].trim();
    target = parts[1].trim();
  }

  const spaceIndex = leftPart.indexOf(' ');
  if (spaceIndex === -1) {
    // No method specified, just a path
    return {
      methods: ['*'],
      path: leftPart,
      target,
    };
  }

  const methodPart = leftPart.slice(0, spaceIndex).trim();
  const pathPart = leftPart.slice(spaceIndex + 1).trim();

  // Check if methodPart contains valid HTTP methods (e.g. GET, POST, or POST,GET)
  const candidateMethods = methodPart
    .split(',')
    .map((m) => m.trim().toUpperCase() as HttpMethod);

  const areAllMethodsValid = candidateMethods.every((m) => VALID_METHODS.includes(m));

  if (areAllMethodsValid) {
    return {
      methods: candidateMethods,
      path: pathPart,
      target,
    };
  }

  // If not a recognized method, treat the entire leftPart as path
  return {
    methods: ['*'],
    path: leftPart,
    target,
  };
}

/**
 * Validates and normalizes the full configuration, applying defaults.
 */
export function normalizeConfig(config: Partial<BackOverridesConfig>): BackOverridesConfig {
  if (!config.remote) {
    throw new Error('Config validation error: "remote" base API URL is required.');
  }

  const remote = config.remote.trim().replace(/\/+$/, '');
  const local = (config.local || 'http://localhost:3000').trim().replace(/\/+$/, '');
  const port = config.port ?? DEFAULT_PROXY_PORT;
  const autoPort = config.autoPort ?? true;

  const overrides: OverrideRule[] = (config.overrides || []).map((rule, idx) => {
    if (!rule.path) {
      throw new Error(`Config validation error: Rule at index ${idx} is missing a "path".`);
    }
    return {
      id: rule.id || `rule-${idx + 1}`,
      methods: rule.methods && rule.methods.length > 0 ? rule.methods : ['*'],
      path: rule.path,
      target: rule.target,
      passthrough: Boolean(rule.passthrough),
      disabled: Boolean(rule.disabled),
      description: rule.description,
    };
  });

  return {
    port,
    autoPort,
    remote,
    local,
    cors: {
      enabled: config.cors?.enabled ?? true,
      origin: config.cors?.origin,
      credentials: config.cors?.credentials ?? true,
      methods: config.cors?.methods,
      headers: config.cors?.headers,
      maxAge: config.cors?.maxAge,
      exposeHeaders: config.cors?.exposeHeaders,
    },
    overrides,
    verbose: Boolean(config.verbose),
    silent: Boolean(config.silent),
    secure: config.secure ?? false,
  };
}

/**
 * Validates whether an HTTP JSON response payload corresponds to a BackOverrides server.
 */
export function isBackOverridesRulesResponse(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return typeof obj.remote === 'string' || Array.isArray(obj.overrides);
}

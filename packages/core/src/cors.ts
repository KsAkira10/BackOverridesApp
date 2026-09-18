import type { CorsConfig, IncomingRequestInfo } from './types.js';

const DEFAULT_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];

function getHeader(
  headers: Record<string, string | string[] | undefined> | undefined,
  name: string
): string | undefined {
  if (!headers) return undefined;
  const target = name.toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === target) {
      const val = headers[key];
      return Array.isArray(val) ? val.join(', ') : val;
    }
  }
  return undefined;
}

/**
 * Determines whether a request is an HTTP CORS Preflight (OPTIONS) request.
 */
export function isPreflightRequest(request: IncomingRequestInfo): boolean {
  if (request.method.toUpperCase() !== 'OPTIONS') {
    return false;
  }
  const headers = request.headers;
  // A preflight OPTIONS typically includes Origin and Access-Control-Request-Method
  const hasOrigin = Boolean(getHeader(headers, 'origin'));
  const hasReqMethod = Boolean(getHeader(headers, 'access-control-request-method'));
  return hasOrigin || hasReqMethod;
}

/**
 * Resolves the Access-Control-Allow-Origin value based on the request and config.
 */
export function resolveAllowedOrigin(
  corsConfig: CorsConfig | undefined,
  requestHeaders: Record<string, string | string[] | undefined> | undefined
): string {
  const reqOrigin = getHeader(requestHeaders, 'origin');

  if (corsConfig?.origin) {
    if (typeof corsConfig.origin === 'string') {
      return corsConfig.origin;
    }
    if (corsConfig.origin === true && reqOrigin) {
      return reqOrigin;
    }
  }

  // Default: reflect incoming Origin if present, otherwise allow all
  return reqOrigin || '*';
}

/**
 * Generates headers for an OPTIONS preflight response.
 */
export function getCorsPreflightHeaders(
  corsConfig: CorsConfig | undefined,
  requestHeaders: Record<string, string | string[] | undefined> | undefined
): Record<string, string> {
  if (corsConfig?.enabled === false) {
    return {};
  }

  const allowedOrigin = resolveAllowedOrigin(corsConfig, requestHeaders);
  const requestedHeaders = getHeader(requestHeaders, 'access-control-request-headers');

  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': (corsConfig?.methods || DEFAULT_METHODS).join(', '),
    'Access-Control-Allow-Headers':
      typeof corsConfig?.headers === 'string'
        ? corsConfig.headers
        : Array.isArray(corsConfig?.headers)
        ? corsConfig.headers.join(', ')
        : requestedHeaders || '*',
    'Access-Control-Max-Age': String(corsConfig?.maxAge ?? 86400),
  };

  const allowCredentials = corsConfig?.credentials ?? true;
  if (allowCredentials && allowedOrigin !== '*') {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  // Support Chrome Private Network Access (PNA) when called from public HTTPS origins to localhost
  headers['Access-Control-Allow-Private-Network'] = 'true';

  if (corsConfig?.exposeHeaders) {
    headers['Access-Control-Expose-Headers'] = Array.isArray(corsConfig.exposeHeaders)
      ? corsConfig.exposeHeaders.join(', ')
      : corsConfig.exposeHeaders;
  }

  return headers;
}

/**
 * Generates CORS headers to inject into actual responses from the target (local or remote).
 */
export function getCorsResponseHeaders(
  corsConfig: CorsConfig | undefined,
  requestHeaders: Record<string, string | string[] | undefined> | undefined
): Record<string, string> {
  if (corsConfig?.enabled === false) {
    return {};
  }

  const allowedOrigin = resolveAllowedOrigin(corsConfig, requestHeaders);
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': allowedOrigin,
  };

  const allowCredentials = corsConfig?.credentials ?? true;
  if (allowCredentials && allowedOrigin !== '*') {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  // Support Chrome Private Network Access (PNA)
  headers['Access-Control-Allow-Private-Network'] = 'true';

  if (corsConfig?.exposeHeaders) {
    headers['Access-Control-Expose-Headers'] = Array.isArray(corsConfig.exposeHeaders)
      ? corsConfig.exposeHeaders.join(', ')
      : corsConfig.exposeHeaders;
  } else {
    headers['Access-Control-Expose-Headers'] = '*';
  }

  return headers;
}

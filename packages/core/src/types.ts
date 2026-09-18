export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'HEAD'
  | 'OPTIONS'
  | '*';

export interface OverrideRule {
  id?: string;
  /**
   * HTTP Methods to match, e.g. ['POST'], ['GET', 'POST'], or ['*'].
   * Default: ['*'] (matches all methods).
   */
  methods?: HttpMethod[];
  /**
   * Path pattern to match.
   * Supports exact paths (/v1/users), parameters (/v1/users/:id), and wildcards (/v1/*).
   */
  path: string;
  /**
   * Destination target URL or path.
   * If a full URL is provided (e.g. http://localhost:3000/v1/users), it is used directly.
   * If a path is provided (e.g. /mock/users), it replaces the path on the local base URL.
   * If omitted, the request path + query string is appended to the default local base URL.
   */
  target?: string;
  /**
   * Optional toggle to explicitly bypass override and forward to the remote API.
   * Useful when combining with broad wildcard rules.
   */
  passthrough?: boolean;
  /**
   * Optional toggle to temporarily disable this rule.
   */
  disabled?: boolean;
  /**
   * Optional human-friendly description for the rule.
   */
  description?: string;
}

export interface CorsConfig {
  /**
   * Whether automatic CORS injection is enabled.
   * Default: true.
   */
  enabled?: boolean;
  /**
   * Allowed origin. Defaults to reflecting the incoming request's Origin header.
   */
  origin?: string | boolean;
  /**
   * Access-Control-Allow-Credentials header value.
   * Default: true.
   */
  credentials?: boolean;
  /**
   * Access-Control-Allow-Methods header value.
   * Default: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'].
   */
  methods?: string[];
  /**
   * Access-Control-Allow-Headers header value.
   * Default: ['*'].
   */
  headers?: string[] | string;
  /**
   * Access-Control-Max-Age header value in seconds.
   * Default: 86400 (24 hours).
   */
  maxAge?: number;
  /**
   * Access-Control-Expose-Headers header value.
   */
  exposeHeaders?: string[] | string;
}

export const DEFAULT_PROXY_PORT = 8888;
export const DEFAULT_PORT_SCAN_RANGE = 20;

export interface BackOverridesConfig {
  /**
   * Local port on which the proxy will listen.
   * Default: 8888.
   */
  port?: number;
  /**
   * Automatically resolve and switch to the next available port if the specified port is in use.
   * Default: true.
   */
  autoPort?: boolean;
  /**
   * Remote base API URL (e.g. https://api.example.com).
   */
  remote: string;
  /**
   * Default local base URL for overrides (e.g. http://localhost:3000).
   * Default: http://localhost:3000.
   */
  local?: string;
  /**
   * CORS configuration options.
   */
  cors?: CorsConfig;
  /**
   * List of override rules.
   */
  overrides?: OverrideRule[];
  /**
   * Enable verbose output (logs headers and request/response payloads).
   */
  verbose?: boolean;
  /**
   * Suppress console log output (useful in automated tests).
   */
  silent?: boolean;
  /**
   * Whether to strictly verify SSL certificates for remote HTTPS APIs.
   * Defaults to false to allow internal corporate and dev certificates.
   */
  secure?: boolean;
}

export interface IncomingRequestInfo {
  method: string;
  url: string;
  headers?: Record<string, string | string[] | undefined>;
}

export interface RouteMatchResult {
  matched: boolean;
  isOverride: boolean;
  rule?: OverrideRule;
  targetUrl: string;
  params: Record<string, string>;
  pathname: string;
  search: string;
}

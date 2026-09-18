import type {
  BackOverridesConfig,
  HttpMethod,
  IncomingRequestInfo,
  OverrideRule,
  RouteMatchResult,
} from './types.js';

interface CompiledRoute {
  rule: OverrideRule;
  regex: RegExp;
  paramNames: string[];
}

/**
 * Normalizes a path string, ensuring leading slash and removing redundant slashes.
 */
export function normalizePath(path: string): string {
  if (!path) return '/';
  const clean = path.replace(/\/+/g, '/');
  return clean.startsWith('/') ? clean : `/${clean}`;
}

/**
 * Converts a path pattern (e.g. /users/:id, /files/*) to a regular expression.
 */
export function compilePathPattern(pattern: string): { regex: RegExp; paramNames: string[] } {
  const normalized = normalizePath(pattern);
  const paramNames: string[] = [];

  // Escape special regex characters except : and *
  let regexPattern = '';
  const segments = normalized.split('/');

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (i > 0) regexPattern += '\\/';

    if (segment === '*') {
      regexPattern += '(.*)';
      paramNames.push('wildcard');
    } else if (segment.startsWith(':')) {
      const paramName = segment.slice(1);
      paramNames.push(paramName);
      regexPattern += '([^\\/]+)';
    } else if (segment.startsWith('{') && segment.endsWith('}')) {
      const paramName = segment.slice(1, -1);
      paramNames.push(paramName);
      regexPattern += '([^\\/]+)';
    } else if (segment.includes('*')) {
      const partRegex = segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '(.*)');
      regexPattern += partRegex;
    } else {
      regexPattern += segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  }

  // Allow optional trailing slash
  const regex = new RegExp(`^${regexPattern}\\/?$`, 'i');
  return { regex, paramNames };
}

/**
 * Checks if a given HTTP method matches the rule's allowed methods.
 */
export function isMethodMatch(ruleMethods: HttpMethod[] | undefined, requestMethod: string): boolean {
  if (!ruleMethods || ruleMethods.length === 0 || ruleMethods.includes('*')) {
    return true;
  }
  const upperReq = requestMethod.toUpperCase();
  return ruleMethods.some((m) => m.toUpperCase() === upperReq);
}

export interface ParsedRequestUrl {
  origin?: string;
  pathname: string;
  search: string;
  isAbsolute: boolean;
}

/**
 * Route Matcher class capable of matching incoming requests against configured override rules.
 */
export class RouteMatcher {
  private compiledRules: CompiledRoute[] = [];
  private remoteBase: string;
  private remoteOrigin: string;
  private localBase: string;

  constructor(private config: BackOverridesConfig) {
    this.remoteBase = config.remote.replace(/\/+$/, '');
    try {
      this.remoteOrigin = new URL(this.remoteBase).origin;
    } catch {
      this.remoteOrigin = '';
    }
    this.localBase = (config.local || 'http://localhost:3000').replace(/\/+$/, '');

    this.recompileRules(config.overrides || []);
  }

  public recompileRules(rules: OverrideRule[]): void {
    this.compiledRules = rules
      .filter((r) => !r.disabled)
      .map((rule) => {
        let rulePath = rule.path;
        // If rule specifies full URL, extract path
        if (rulePath.startsWith('http://') || rulePath.startsWith('https://')) {
          try {
            const u = new URL(rulePath);
            rulePath = `${u.pathname}${u.search}`;
          } catch {
            // Keep original
          }
        }
        const { regex, paramNames } = compilePathPattern(rulePath);
        return { rule, regex, paramNames };
      });
  }

  /**
   * Matches an incoming request against the rules.
   * Returns a RouteMatchResult with targetUrl and metadata.
   */
  public match(request: IncomingRequestInfo): RouteMatchResult {
    const parsedUrl = this.parseUrl(request.url);
    const pathname = normalizePath(parsedUrl.pathname);
    const search = parsedUrl.search;
    const reqMethod = request.method || 'GET';

    // If request has absolute URL with an origin that does not match remoteOrigin, do not override
    if (parsedUrl.isAbsolute && parsedUrl.origin && this.remoteOrigin && parsedUrl.origin.toLowerCase() !== this.remoteOrigin.toLowerCase()) {
      return {
        matched: false,
        isOverride: false,
        targetUrl: request.url,
        params: {},
        pathname,
        search,
      };
    }

    for (const { rule, regex, paramNames } of this.compiledRules) {
      if (!isMethodMatch(rule.methods, reqMethod)) {
        continue;
      }

      const match = regex.exec(pathname);
      if (match) {
        if (rule.passthrough) {
          return {
            matched: true,
            isOverride: false,
            rule,
            targetUrl: `${this.remoteBase}${pathname}${search}`,
            params: {},
            pathname,
            search,
          };
        }

        const params: Record<string, string> = {};
        for (let i = 0; i < paramNames.length; i++) {
          params[paramNames[i]] = decodeURIComponent(match[i + 1] || '');
        }

        const targetUrl = this.buildOverrideTargetUrl(rule, pathname, search, params);

        return {
          matched: true,
          isOverride: true,
          rule,
          targetUrl,
          params,
          pathname,
          search,
        };
      }
    }

    // No override match: forward to remote API
    const targetUrl = `${this.remoteBase}${pathname}${search}`;
    return {
      matched: false,
      isOverride: false,
      targetUrl,
      params: {},
      pathname,
      search,
    };
  }

  private buildOverrideTargetUrl(
    rule: OverrideRule,
    pathname: string,
    search: string,
    params: Record<string, string>
  ): string {
    if (!rule.target) {
      // Default: preserve path and query on the local base URL
      return `${this.localBase}${pathname}${search}`;
    }

    let resolvedTarget = rule.target;
    // Replace param placeholders like :id in target string
    for (const [key, value] of Object.entries(params)) {
      resolvedTarget = resolvedTarget.replace(new RegExp(`:${key}`, 'g'), value);
    }

    if (resolvedTarget.startsWith('http://') || resolvedTarget.startsWith('https://')) {
      if (search && !resolvedTarget.includes('?')) {
        return `${resolvedTarget}${search}`;
      } else if (search && resolvedTarget.includes('?')) {
        const separator = resolvedTarget.endsWith('&') || resolvedTarget.endsWith('?') ? '' : '&';
        return `${resolvedTarget}${separator}${search.replace(/^\?/, '')}`;
      }
      return resolvedTarget;
    }

    // Target is a path relative to the local base URL
    const targetPath = normalizePath(resolvedTarget);
    return `${this.localBase}${targetPath}${search}`;
  }

  public parseUrl(urlStr: string): ParsedRequestUrl {
    try {
      if (urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
        const u = new URL(urlStr);
        return {
          origin: u.origin,
          pathname: u.pathname,
          search: u.search,
          isAbsolute: true,
        };
      }
      // If relative path
      const u = new URL(urlStr, 'http://localhost');
      return {
        origin: undefined,
        pathname: u.pathname,
        search: u.search,
        isAbsolute: false,
      };
    } catch {
      const [pathname, search] = urlStr.split('?');
      return {
        origin: undefined,
        pathname: pathname || '/',
        search: search ? `?${search}` : '',
        isAbsolute: false,
      };
    }
  }
}

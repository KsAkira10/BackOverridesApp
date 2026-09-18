import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import https from 'node:https';
import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  type BackOverridesConfig,
  type RouteMatchResult,
  RouteMatcher,
  getCorsPreflightHeaders,
  getCorsResponseHeaders,
  isPreflightRequest,
} from '@back-overrides/core';
import type { Logger } from './logger.js';

export class ProxyHandler {
  private matcher: RouteMatcher;

  constructor(
    private config: BackOverridesConfig,
    private logger: Logger
  ) {
    this.matcher = new RouteMatcher(config);
  }

  public getMatcher(): RouteMatcher {
    return this.matcher;
  }

  private resolveClientScriptPath(format: 'iife' | 'esm' = 'iife'): string | null {
    try {
      const currentDir = path.dirname(fileURLToPath(import.meta.url));
      const filename = format === 'esm' ? 'back-overrides.js' : 'back-overrides.global.js';
      const candidates = [
        path.resolve(currentDir, `../../client/dist/${filename}`),
        path.resolve(process.cwd(), `packages/client/dist/${filename}`),
        path.resolve(process.cwd(), `node_modules/@back-overrides/client/dist/${filename}`),
      ];
      for (const cand of candidates) {
        if (fs.existsSync(cand)) return cand;
      }
    } catch {
      // ignore
    }
    return null;
  }

  public handleRequest(clientReq: IncomingMessage, clientRes: ServerResponse): void {
    const startTime = Date.now();
    const method = clientReq.method || 'GET';
    const originalUrl = clientReq.url || '/';

    // 1. Check for internal BackOverrides endpoints
    if (originalUrl === '/__back-overrides/rules') {
      const corsHeaders = getCorsResponseHeaders(this.config.cors, clientReq.headers);
      clientRes.writeHead(200, {
        'Content-Type': 'application/json',
        ...corsHeaders,
      });
      clientRes.end(JSON.stringify(this.config, null, 2));
      return;
    }

    if (originalUrl.startsWith('/__back-overrides/client')) {
      const corsHeaders = getCorsResponseHeaders(this.config.cors, clientReq.headers);
      const isEsm = originalUrl.endsWith('.mjs') || originalUrl.includes('format=esm');
      const scriptPath = this.resolveClientScriptPath(isEsm ? 'esm' : 'iife');
      if (scriptPath && fs.existsSync(scriptPath)) {
        const rawContent = fs.readFileSync(scriptPath, 'utf-8');
        const initialConfigCode = `if (typeof window !== "undefined") { window.__BACK_OVERRIDES_INITIAL_CONFIG__ = ${JSON.stringify(this.config)}; }\n`;
        const content = initialConfigCode + rawContent;
        clientRes.writeHead(200, {
          'Content-Type': 'application/javascript; charset=utf-8',
          ...corsHeaders,
        });
        clientRes.end(content);
      } else {
        clientRes.writeHead(404, {
          'Content-Type': 'text/plain',
          ...corsHeaders,
        });
        clientRes.end('Client script not found. Build @back-overrides/client.');
      }
      return;
    }

    // 2. Check for CORS Preflight (OPTIONS)
    if (this.config.cors?.enabled !== false && isPreflightRequest({ method, url: originalUrl, headers: clientReq.headers })) {
      const preflightHeaders = getCorsPreflightHeaders(this.config.cors, clientReq.headers);
      clientRes.writeHead(204, preflightHeaders);
      clientRes.end();
      this.logger.logPreflight(method, originalUrl, clientReq.headers.origin as string | undefined);
      return;
    }

    // 2. Route matching
    const matchResult: RouteMatchResult = this.matcher.match({
      method,
      url: originalUrl,
      headers: clientReq.headers,
    });

    this.logger.verbose('Incoming Request', {
      method,
      url: originalUrl,
      isOverride: matchResult.isOverride,
      targetUrl: matchResult.targetUrl,
      rule: matchResult.rule,
    });

    // 3. Forward request to target
    this.forwardRequest(clientReq, clientRes, matchResult, startTime);
  }

  private forwardRequest(
    clientReq: IncomingMessage,
    clientRes: ServerResponse,
    matchResult: RouteMatchResult,
    startTime: number
  ): void {
    const targetUrl = new URL(matchResult.targetUrl);
    const isHttps = targetUrl.protocol === 'https:';
    const clientLib = isHttps ? https : http;

    // Prepare headers to forward
    const forwardHeaders: Record<string, string | string[] | undefined> = {
      ...clientReq.headers,
      host: targetUrl.host,
    };

    // Remove hop-by-hop headers
    delete forwardHeaders['connection'];
    delete forwardHeaders['keep-alive'];
    delete forwardHeaders['transfer-encoding'];

    const reqOptions: https.RequestOptions = {
      protocol: targetUrl.protocol,
      hostname: targetUrl.hostname,
      port: targetUrl.port || (isHttps ? 443 : 80),
      path: `${targetUrl.pathname}${targetUrl.search}`,
      method: clientReq.method,
      headers: forwardHeaders,
      timeout: 30000,
      rejectUnauthorized: this.config.secure ?? false,
    };

    this.logger.verbose('Forwarding Options', reqOptions);

    const proxyReq = clientLib.request(reqOptions, (proxyRes) => {
      const durationMs = Date.now() - startTime;
      const statusCode = proxyRes.statusCode || 200;

      // Prepare response headers
      const responseHeaders: Record<string, string | string[] | undefined> = { ...proxyRes.headers };

      // Remove upstream CORS headers to avoid conflict or restrictive policies
      for (const headerKey of Object.keys(responseHeaders)) {
        if (headerKey.toLowerCase().startsWith('access-control-')) {
          delete responseHeaders[headerKey];
        }
      }

      // Inject diagnostic headers so the developer can see where the response came from in DevTools
      responseHeaders['x-back-overrides-target'] = matchResult.targetUrl;
      responseHeaders['x-back-overrides-type'] = matchResult.isOverride ? 'local-override' : 'remote-passthrough';

      if (matchResult.targetUrl.toLowerCase().includes('authorize') || matchResult.targetUrl.toLowerCase().includes('login')) {
        responseHeaders['x-back-overrides-nav-hint'] = 'For top-level browser redirects, ensure BackOverrides Extension (packages/extension) is active';
      }

      // Inject permissive CORS headers
      if (this.config.cors?.enabled !== false) {
        const corsHeaders = getCorsResponseHeaders(this.config.cors, clientReq.headers);
        Object.assign(responseHeaders, corsHeaders);
      }

      clientRes.writeHead(statusCode, proxyRes.statusMessage, responseHeaders);
      proxyRes.pipe(clientRes);

      let responseBodyBuffer = '';
      proxyRes.on('data', (chunk) => {
        if (responseBodyBuffer.length < 500) {
          responseBodyBuffer += chunk.toString('utf-8');
        }
      });

      proxyRes.on('end', () => {
        this.logger.logRequest({
          method: clientReq.method || 'GET',
          url: clientReq.url || '/',
          isOverride: matchResult.isOverride,
          targetUrl: matchResult.targetUrl,
          statusCode,
          durationMs,
          responseBodyPreview: responseBodyBuffer.trim() || undefined,
        });

        // Diagnostic detection: OAuth code mismatch (invalid_grant)
        if (statusCode === 400) {
          const isTokenEndpoint = matchResult.targetUrl.toLowerCase().includes('token') || matchResult.targetUrl.toLowerCase().includes('oauth2');
          const hasGrantError = responseBodyBuffer.includes('invalid_grant') || responseBodyBuffer.includes('invalid_code') || responseBodyBuffer.includes('unauthorized_client');
          if (isTokenEndpoint && hasGrantError) {
            this.logger.logOAuthMismatchHint(matchResult.targetUrl, responseBodyBuffer.slice(0, 150).trim());
          }
        }
      });
    });

    // Forward request payload
    clientReq.pipe(proxyReq);

    // Error handling
    proxyReq.on('error', (err: Error & { code?: string }) => {
      const durationMs = Date.now() - startTime;

      if (matchResult.isOverride) {
        this.logger.logLocalConnectionError(matchResult.targetUrl, err);
      } else {
        console.error(`[REMOTE ERROR] Failed to connect to remote API: ${matchResult.targetUrl} (${err.message})`);
      }

      if (clientRes.headersSent) {
        clientRes.end();
        return;
      }

      // Return 502 Bad Gateway with diagnostic information and CORS headers
      const errorPayload = {
        error: 'Bad Gateway',
        code: err.code || 'UNKNOWN_ERROR',
        message: matchResult.isOverride
          ? `Local override target is unreachable (${err.code || err.message}).`
          : `Remote target is unreachable (${err.code || err.message}).`,
        targetUrl: matchResult.targetUrl,
        isOverride: matchResult.isOverride,
        hint: matchResult.isOverride
          ? 'Check if your local server is running on the expected port and accepting connections.'
          : 'Check your internet connection and remote API availability.',
      };

      const errorHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.config.cors?.enabled !== false) {
        Object.assign(errorHeaders, getCorsResponseHeaders(this.config.cors, clientReq.headers));
      }

      clientRes.writeHead(502, 'Bad Gateway', errorHeaders);
      clientRes.end(JSON.stringify(errorPayload, null, 2));

      this.logger.logRequest({
        method: clientReq.method || 'GET',
        url: clientReq.url || '/',
        isOverride: matchResult.isOverride,
        targetUrl: matchResult.targetUrl,
        statusCode: 502,
        durationMs,
      });
    });
  }
}

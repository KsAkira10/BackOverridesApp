import { type BackOverridesConfig, RouteMatcher } from '@back-overrides/core';

export interface ServiceWorkerInterceptorOptions {
  debug?: boolean;
}

interface ServiceWorkerFetchEvent extends Event {
  request: Request;
  respondWith(response: Promise<Response> | Response): void;
}

interface ServiceWorkerScopeLike {
  addEventListener(type: 'fetch', listener: (event: ServiceWorkerFetchEvent) => void): void;
}

/**
 * Attaches a BackOverrides fetch event listener to the Service Worker global scope (self).
 */
export function setupServiceWorkerInterceptor(
  config: BackOverridesConfig,
  options: ServiceWorkerInterceptorOptions = {}
): void {
  const matcher = new RouteMatcher(config);
  const debug = options.debug ?? true;

  // Check if running in a Service Worker environment
  if (typeof self === 'undefined' || typeof (self as unknown as ServiceWorkerScopeLike).addEventListener !== 'function') {
    throw new Error('setupServiceWorkerInterceptor must be executed inside a Service Worker context.');
  }

  const swScope = self as unknown as ServiceWorkerScopeLike;

  swScope.addEventListener('fetch', (event: ServiceWorkerFetchEvent) => {
    const request = event.request;
    const urlStr = request.url;
    const method = request.method;

    if (urlStr.includes('/__back-overrides/')) {
      return;
    }

    const match = matcher.match({ method, url: urlStr });

    if (match.isOverride) {
      if (debug) {
        console.log(
          `[BackOverrides ServiceWorker] Intercepting ${method} ${urlStr} -> ${match.targetUrl}`
        );
      }

      event.respondWith(
        fetch(match.targetUrl, {
          method: request.method,
          headers: request.headers,
          body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
          // @ts-expect-error duplex is valid in fetch standard
          duplex: 'half',
        })
      );
    }
  });
}

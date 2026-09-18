import { type BackOverridesConfig, RouteMatcher } from '@back-overrides/core';
import type { InterceptorControl } from './types.js';

/**
 * Sets up in-browser fetch and XMLHttpRequest interception.
 */
export function setupFetchInterceptor(
  initialConfig: BackOverridesConfig,
  options: { debug?: boolean; proxyUrl?: string } = {}
): InterceptorControl {
  const isBrowser = typeof window !== 'undefined';
  if (!isBrowser) {
    throw new Error('setupFetchInterceptor can only be used in a browser environment with window defined.');
  }

  const debug = options.debug ?? true;
  const proxyUrl = options.proxyUrl?.replace(/\/+$/, '');
  let active = true;
  let matcher = new RouteMatcher(initialConfig);

  const originalFetch = window.fetch;
  const originalXhrOpen = window.XMLHttpRequest?.prototype.open;

  // Check if rules contain OAuth/page navigation endpoints
  const hasAuthNavigationRoutes = (initialConfig.overrides || []).some((o) => {
    const p = o.path.toLowerCase();
    return p.includes('authorize') || p.includes('login') || p.includes('sso') || p.includes('saml');
  });

  if (hasAuthNavigationRoutes && debug) {
    console.info(
      '%c⚡ [BackOverrides Info]%c Regras de autenticação/navegação detectadas (ex: /authorize).\n' +
      '⚠️ Redirecionamentos de página (window.location.href) NÃO são interceptados por scripts na página devido a restrições do navegador.\n' +
      '💡 Para interceptar navegações de tela inteira sem alterar o frontend, use a Extensão Chrome do BackOverrides (packages/extension) com suporte a "main_frame".',
      'color: #38bdf8; font-weight: bold;',
      'color: inherit;'
    );
  }

  function checkAndDiagnoseResponse(url: string, status: number, bodyText: string) {
    const isTokenOrAuthEndpoint = url.toLowerCase().includes('token') || url.toLowerCase().includes('oauth2');
    const hasGrantError = bodyText.includes('invalid_grant') || bodyText.includes('invalid_code') || bodyText.includes('unauthorized_client');

    if (status === 400 && isTokenOrAuthEndpoint && hasGrantError) {
      console.error(
        '%c⚡ [BackOverrides Diagnóstico]%c 400 Bad Request detectado na troca de token OAuth (invalid_grant).\n' +
        '👉 Causa provável: O navegador navegou diretamente para o IdP remoto (ex: OAM) em vez do seu BFF local durante o login.\n' +
        '💡 Solução: Carregue a Extensão BackOverrides no Chrome (pasta packages/extension) para que a navegação do /authorize seja redirecionada automaticamente via "main_frame" sem alterar seu código!',
        'color: #ef4444; font-weight: bold;',
        'color: inherit;'
      );
    }
  }

  // 1. Monkey-patch window.fetch
  window.fetch = async function (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    if (!active) {
      return originalFetch.call(window, input, init);
    }

    let urlStr = '';
    let method = init?.method || 'GET';
    let isRequestInstance = false;

    if (typeof input === 'string') {
      urlStr = input;
    } else if (input instanceof URL) {
      urlStr = input.toString();
    } else if (typeof Request !== 'undefined' && input instanceof Request) {
      urlStr = input.url;
      method = init?.method || input.method || 'GET';
      isRequestInstance = true;
    }

    // Ignore internal CLI sync calls
    if (urlStr.includes('/__back-overrides/')) {
      return originalFetch.call(window, input, init);
    }

    const match = matcher.match({ method, url: urlStr });

    if (match.isOverride) {
      const destination = proxyUrl
        ? `${proxyUrl}${match.pathname}${match.search}`
        : match.targetUrl;

      if (debug) {
        console.log(
          '%c⚡ [BackOverrides]%c Intercepting ' + method + ' ' + urlStr + ' %c->%c ' + destination,
          'color: #00d2ff; font-weight: bold;',
          'color: inherit;',
          'color: #f59e0b; font-weight: bold;',
          'color: #10b981; font-weight: bold;'
        );
      }

      let responsePromise: Promise<Response>;
      if (isRequestInstance) {
        const newReq = new Request(destination, input as Request);
        responsePromise = originalFetch.call(window, newReq, init);
      } else {
        responsePromise = originalFetch.call(window, destination, init);
      }

      return responsePromise.then((res) => {
        try {
          res
            .clone()
            .text()
            .then((text) => {
              checkAndDiagnoseResponse(urlStr, res.status, text);

              if (debug) {
                const targetHeader = res.headers.get('x-back-overrides-target');
                const targetInfo = targetHeader ? ` (${targetHeader})` : '';
                const preview = text.length > 200 ? `${text.slice(0, 200)}...` : text;
                console.log(
                  `%c⚡ [BackOverrides Response]%c ${method} ${urlStr} %c[${res.status}]%c${targetInfo} %c${preview}`,
                  'color: #00d2ff; font-weight: bold;',
                  'color: inherit;',
                  res.ok ? 'color: #10b981; font-weight: bold;' : 'color: #ef4444; font-weight: bold;',
                  'color: #f59e0b; font-size: 11px;',
                  'color: #9ca3af; font-size: 11px;'
                );
              }
            })
            .catch(() => {});
        } catch {}
        return res;
      });
    }

    return originalFetch.call(window, input, init);
  };

  // 2. Monkey-patch XMLHttpRequest
  if (window.XMLHttpRequest && originalXhrOpen) {
    window.XMLHttpRequest.prototype.open = function (
      this: XMLHttpRequest,
      method: string,
      url: string | URL,
      async: boolean = true,
      username?: string | null,
      password?: string | null
    ): void {
      if (!active) {
        return originalXhrOpen.call(this, method, url, async, username, password);
      }

      const urlStr = typeof url === 'string' ? url : url.toString();

      if (!urlStr.includes('/__back-overrides/')) {
        const match = matcher.match({ method, url: urlStr });
        if (match.isOverride) {
          const destination = proxyUrl
            ? `${proxyUrl}${match.pathname}${match.search}`
            : match.targetUrl;

          if (debug) {
            console.log(
              '%c⚡ [BackOverrides XHR]%c Intercepting ' + method + ' ' + urlStr + ' %c->%c ' + destination,
              'color: #00d2ff; font-weight: bold;',
              'color: inherit;',
              'color: #f59e0b; font-weight: bold;',
              'color: #10b981; font-weight: bold;'
            );

            this.addEventListener('load', () => {
              const targetHeader = this.getResponseHeader('x-back-overrides-target');
              const targetInfo = targetHeader ? ` (${targetHeader})` : '';
              const text = this.responseText || '';
              const preview = text.length > 200 ? `${text.slice(0, 200)}...` : text;

              checkAndDiagnoseResponse(urlStr, this.status, text);

              console.log(
                `%c⚡ [BackOverrides XHR Response]%c ${method} ${urlStr} %c[${this.status}]%c${targetInfo} %c${preview}`,
                'color: #00d2ff; font-weight: bold;',
                'color: inherit;',
                this.status < 400 ? 'color: #10b981; font-weight: bold;' : 'color: #ef4444; font-weight: bold;',
                'color: #f59e0b; font-size: 11px;',
                'color: #9ca3af; font-size: 11px;'
              );
            });
          }
          return originalXhrOpen.call(this, method, destination, async, username, password);
        }
      }

      return originalXhrOpen.call(this, method, url, async, username, password);
    };
  }

  const updateConfig = (newConfig: BackOverridesConfig): void => {
    matcher = new RouteMatcher(newConfig);
    if (debug) {
      console.log('%c⚡ [BackOverrides] Rules updated.', 'color: #00d2ff; font-weight: bold;');
    }
  };

  const restore = (): void => {
    active = false;
    window.fetch = originalFetch;
    if (window.XMLHttpRequest && originalXhrOpen) {
      window.XMLHttpRequest.prototype.open = originalXhrOpen;
    }
    if (debug) {
      console.log('%c⚡ [BackOverrides] Interceptor restored to original.', 'color: #9ca3af;');
    }
  };

  const isActive = (): boolean => active;

  return {
    updateConfig,
    restore,
    isActive,
  };
}

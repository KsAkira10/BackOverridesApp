// BackOverrides In-Page Network Interceptor (Manifest V3 - World: MAIN)
// Runs directly in the web page execution context at document_start.
// Automatically rewrites fetch and XMLHttpRequest endpoints to the local proxy
// BEFORE the browser makes the call, preventing the browser from stripping
// sensitive headers (such as Authorization: Bearer ...) during cross-origin redirects.

(function () {
  let cliUrl = 'http://localhost:8888';
  let rules = [
    {
      source: 'https://api.corporate-cloud.io/bff/core/v1/oauth2/',
      target: 'http://localhost:8888/bff/core/v1/oauth2/',
    },
    {
      source: 'https://api.corporate-cloud.io/bff/core/v1/logout',
      target: 'http://localhost:8888/bff/core/v1/logout',
    },
  ];

  const originalFetch = window.fetch;
  const originalOpen = XMLHttpRequest.prototype.open;

  async function refreshRules() {
    try {
      const res = await originalFetch(`${cliUrl}/__back-overrides/rules`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const config = await res.json();
        const remote = (config.remote || '').replace(/\/+$/, '');
        const localCli = `http://localhost:${config.port || 8888}`;
        if (config.overrides && Array.isArray(config.overrides)) {
          rules = config.overrides.map((o) => {
            const cleanPath = (o.path || '').replace(/\*$/, '');
            return {
              source: `${remote}${cleanPath}`,
              target: `${localCli}${cleanPath}`,
            };
          });
        }
      }
    } catch {
      // CLI may still be starting up
    }
  }

  function rewriteUrl(urlStr) {
    if (!urlStr || typeof urlStr !== 'string') return urlStr;
    if (urlStr.includes('/__back-overrides/')) return urlStr;

    for (const rule of rules) {
      if (urlStr.startsWith(rule.source)) {
        return urlStr.replace(rule.source, rule.target);
      }
    }
    return urlStr;
  }

  // 1. Intercept window.fetch
  window.fetch = function (input, init) {
    let url = '';
    let isRequest = false;

    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.toString();
    } else if (typeof Request !== 'undefined' && input instanceof Request) {
      url = input.url;
      isRequest = true;
    }

    const rewritten = rewriteUrl(url);
    if (rewritten !== url) {
      console.log(
        `%c⚡ [BackOverrides Extension]%c Rewriting fetch: ${url} -> ${rewritten} (preserving Authorization header)`,
        'color: #00d2ff; font-weight: bold;',
        'color: inherit;'
      );
      if (isRequest) {
        const newReq = new Request(rewritten, input);
        return originalFetch.call(window, newReq, init);
      }
      return originalFetch.call(window, rewritten, init);
    }

    return originalFetch.call(window, input, init);
  };

  // 2. Intercept XMLHttpRequest
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    if (typeof url === 'string') {
      const rewritten = rewriteUrl(url);
      if (rewritten !== url) {
        console.log(
          `%c⚡ [BackOverrides Extension]%c Rewriting XHR: ${url} -> ${rewritten}`,
          'color: #00d2ff; font-weight: bold;',
          'color: inherit;'
        );
        return originalOpen.call(this, method, rewritten, ...rest);
      }
    }
    return originalOpen.call(this, method, url, ...rest);
  };

  window.addEventListener('back-overrides-refresh-rules', () => {
    console.log('%c⚡ [BackOverrides Extension]%c Forcing rules refresh from in-page trigger...', 'color: #00d2ff; font-weight: bold;', 'color: inherit;');
    refreshRules();
  });

  refreshRules();
  setInterval(refreshRules, 5000);
})();

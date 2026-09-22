// BackOverrides In-Page Network Interceptor (Manifest V3 - World: MAIN)
// Runs directly in the web page execution context at document_start.
// Automatically rewrites fetch and XMLHttpRequest endpoints to the local proxy
// BEFORE the browser makes the call, preventing the browser from stripping
// sensitive headers (such as Authorization: Bearer ...) during cross-origin redirects.

(function () {
  let cliUrl = 'http://localhost:8888';
  let targetDomains = [];
  let rules = [];

  const currentHost = (window.location.host || '').toLowerCase();
  const currentHostname = (window.location.hostname || '').toLowerCase();

  function isDomainActive() {
    if (!Array.isArray(targetDomains) || targetDomains.length === 0) {
      return true;
    }
    return targetDomains.some((d) => {
      const clean = d.trim().toLowerCase();
      if (!clean) return false;
      return currentHostname === clean || currentHost === clean || currentHostname.endsWith('.' + clean);
    });
  }

  const originalFetch = window.fetch;
  const originalOpen = XMLHttpRequest.prototype.open;

  async function refreshRules() {
    try {
      const res = await originalFetch(`${cliUrl}/__back-overrides/rules`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const config = await res.json();
        if (config.targetDomains && Array.isArray(config.targetDomains) && config.targetDomains.length > 0) {
          targetDomains = config.targetDomains;
        }
        const remote = (config.remote || '').replace(/\/+$/, '');
        const localCli = `http://localhost:${config.port || 8888}`;
        if (config.overrides && Array.isArray(config.overrides)) {
          const freshRules = [];
          for (const o of config.overrides) {
            const cleanPath = (o.path || '').replace(/\*$/, '');
            if (remote) {
              freshRules.push({
                source: `${remote}${cleanPath}`,
                target: `${localCli}${cleanPath}`,
              });
              if (remote.startsWith('https://')) {
                freshRules.push({
                  source: `${remote.replace(/^https:/, 'http:')}${cleanPath}`,
                  target: `${localCli}${cleanPath}`,
                });
              }
            }
            if (typeof window !== 'undefined' && window.location && window.location.origin) {
              freshRules.push({
                source: `${window.location.origin}${cleanPath}`,
                target: `${localCli}${cleanPath}`,
              });
            }
            freshRules.push({
              source: cleanPath,
              target: `${localCli}${cleanPath}`,
            });
          }
          if (freshRules.length > 0) {
            rules = freshRules;
          }
        }
      }
    } catch {
      // CLI may still be starting up
    }
  }

  function rewriteUrl(urlStr) {
    if (!urlStr || typeof urlStr !== 'string') return urlStr;
    if (rules.length === 0) return urlStr;
    if (!isDomainActive()) return urlStr;
    if (urlStr.includes('/__back-overrides/')) return urlStr;
    if (urlStr.includes('localhost:8888') || urlStr.includes('127.0.0.1:8888')) return urlStr;

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

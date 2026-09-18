// BackOverrides Background Service Worker (Manifest V3)

const DEFAULT_CONFIG = {
  enabled: true,
  cliUrl: 'http://localhost:8888',
  rules: [
    {
      sourceRegex: '^https?:\\/\\/api\\.corporate-cloud\\.io\\/bff\\/core\\/v1(.*)',
      targetPattern: 'http://localhost:8888/bff/core/v1\\1',
      methods: [], // empty = all methods
    },
  ],
};

async function syncDynamicRules() {
  const data = await chrome.storage.local.get(['enabled', 'rules', 'cliUrl']);
  const isEnabled = data.enabled !== undefined ? data.enabled : DEFAULT_CONFIG.enabled;
  const rules = data.rules || DEFAULT_CONFIG.rules;

  // Clear existing dynamic rules
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingRuleIds = existingRules.map((r) => r.id);

  if (!isEnabled || rules.length === 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRuleIds,
      addRules: [],
    });
    console.log('[BackOverrides Extension] Rules disabled.');
    return;
  }

  const newRules = [];
  let ruleIdCounter = 1;

  for (const rule of rules) {
    const redirectRuleId = ruleIdCounter++;
    const corsRuleId = ruleIdCounter++;

    // 1. Redirect Rule - Supports both async calls (xmlhttprequest) and full-page navigations (main_frame)
    newRules.push({
      id: redirectRuleId,
      priority: 1,
      action: {
        type: 'redirect',
        redirect: {
          regexSubstitution: rule.targetPattern,
        },
      },
      condition: {
        regexFilter: rule.sourceRegex,
        resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest', 'other'],
        requestMethods: rule.methods && rule.methods.length > 0 ? rule.methods.map((m) => m.toLowerCase()) : undefined,
      },
    });

    // 2. CORS Response Header Modification
    newRules.push({
      id: corsRuleId,
      priority: 1,
      action: {
        type: 'modifyHeaders',
        responseHeaders: [
          { header: 'access-control-allow-origin', operation: 'set', value: '*' },
          { header: 'access-control-allow-credentials', operation: 'set', value: 'true' },
          {
            header: 'access-control-allow-methods',
            operation: 'set',
            value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD',
          },
          { header: 'access-control-allow-headers', operation: 'set', value: '*' },
        ],
      },
      condition: {
        regexFilter: rule.sourceRegex,
        resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest', 'other'],
      },
    });
  }

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingRuleIds,
    addRules: newRules,
  });

  console.log(`[BackOverrides Extension] Applied ${newRules.length} dynamic redirect & CORS rules (including main_frame).`);
}

async function discoverCliUrl(startPort = 8888, range = 20) {
  const checkPort = async (port) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 350);
    try {
      const res = await fetch(`http://localhost:${port}/__back-overrides/status`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data && (data.status === 'ok' || data.app === 'back-overrides')) {
          return true;
        }
      }
    } catch {
      try {
        const rulesRes = await fetch(`http://localhost:${port}/__back-overrides/rules`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        if (rulesRes.ok) {
          const data = await rulesRes.json().catch(() => null);
          if (data && (typeof data.remote === 'string' || Array.isArray(data.overrides))) {
            return true;
          }
        }
      } catch {
        return false;
      }
    } finally {
      clearTimeout(timeoutId);
    }
    return false;
  };

  if (await checkPort(startPort)) {
    return `http://localhost:${startPort}`;
  }

  for (let offset = 1; offset < range; offset++) {
    const port = startPort + offset;
    if (await checkPort(port)) {
      return `http://localhost:${port}`;
    }
  }

  return null;
}

async function fetchConfigWithFallback(preferredUrl) {
  const targetUrl = (preferredUrl || 'http://localhost:8888').replace(/\/+$/, '');

  // 1. Try preferred URL first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 500);
    const res = await fetch(`${targetUrl}/__back-overrides/rules`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const config = await res.json();
      return { config, cliUrl: targetUrl };
    }
  } catch {
    // Fall through to auto-discovery
  }

  // 2. Discover active port
  const discoveredUrl = await discoverCliUrl(8888, 20);
  if (discoveredUrl) {
    const res = await fetch(`${discoveredUrl}/__back-overrides/rules`);
    if (res.ok) {
      const config = await res.json();
      return { config, cliUrl: discoveredUrl };
    }
  }

  throw new Error('Nenhum servidor BackOverrides ativo encontrado (portas 8888-8908 offline).');
}

function convertRules(config, cliUrl) {
  const remoteUrl = (config.remote || '').replace(/\/+$/, '');
  const targetBase = (cliUrl || 'http://localhost:8888').replace(/\/+$/, '');
  const escapedRemote = remoteUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return (config.overrides || []).map((o) => {
    const cleanPath = (o.path || '').replace(/\*$/, '(.*)');
    const sourceRegex = `^${escapedRemote}${cleanPath}`;
    const targetPattern = `${targetBase}${cleanPath.replace(/\(\.\*\)$/, '\\1')}`;

    return {
      sourceRegex,
      targetPattern,
      methods: o.methods && !o.methods.includes('*') ? o.methods : [],
    };
  });
}

async function autoSyncFromCli(preferredCliUrl) {
  try {
    const stored = await chrome.storage.local.get(['cliUrl']);
    const targetUrl = preferredCliUrl || stored.cliUrl || 'http://localhost:8888';
    const { config, cliUrl } = await fetchConfigWithFallback(targetUrl);
    const convertedRules = convertRules(config, cliUrl);

    if (convertedRules.length > 0 || config) {
      await chrome.storage.local.set({ rules: convertedRules, cliUrl });
      await syncDynamicRules();
      console.log(`[BackOverrides Extension] Auto-synced ${convertedRules.length} rule(s) from CLI at ${cliUrl}.`);
    }
  } catch {
    // CLI is offline or unreachable, keep existing stored rules
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set(DEFAULT_CONFIG, () => {
    syncDynamicRules();
    autoSyncFromCli();
  });
});

chrome.runtime.onStartup?.addListener(() => {
  chrome.storage.local.get(['cliUrl'], (data) => {
    autoSyncFromCli(data.cliUrl || 'http://localhost:8888');
  });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && (changes.enabled || changes.rules)) {
    syncDynamicRules();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SYNC_FROM_CLI') {
    (async () => {
      try {
        const stored = await chrome.storage.local.get(['cliUrl']);
        const preferred = request.cliUrl || stored.cliUrl || 'http://localhost:8888';
        const { config, cliUrl } = await fetchConfigWithFallback(preferred);
        const convertedRules = convertRules(config, cliUrl);

        await chrome.storage.local.set({ rules: convertedRules, cliUrl });
        await syncDynamicRules();

        const urlObj = new URL(cliUrl);
        sendResponse({
          success: true,
          count: convertedRules.length,
          cliUrl,
          port: urlObj.port || '80',
        });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true; // async sendResponse
  }

  if (request.type === 'GET_CLI_STATUS') {
    (async () => {
      try {
        const stored = await chrome.storage.local.get(['cliUrl']);
        const currentUrl = stored.cliUrl || 'http://localhost:8888';
        try {
          const { cliUrl } = await fetchConfigWithFallback(currentUrl);
          const urlObj = new URL(cliUrl);
          sendResponse({ online: true, cliUrl, port: urlObj.port || '80' });
        } catch {
          const urlObj = new URL(currentUrl);
          sendResponse({ online: false, cliUrl: currentUrl, port: urlObj.port || '80' });
        }
      } catch {
        sendResponse({ online: false, cliUrl: 'http://localhost:8888', port: '8888' });
      }
    })();
    return true;
  }
});

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

async function autoSyncFromCli(cliUrl = 'http://localhost:8888') {
  try {
    const res = await fetch(`${cliUrl}/__back-overrides/rules`);
    if (!res.ok) return;
    const config = await res.json();

    const convertedRules = (config.overrides || []).map((o) => {
      const remoteUrl = (config.remote || '').replace(/\/+$/, '');
      const targetBase = (cliUrl || 'http://localhost:8888').replace(/\/+$/, '');

      const escapedRemote = remoteUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const cleanPath = (o.path || '').replace(/\*$/, '(.*)');
      const sourceRegex = `^${escapedRemote}${cleanPath}`;
      const targetPattern = `${targetBase}${cleanPath.replace(/\(\.\*\)$/, '\\1')}`;

      return {
        sourceRegex,
        targetPattern,
        methods: o.methods && !o.methods.includes('*') ? o.methods : [],
      };
    });

    if (convertedRules.length > 0) {
      await chrome.storage.local.set({ rules: convertedRules, cliUrl });
      await syncDynamicRules();
      console.log(`[BackOverrides Extension] Auto-synced ${convertedRules.length} rule(s) from CLI.`);
    }
  } catch {
    // CLI is offline or unreachable on startup, keep existing stored rules
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
  if (area === 'local') {
    syncDynamicRules();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SYNC_FROM_CLI') {
    (async () => {
      try {
        const cliUrl = request.cliUrl || 'http://localhost:8888';
        const res = await fetch(`${cliUrl}/__back-overrides/rules`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const config = await res.json();

        // Convert CLI config to extension rules format
        const convertedRules = (config.overrides || []).map((o) => {
          const remoteUrl = (config.remote || '').replace(/\/+$/, '');
          const targetBase = (cliUrl || 'http://localhost:8888').replace(/\/+$/, '');

          // Escape regex characters in remote URL
          const escapedRemote = remoteUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const cleanPath = (o.path || '').replace(/\*$/, '(.*)');
          const sourceRegex = `^${escapedRemote}${cleanPath}`;
          const targetPattern = `${targetBase}${cleanPath.replace(/\(\.\*\)$/, '\\1')}`;

          return {
            sourceRegex,
            targetPattern,
            methods: o.methods && !o.methods.includes('*') ? o.methods : [],
          };
        });

        await chrome.storage.local.set({ rules: convertedRules, cliUrl });
        await syncDynamicRules();
        sendResponse({ success: true, count: convertedRules.length });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true; // async sendResponse
  }
});

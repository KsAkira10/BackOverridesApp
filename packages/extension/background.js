// BackOverrides Background Service Worker (Manifest V3)

const DEFAULT_CONFIG = {
  enabled: true,
  cliUrl: 'http://localhost:8888',
  targetDomains: [],
  rules: [],
  studioRules: [],
};

let isSyncing = false;
let pendingSync = false;

async function syncDynamicRules() {
  if (isSyncing) {
    pendingSync = true;
    return;
  }
  isSyncing = true;

  try {
    const data = await chrome.storage.local.get(['enabled', 'rules', 'cliUrl', 'targetDomains']);
    const isEnabled = data.enabled !== undefined ? data.enabled : DEFAULT_CONFIG.enabled;
    const rules = data.rules || DEFAULT_CONFIG.rules;

    // Clear existing dynamic rules
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingRuleIds = existingRules.map((r) => r.id);

    if (!isEnabled || rules.length === 0) {
      if (existingRuleIds.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: existingRuleIds,
          addRules: [],
        });
      }
      console.log('[BackOverrides Extension] Rules disabled.');
      return;
    }

    const newRules = [];
    let ruleIdCounter = 1;

    for (const rule of rules) {
      const redirectRuleId = ruleIdCounter++;
      const corsRuleId = ruleIdCounter++;

      // Extract destination domain from source regex to strictly isolate DNR to target API
      let requestDomains = undefined;
      const domainMatch = rule.sourceRegex ? rule.sourceRegex.match(/https?:\\\/\\\/([a-zA-Z0-9.-]+)/) : null;
      if (domainMatch && domainMatch[1]) {
        requestDomains = [domainMatch[1].replace(/\\/g, '')];
      }

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
          requestDomains: requestDomains,
        },
      });

      // 2. CORS Response Header Modification - ensures Private Network Access is allowed without origin collision
      newRules.push({
        id: corsRuleId,
        priority: 1,
        action: {
          type: 'modifyHeaders',
          responseHeaders: [
            { header: 'access-control-allow-private-network', operation: 'set', value: 'true' },
            {
              header: 'access-control-allow-methods',
              operation: 'set',
              value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD',
            },
          ],
        },
        condition: {
          regexFilter: rule.sourceRegex,
          resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest', 'other'],
          requestDomains: requestDomains,
        },
      });
    }

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRuleIds,
      addRules: newRules,
    });

    console.log(`[BackOverrides Extension] Applied ${newRules.length} dynamic redirect & CORS rules (including main_frame).`);
  } catch (err) {
    console.error('[BackOverrides Extension] Erro ao sincronizar regras dinâmicas:', err);
  } finally {
    isSyncing = false;
    if (pendingSync) {
      pendingSync = false;
      syncDynamicRules();
    }
  }
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
  let escapedRemote = remoteUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (escapedRemote.startsWith('https:\\/\\/')) {
    escapedRemote = escapedRemote.replace(/^https:\\\/\\\//, 'https?:\\/\\/');
  } else if (escapedRemote.startsWith('http:\\/\\/')) {
    escapedRemote = escapedRemote.replace(/^http:\\\/\\\//, 'https?:\\/\\/');
  }

  return (config.overrides || []).map((o) => {
    let cleanPath = o.path || '';
    if (cleanPath.endsWith('/*')) {
      cleanPath = cleanPath.slice(0, -2) + '/(.*)';
    } else if (cleanPath.endsWith('*')) {
      cleanPath = cleanPath.slice(0, -1) + '(.*)';
    } else {
      cleanPath = cleanPath + '(.*)';
    }

    const sourceRegex = `^${escapedRemote}${cleanPath}`;
    const targetPattern = `${targetBase}${cleanPath.replace(/\(\.\*\)$/, '\\1')}`;

    return {
      sourceRegex,
      targetPattern,
      methods: o.methods && !o.methods.includes('*') ? o.methods : [],
    };
  });
}

function convertStudioRulesToCliPayload(studioRules, preferredLocal = 'http://localhost:3000', preferredRemote = 'https://api.example.com') {
  const localTarget = preferredLocal || 'http://localhost:3000';
  const remoteTarget = preferredRemote || 'https://api.example.com';

  if (!Array.isArray(studioRules) || studioRules.length === 0) {
    return {
      remote: remoteTarget,
      local: localTarget,
      overrides: [],
    };
  }

  const overrides = studioRules
    .filter((r) => r.enabled !== false)
    .map((r) => {
      let cleanPath = r.source || '';
      try {
        if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
          const u = new URL(cleanPath);
          cleanPath = u.pathname;
        }
      } catch {}
      if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
      if (!cleanPath.endsWith('*')) {
        cleanPath = cleanPath.endsWith('/') ? cleanPath + '*' : cleanPath + '/*';
      }

      return {
        methods: r.methods && r.methods.length > 0 ? r.methods : ['*'],
        path: cleanPath,
        description: r.description || `Override para ${cleanPath}`,
      };
    });

  return {
    remote: remoteTarget,
    local: localTarget,
    overrides,
  };
}

async function pushRulesToCli(preferredCliUrl) {
  const data = await chrome.storage.local.get(['cliUrl', 'studioRules', 'targetDomains']);
  const targetUrl = (preferredCliUrl || data.cliUrl || 'http://localhost:8888').replace(/\/+$/, '');
  const payload = convertStudioRulesToCliPayload(data.studioRules);
  payload.targetDomains = data.targetDomains || DEFAULT_CONFIG.targetDomains;

  const res = await fetch(`${targetUrl}/__back-overrides/rules`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`CLI respondeu com status ${res.status}: ${errorText}`);
  }

  const result = await res.json();
  console.log(`[BackOverrides Extension] Enviadas ${result.count || payload.overrides.length} regra(s) para o CLI em ${targetUrl}.`);
  return result;
}

async function autoSyncFromCli(preferredCliUrl) {
  try {
    const stored = await chrome.storage.local.get(['cliUrl', 'studioRules']);
    const targetUrl = preferredCliUrl || stored.cliUrl || 'http://localhost:8888';
    const { config, cliUrl } = await fetchConfigWithFallback(targetUrl);

    // If CLI in the project has 0 overrides configured, push extension's stored rules to the CLI!
    if (config && Array.isArray(config.overrides) && config.overrides.length === 0) {
      console.log('[BackOverrides Extension] CLI possui 0 regras no projeto. Enviando regras da extensão para o CLI...');
      try {
        await pushRulesToCli(cliUrl);
      } catch (pushErr) {
        console.warn('[BackOverrides Extension] Não foi possível enviar regras ao CLI:', pushErr.message);
      }
    }

    const convertedRules = convertRules(config, cliUrl);

    if (convertedRules.length > 0 || config) {
      await chrome.storage.local.set({ rules: convertedRules, cliUrl });
      console.log(`[BackOverrides Extension] Auto-synced ${convertedRules.length} rule(s) from CLI at ${cliUrl}.`);
    }
  } catch (err) {
    // CLI is offline or unreachable, keep existing stored rules
    console.warn('[BackOverrides Extension] Auto-sync skipped (CLI unreachable):', err.message);
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  try {
    const data = await chrome.storage.local.get(['rules', 'studioRules', 'targetDomains']);
    const updates = {};
    if (!data.rules) updates.rules = DEFAULT_CONFIG.rules;
    if (!data.studioRules) updates.studioRules = DEFAULT_CONFIG.studioRules;
    if (!data.targetDomains) updates.targetDomains = DEFAULT_CONFIG.targetDomains;
    if (Object.keys(updates).length > 0) {
      await chrome.storage.local.set(updates);
    }
    await autoSyncFromCli();
  } catch (err) {
    console.error('[BackOverrides Extension] Error onInstalled:', err);
  }
});

chrome.runtime.onStartup?.addListener(() => {
  chrome.storage.local.get(['cliUrl'], (data) => {
    autoSyncFromCli(data.cliUrl || 'http://localhost:8888');
  });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && (changes.enabled || changes.rules || changes.targetDomains)) {
    syncDynamicRules();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'PUSH_RULES_TO_CLI') {
    (async () => {
      try {
        const stored = await chrome.storage.local.get(['cliUrl']);
        const targetUrl = request.cliUrl || stored.cliUrl || 'http://localhost:8888';
        const result = await pushRulesToCli(targetUrl);
        await syncDynamicRules();
        sendResponse({
          success: true,
          count: result.count !== undefined ? result.count : (result.config?.overrides?.length || 0),
          config: result.config,
        });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true; // async sendResponse
  }

  if (request.type === 'GET_TARGET_DOMAINS') {
    (async () => {
      const data = await chrome.storage.local.get(['targetDomains']);
      sendResponse({ targetDomains: data.targetDomains || DEFAULT_CONFIG.targetDomains });
    })();
    return true;
  }

  if (request.type === 'TOGGLE_TARGET_DOMAIN') {
    (async () => {
      try {
        const domain = (request.domain || '').trim().toLowerCase();
        if (!domain) {
          sendResponse({ success: false, error: 'Domínio inválido' });
          return;
        }
        const data = await chrome.storage.local.get(['targetDomains']);
        let current = data.targetDomains || [...DEFAULT_CONFIG.targetDomains];
        const exists = current.some((d) => d.toLowerCase() === domain);
        if (exists) {
          current = current.filter((d) => d.toLowerCase() !== domain);
        } else {
          current.push(domain);
        }
        await chrome.storage.local.set({ targetDomains: current });
        await syncDynamicRules();
        sendResponse({ success: true, active: !exists, targetDomains: current });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

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

  if (request.type === 'RELOAD_EXTENSION') {
    sendResponse({ success: true, message: 'Extensão recarregando...' });
    setTimeout(() => {
      chrome.runtime.reload();
    }, 150);
    return true;
  }

  if (request.type === 'RELOAD_ACTIVE_TAB') {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      const target = tabs && tabs[0] ? tabs[0] : null;
      if (target && target.id) {
        chrome.tabs.reload(target.id, { bypassCache: true }, () => {
          sendResponse({ success: true, tabId: target.id, url: target.url });
        });
      } else {
        chrome.tabs.query({ active: true }, (anyTabs) => {
          if (anyTabs && anyTabs[0] && anyTabs[0].id) {
            chrome.tabs.reload(anyTabs[0].id, { bypassCache: true }, () => {
              sendResponse({ success: true, tabId: anyTabs[0].id });
            });
          } else {
            sendResponse({ success: false, error: 'Nenhuma aba ativa encontrada.' });
          }
        });
      }
    });
    return true;
  }

  if (request.type === 'RELOAD_BOTH') {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      const activeTabId = tabs && tabs[0] ? tabs[0].id : null;
      if (activeTabId) {
        chrome.tabs.reload(activeTabId, { bypassCache: true });
      }
      sendResponse({ success: true, tabReloaded: !!activeTabId });
      setTimeout(() => {
        chrome.runtime.reload();
      }, 150);
    });
    return true;
  }
});

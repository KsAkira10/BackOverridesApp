/**
 * BackOverrides Studio - Options & Content Script Generator Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Elements - Header & Status
  const cliStatusDot = document.getElementById('cli-status-dot');
  const cliStatusText = document.getElementById('cli-status-text');
  const btnSyncCli = document.getElementById('btn-sync-cli');
  const btnReloadTab = document.getElementById('btn-reload-tab');
  const btnReloadExt = document.getElementById('btn-reload-ext');

  // Elements - Form & Rules
  const ruleForm = document.getElementById('rule-form');
  const inputSource = document.getElementById('rule-source');
  const inputTarget = document.getElementById('rule-target');
  const inputDesc = document.getElementById('rule-desc');
  const methodsSelector = document.getElementById('methods-selector');
  const btnResetForm = document.getElementById('btn-reset-form');
  const btnSubmitRule = document.getElementById('btn-submit-rule');
  const rulesListContainer = document.getElementById('rules-list-container');
  const rulesCountBadge = document.getElementById('rules-count-badge');
  const btnImportCli = document.getElementById('btn-import-cli');
  const btnClearAllRules = document.getElementById('btn-clear-all-rules');
  const presetChips = document.querySelectorAll('.preset-chip');

  // Elements - Generator & Code Box
  const optCliUrl = document.getElementById('opt-cli-url');
  const optEmbedRules = document.getElementById('opt-embed-rules');
  const optAutoPolling = document.getElementById('opt-auto-polling');
  const optDebugLogs = document.getElementById('opt-debug-logs');
  const codeOutput = document.getElementById('code-output');
  const btnCopyCode = document.getElementById('btn-copy-code');
  const btnDownloadCode = document.getElementById('btn-download-code');
  const btnSaveStorage = document.getElementById('btn-save-storage');
  const toastContainer = document.getElementById('toast-container');

  // Application State
  let rules = [];
  let selectedMethods = ['*'];
  let editingRuleId = null;

  const DEFAULT_RULES = [
    {
      id: 'default-oauth',
      source: 'https://api.corporate-cloud.io/bff/core/v1/oauth2/',
      target: 'http://localhost:8888/bff/core/v1/oauth2/',
      methods: ['*'],
      description: 'Redireciona todo o fluxo OAuth2 para o proxy local',
      enabled: true,
    },
    {
      id: 'default-logout',
      source: 'https://api.corporate-cloud.io/bff/core/v1/logout',
      target: 'http://localhost:8888/bff/core/v1/logout',
      methods: ['*'],
      description: 'Redireciona logout dedicado para o proxy local',
      enabled: true,
    },
  ];

  // Initialize
  await loadStoredState();
  checkCliStatus();
  setInterval(checkCliStatus, 5000);
  updateCodePreview();

  // 1. Method Selector Handling
  methodsSelector.addEventListener('click', (e) => {
    const btn = e.target.closest('.method-btn');
    if (!btn) return;

    const method = btn.dataset.method;
    if (method === '*') {
      selectedMethods = ['*'];
    } else {
      selectedMethods = selectedMethods.filter((m) => m !== '*');
      if (selectedMethods.includes(method)) {
        selectedMethods = selectedMethods.filter((m) => m !== method);
      } else {
        selectedMethods.push(method);
      }
      if (selectedMethods.length === 0) {
        selectedMethods = ['*'];
      }
    }
    renderMethodButtons();
  });

  function renderMethodButtons() {
    const buttons = methodsSelector.querySelectorAll('.method-btn');
    buttons.forEach((btn) => {
      const m = btn.dataset.method;
      if (selectedMethods.includes(m)) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });
  }

  // 2. Presets
  presetChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const preset = chip.dataset.preset;
      const baseCli = optCliUrl.value.trim() || 'http://localhost:8888';

      if (preset === 'oauth') {
        inputSource.value = 'https://api.corporate-cloud.io/bff/core/v1/oauth2/';
        inputTarget.value = `${baseCli}/bff/core/v1/oauth2/`;
        inputDesc.value = 'Redireciona login, autorização e refresh OAuth';
        selectedMethods = ['*'];
      } else if (preset === 'logout') {
        inputSource.value = 'https://api.corporate-cloud.io/bff/core/v1/logout';
        inputTarget.value = `${baseCli}/bff/core/v1/logout`;
        inputDesc.value = 'Redireciona encerramento de sessão para o BFF local';
        selectedMethods = ['*'];
      } else if (preset === 'mfe') {
        inputSource.value = 'https://api.corporate-cloud.io/mfe/profile/';
        inputTarget.value = `${baseCli}/mfe/profile/`;
        inputDesc.value = 'Mock local de Microfrontend / API de Perfil';
        selectedMethods = ['GET', 'POST'];
      }
      renderMethodButtons();
      showToast('Preset aplicado ao formulário!');
    });
  });

  // 3. Form Submit (Add / Edit Rule)
  ruleForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const source = inputSource.value.trim();
    const target = inputTarget.value.trim();
    const desc = inputDesc.value.trim();

    if (!source || !target) {
      showToast('Preencha os campos de Origem e Destino.', 'error');
      return;
    }

    if (editingRuleId) {
      rules = rules.map((r) =>
        r.id === editingRuleId
          ? { ...r, source, target, description: desc, methods: [...selectedMethods] }
          : r
      );
      editingRuleId = null;
      btnSubmitRule.innerHTML = '<span>➕</span> Adicionar Regra';
      showToast('Regra atualizada com sucesso!');
    } else {
      const newRule = {
        id: 'rule-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        source,
        target,
        description: desc,
        methods: [...selectedMethods],
        enabled: true,
      };
      rules.unshift(newRule);
      showToast('Nova regra adicionada!');
    }

    resetForm();
    renderRules();
    updateCodePreview();
  });

  btnResetForm.addEventListener('click', () => {
    resetForm();
  });

  function resetForm() {
    inputSource.value = '';
    inputTarget.value = '';
    inputDesc.value = '';
    selectedMethods = ['*'];
    editingRuleId = null;
    btnSubmitRule.innerHTML = '<span>➕</span> Adicionar Regra';
    renderMethodButtons();
  }

  // 4. Render Rules List
  function renderRules() {
    rulesCountBadge.textContent = rules.length;

    if (rules.length === 0) {
      rulesListContainer.innerHTML = `
        <div class="empty-rules">
          Nenhuma regra adicionada ainda.<br>Preencha o formulário acima ou clique em "Importar CLI".
        </div>
      `;
      return;
    }

    rulesListContainer.innerHTML = rules
      .map((r) => {
        const methodsBadge = r.methods.includes('*')
          ? '<span class="method-tag">TODOS (*)</span>'
          : r.methods.map((m) => `<span class="method-tag">${m}</span>`).join('');

        return `
        <div class="rule-card ${r.enabled ? '' : 'disabled'}" data-id="${r.id}">
          <div class="rule-card-header">
            <div class="rule-methods">${methodsBadge}</div>
            <div class="rule-actions">
              <label class="switch" style="width: 32px; height: 18px;" title="${r.enabled ? 'Desativar Regra' : 'Ativar Regra'}">
                <input type="checkbox" class="rule-toggle-enable" ${r.enabled ? 'checked' : ''}>
                <span class="slider" style="border-radius: 18px;"></span>
              </label>
              <button class="icon-btn btn-edit-rule" title="Editar Regra">✏️</button>
              <button class="icon-btn danger btn-delete-rule" title="Excluir Regra">🗑️</button>
            </div>
          </div>
          <div class="rule-flow">
            <div class="flow-item">
              <span class="flow-label source">DE</span>
              <span class="flow-val">${escapeHtml(r.source)}</span>
            </div>
            <div class="flow-item">
              <span class="flow-label target">PARA</span>
              <span class="flow-val target-val">${escapeHtml(r.target)}</span>
            </div>
            ${r.description ? `<div style="font-size: 11px; color: #64748b; margin-top: 4px;">📝 ${escapeHtml(r.description)}</div>` : ''}
          </div>
        </div>
      `;
      })
      .join('');

    // Attach row events
    rulesListContainer.querySelectorAll('.rule-card').forEach((card) => {
      const id = card.dataset.id;
      const rule = rules.find((item) => item.id === id);

      card.querySelector('.rule-toggle-enable')?.addEventListener('change', (e) => {
        if (rule) {
          rule.enabled = e.target.checked;
          renderRules();
          updateCodePreview();
        }
      });

      card.querySelector('.btn-edit-rule')?.addEventListener('click', () => {
        if (rule) {
          editingRuleId = rule.id;
          inputSource.value = rule.source;
          inputTarget.value = rule.target;
          inputDesc.value = rule.description || '';
          selectedMethods = [...rule.methods];
          renderMethodButtons();
          btnSubmitRule.innerHTML = '<span>💾</span> Salvar Alterações';
          inputSource.focus();
        }
      });

      card.querySelector('.btn-delete-rule')?.addEventListener('click', () => {
        if (confirm('Deseja excluir esta regra?')) {
          rules = rules.filter((item) => item.id !== id);
          if (editingRuleId === id) resetForm();
          renderRules();
          updateCodePreview();
          showToast('Regra excluída.');
        }
      });
    });
  }

  // Clear all rules
  btnClearAllRules.addEventListener('click', () => {
    if (rules.length === 0) return;
    if (confirm('Deseja remover todas as regras cadastradas?')) {
      rules = [];
      resetForm();
      renderRules();
      updateCodePreview();
      showToast('Todas as regras foram removidas.');
    }
  });

  // Import from CLI
  btnImportCli.addEventListener('click', () => {
    importRulesFromCli();
  });
  btnSyncCli.addEventListener('click', () => {
    importRulesFromCli();
  });

  async function importRulesFromCli() {
    const cliUrl = optCliUrl.value.trim() || 'http://localhost:8888';
    showToast('Consultando proxy BackOverrides...');

    try {
      const res = await fetch(`${cliUrl}/__back-overrides/rules`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const config = await res.json();

      const remote = (config.remote || '').replace(/\/+$/, '');
      const localCli = `http://localhost:${config.port || 8888}`;

      if (config.overrides && Array.isArray(config.overrides)) {
        const imported = config.overrides.map((o, idx) => {
          const cleanPath = (o.path || '').replace(/\*$/, '');
          return {
            id: 'imported-' + idx + '-' + Date.now(),
            source: `${remote}${cleanPath}`,
            target: `${localCli}${cleanPath}`,
            methods: o.methods && o.methods.length > 0 ? o.methods : ['*'],
            description: o.description || `Regra importada do back-overrides.json (${o.path})`,
            enabled: true,
          };
        });

        if (imported.length > 0) {
          rules = imported;
          renderRules();
          updateCodePreview();
          showToast(`Sucesso! ${imported.length} regra(s) importada(s) do CLI.`);
          checkCliStatus();
          return;
        }
      }
      showToast('Nenhuma regra configurada encontrada no CLI.', 'warning');
    } catch (err) {
      showToast(`Falha ao conectar com ${cliUrl}: ${err.message}`, 'error');
    }
  }

  // 5. Code Generator Engine
  function generateContentScriptCode() {
    const cliUrl = optCliUrl.value.trim() || 'http://localhost:8888';
    const embedRules = optEmbedRules.checked;
    const autoPolling = optAutoPolling.checked;
    const debugLogs = optDebugLogs.checked;

    const activeRules = rules.filter((r) => r.enabled);

    let rulesArrayJs = '[]';
    if (embedRules && activeRules.length > 0) {
      const formatted = activeRules
        .map((r) => {
          return `    {\n      source: '${escapeJsString(r.source)}',\n      target: '${escapeJsString(r.target)}',\n    }`;
        })
        .join(',\n');
      rulesArrayJs = `[\n${formatted},\n  ]`;
    }

    return `// BackOverrides In-Page Network Interceptor (Manifest V3 - World: MAIN)
// Generated by BackOverrides Studio
// Automatically rewrites fetch and XMLHttpRequest endpoints to the local proxy
// BEFORE the browser makes the call, preventing the browser from stripping
// sensitive headers (such as Authorization: Bearer ...) during cross-origin redirects.

(function () {
  let cliUrl = '${escapeJsString(cliUrl)}';
  let rules = ${rulesArrayJs};

  const originalFetch = window.fetch;
  const originalOpen = XMLHttpRequest.prototype.open;

  async function refreshRules() {
    try {
      const res = await originalFetch(\`\${cliUrl}/__back-overrides/rules\`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const config = await res.json();
        const remote = (config.remote || '').replace(/\\/+$/, '');
        const localCli = \`http://localhost:\${config.port || 8888}\`;
        if (config.overrides && Array.isArray(config.overrides)) {
          rules = config.overrides.map((o) => {
            const cleanPath = (o.path || '').replace(/\\*$/, '');
            return {
              source: \`\${remote}\${cleanPath}\`,
              target: \`\${localCli}\${cleanPath}\`,
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
${
  debugLogs
    ? `      console.log(
        \`%c⚡ [BackOverrides Extension]%c Rewriting fetch: \${url} -> \${rewritten} (preserving Authorization header)\`,
        'color: #00d2ff; font-weight: bold;',
        'color: inherit;'
      );`
    : ''
}
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
${
  debugLogs
    ? `        console.log(
          \`%c⚡ [BackOverrides Extension]%c Rewriting XHR: \${url} -> \${rewritten}\`,
          'color: #00d2ff; font-weight: bold;',
          'color: inherit;'
        );`
    : ''
}
        return originalOpen.call(this, method, rewritten, ...rest);
      }
    }
    return originalOpen.call(this, method, url, ...rest);
  };

  window.addEventListener('back-overrides-refresh-rules', () => {
    refreshRules();
  });

  refreshRules();
${autoPolling ? '  setInterval(refreshRules, 5000);' : '  // Polling desativado'}
})();
`;
  }

  function updateCodePreview() {
    codeOutput.textContent = generateContentScriptCode();
  }

  // React to generator toggles
  [optCliUrl, optEmbedRules, optAutoPolling, optDebugLogs].forEach((el) => {
    el.addEventListener('input', updateCodePreview);
    el.addEventListener('change', updateCodePreview);
  });

  // 6. Copy Code Button
  btnCopyCode.addEventListener('click', async () => {
    const code = generateContentScriptCode();
    try {
      await navigator.clipboard.writeText(code);
      btnCopyCode.textContent = '✅ Copiado!';
      showToast('Código copiado para a área de transferência!');
      setTimeout(() => {
        btnCopyCode.textContent = '📋 Copiar';
      }, 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('Código copiado!');
    }
  });

  // 7. Download File Button
  btnDownloadCode.addEventListener('click', () => {
    const code = generateContentScriptCode();
    const blob = new Blob([code], { type: 'application/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'content-script.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Download de content-script.js iniciado!');
  });

  // 8. Save to Extension Storage
  btnSaveStorage.addEventListener('click', async () => {
    try {
      // Convert our rules to declarativeNetRequest / background format
      const convertedRules = rules
        .filter((r) => r.enabled)
        .map((r) => {
          const escapedSource = r.source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return {
            sourceRegex: `^${escapedSource}(.*)`,
            targetPattern: `${r.target}\\1`,
            methods: r.methods.includes('*') ? [] : r.methods,
          };
        });

      await chrome.storage.local.set({
        rules: convertedRules,
        cliUrl: optCliUrl.value.trim() || 'http://localhost:8888',
        studioRules: rules,
      });

      showToast('Regras salvas na extensão com sucesso!', 'success');
    } catch (err) {
      showToast(`Erro ao salvar no storage: ${err.message}`, 'error');
    }
  });

  // 9. RELOAD BUTTONS (The core requirement)
  // Button: Reload Extension
  btnReloadExt.addEventListener('click', () => {
    showToast('⚡ Recarregando extensão...', 'success');
    chrome.runtime.sendMessage({ type: 'RELOAD_EXTENSION' }, () => {
      // Fallback direct invocation
      if (chrome.runtime.reload) {
        chrome.runtime.reload();
      }
    });
  });

  // Button: Reload Active Web Tab
  btnReloadTab.addEventListener('click', () => {
    showToast('🔄 Recarregando aba ativa...');
    chrome.runtime.sendMessage({ type: 'RELOAD_ACTIVE_TAB' }, (res) => {
      if (res && res.success) {
        showToast('Aba recarregada com sucesso!', 'success');
      } else {
        // Direct query fallback
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
          if (tabs && tabs[0] && tabs[0].id) {
            chrome.tabs.reload(tabs[0].id, { bypassCache: true }, () => {
              showToast('Aba recarregada!', 'success');
            });
          } else {
            showToast('Nenhuma aba ativa encontrada.', 'warning');
          }
        });
      }
    });
  });

  // 10. CLI Live Status Checker
  async function checkCliStatus() {
    const targetUrl = optCliUrl.value.trim() || 'http://localhost:8888';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 800);
      const res = await fetch(`${targetUrl}/__back-overrides/status`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        cliStatusDot.className = 'status-dot online';
        cliStatusText.textContent = `CLI: ${targetUrl.replace(/^https?:\/\//, '')} (Online)`;
        return;
      }
    } catch {
      // Offline
    }

    cliStatusDot.className = 'status-dot offline';
    cliStatusText.textContent = `CLI: ${targetUrl.replace(/^https?:\/\//, '')} (Offline)`;
  }

  // Storage Persistence Loader
  async function loadStoredState() {
    try {
      const data = await chrome.storage.local.get(['studioRules', 'cliUrl']);
      if (data.cliUrl) {
        optCliUrl.value = data.cliUrl;
      }
      if (data.studioRules && Array.isArray(data.studioRules) && data.studioRules.length > 0) {
        rules = data.studioRules;
      } else {
        rules = [...DEFAULT_RULES];
      }
    } catch {
      rules = [...DEFAULT_RULES];
    }
    renderRules();
  }

  // Toast System
  function showToast(message, type = '') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3200);
  }

  function escapeHtml(str) {
    return (str || '').replace(
      /[&<>"']/g,
      (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]
    );
  }

  function escapeJsString(str) {
    return (str || '').replace(/'/g, "\\'");
  }
});

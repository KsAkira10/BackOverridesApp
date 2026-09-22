document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.getElementById('toggle-active');
  const rulesContainer = document.getElementById('rules-container');
  const btnSync = document.getElementById('btn-sync');
  const statusMsg = document.getElementById('status-msg');
  const portDot = document.getElementById('port-dot');
  const portText = document.getElementById('port-text');
  const offlineCard = document.getElementById('cli-offline-card');
  const cmdPillsContainer = document.getElementById('cmd-pills');
  const cmdCodeDisplay = document.getElementById('cmd-code-display');
  const btnCopyCmd = document.getElementById('btn-copy-cmd');

  const COMMAND_PRESETS = {
    npx: 'npx @back-overrides/cli',
    npm: 'npm start',
    pnpm: 'pnpm dlx @back-overrides/cli',
    bun: 'bunx @back-overrides/cli',
  };

  // Load state
  const data = await chrome.storage.local.get([
    'enabled',
    'rules',
    'cliUrl',
    'cliCmdPreset',
    'customCliCmd',
  ]);

  toggle.checked = data.enabled !== undefined ? data.enabled : true;
  renderRules(data.rules || []);
  updatePortDisplay(data.cliUrl || 'http://localhost:8888', true);

  // Setup command preset & display
  const activePreset = data.cliCmdPreset && COMMAND_PRESETS[data.cliCmdPreset] ? data.cliCmdPreset : 'npx';
  if (cmdCodeDisplay) {
    if (data.cliCmdPreset === 'custom' && data.customCliCmd) {
      cmdCodeDisplay.textContent = data.customCliCmd;
    } else {
      cmdCodeDisplay.textContent = COMMAND_PRESETS[activePreset];
    }
  }

  if (cmdPillsContainer) {
    cmdPillsContainer.querySelectorAll('.cmd-pill').forEach((btn) => {
      if (btn.dataset.cmd === activePreset) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    cmdPillsContainer.addEventListener('click', async (e) => {
      const btn = e.target.closest('.cmd-pill');
      if (!btn) return;
      const key = btn.dataset.cmd;
      if (COMMAND_PRESETS[key]) {
        cmdPillsContainer.querySelectorAll('.cmd-pill').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        cmdCodeDisplay.textContent = COMMAND_PRESETS[key];
        await chrome.storage.local.set({ cliCmdPreset: key });
      }
    });
  }

  // Copy command to clipboard
  btnCopyCmd?.addEventListener('click', async () => {
    const cmd = cmdCodeDisplay ? cmdCodeDisplay.textContent.trim() : 'npx @back-overrides/cli';
    try {
      await navigator.clipboard.writeText(cmd);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = cmd;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }

    btnCopyCmd.textContent = '✅ Copiado!';
    btnCopyCmd.classList.add('copied');
    showStatus('Comando copiado! Cole e execute no terminal.', 'success');

    setTimeout(() => {
      btnCopyCmd.textContent = '📋 Copiar';
      btnCopyCmd.classList.remove('copied');
    }, 2000);
  });

  // Reative polling state
  let lastOnlineState = null;

  function checkLiveCli(isInitial = false) {
    chrome.runtime.sendMessage({ type: 'GET_CLI_STATUS' }, (res) => {
      if (chrome.runtime.lastError) {
        return;
      }
      if (!res) return;

      const isOnline = !!res.online;
      updatePortDisplay(res.cliUrl, isOnline);

      if (isOnline) {
        offlineCard?.classList.add('hidden');

        // Detected transition: offline -> online!
        if (lastOnlineState === false) {
          showStatus('🎉 CLI detectado! Sincronizando regras...', 'success');
          chrome.runtime.sendMessage({ type: 'SYNC_FROM_CLI' }, (syncRes) => {
            if (syncRes && syncRes.success) {
              updatePortDisplay(syncRes.cliUrl, true);
              showStatus(`🎉 Conectado na porta ${syncRes.port}! (${syncRes.count} regras)`, 'success');
              chrome.storage.local.get(['rules'], (r) => {
                renderRules(r.rules || []);
              });
            }
          });
        }
      } else {
        offlineCard?.classList.remove('hidden');
      }

      lastOnlineState = isOnline;
    });
  }

  // Initial check & continuous 2s polling while popup is open
  checkLiveCli(true);
  const pollInterval = setInterval(() => checkLiveCli(false), 2000);
  window.addEventListener('unload', () => clearInterval(pollInterval));

  toggle.addEventListener('change', async () => {
    await chrome.storage.local.set({ enabled: toggle.checked });
    showStatus(toggle.checked ? 'Overrides ativados!' : 'Overrides desativados.', 'success');
  });

  const btnReloadExt = document.getElementById('btn-reload-ext');
  const btnReloadTab = document.getElementById('btn-reload-tab');
  const btnOpenOptions = document.getElementById('btn-open-options');

  btnReloadExt?.addEventListener('click', () => {
    showStatus('⚡ Recarregando extensão...', 'success');
    chrome.runtime.sendMessage({ type: 'RELOAD_EXTENSION' }, () => {
      if (chrome.runtime.reload) chrome.runtime.reload();
    });
  });

  btnReloadTab?.addEventListener('click', () => {
    showStatus('🔄 Recarregando aba...', 'success');
    chrome.runtime.sendMessage({ type: 'RELOAD_ACTIVE_TAB' }, (res) => {
      if (res && res.success) {
        showStatus('Aba recarregada!', 'success');
      } else {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
          if (tabs && tabs[0] && tabs[0].id) {
            chrome.tabs.reload(tabs[0].id, { bypassCache: true }, () => {
              showStatus('Aba recarregada!', 'success');
            });
          }
        });
      }
    });
  });

  btnOpenOptions?.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  });

  btnSync.addEventListener('click', () => {
    showStatus('Buscando proxy BackOverrides...', '');
    chrome.runtime.sendMessage({ type: 'SYNC_FROM_CLI' }, (response) => {
      if (chrome.runtime.lastError) {
        updatePortDisplay(data.cliUrl || 'http://localhost:8888', false);
        offlineCard?.classList.remove('hidden');
        showStatus(`Erro: ${chrome.runtime.lastError.message}`, 'error');
        return;
      }
      if (response && response.success) {
        updatePortDisplay(response.cliUrl, true);
        offlineCard?.classList.add('hidden');
        lastOnlineState = true;
        showStatus(`Sincronizado na porta ${response.port}! (${response.count} regras)`, 'success');
        chrome.storage.local.get(['rules'], (res) => {
          renderRules(res.rules || []);
        });
      } else {
        updatePortDisplay(data.cliUrl || 'http://localhost:8888', false);
        offlineCard?.classList.remove('hidden');
        lastOnlineState = false;
        showStatus(`Erro: ${response?.error || 'CLI offline'}`, 'error');
      }
    });
  });

  function updatePortDisplay(cliUrl, online) {
    try {
      const url = new URL(cliUrl);
      const hostPort = `${url.hostname}:${url.port || (url.protocol === 'https:' ? '443' : '80')}`;
      portText.textContent = online ? `CLI: ${hostPort} (Ativo)` : `CLI: ${hostPort} (Offline)`;
      if (portDot) {
        portDot.className = online ? 'badge-dot' : 'badge-dot offline';
      }
      btnSync.textContent = `🔄 Sincronizar (${hostPort})`;
    } catch {
      portText.textContent = `CLI: ${cliUrl}`;
    }
  }

  function renderRules(rules) {
    if (!rules || rules.length === 0) {
      rulesContainer.innerHTML = '<div style="color: #64748b;">Nenhuma regra ativa. Clique em Sincronizar.</div>';
      return;
    }

    rulesContainer.innerHTML = rules
      .map(
        (r, i) => `
        <div class="rule-item">
          <div class="rule-source">De: ${escapeHtml(r.sourceRegex)}</div>
          <div class="rule-target">Para: ${escapeHtml(r.targetPattern)}</div>
        </div>
      `
      )
      .join('');
  }

  function showStatus(text, type) {
    statusMsg.textContent = text;
    statusMsg.className = `status ${type}`;
    if (type === 'success') {
      setTimeout(() => {
        statusMsg.textContent = '';
      }, 3500);
    }
  }

  function escapeHtml(str) {
    return (str || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
  }
});


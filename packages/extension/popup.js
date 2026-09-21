document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.getElementById('toggle-active');
  const rulesContainer = document.getElementById('rules-container');
  const btnSync = document.getElementById('btn-sync');
  const statusMsg = document.getElementById('status-msg');
  const portDot = document.getElementById('port-dot');
  const portText = document.getElementById('port-text');

  // Load state
  const data = await chrome.storage.local.get(['enabled', 'rules', 'cliUrl']);
  toggle.checked = data.enabled !== undefined ? data.enabled : true;
  renderRules(data.rules || []);
  updatePortDisplay(data.cliUrl || 'http://localhost:8888', true);

  // Check live status on popup open
  chrome.runtime.sendMessage({ type: 'GET_CLI_STATUS' }, (res) => {
    if (chrome.runtime.lastError) {
      // Worker acordando ou sem listener no momento
      return;
    }
    if (res) {
      updatePortDisplay(res.cliUrl, res.online);
    }
  });

  toggle.addEventListener('change', async () => {
    await chrome.storage.local.set({ enabled: toggle.checked });
    showStatus(toggle.checked ? 'Overrides ativados!' : 'Overrides desativados.', 'success');
  });

  btnSync.addEventListener('click', () => {
    showStatus('Buscando proxy BackOverrides...', '');
    chrome.runtime.sendMessage({ type: 'SYNC_FROM_CLI' }, (response) => {
      if (chrome.runtime.lastError) {
        updatePortDisplay(data.cliUrl || 'http://localhost:8888', false);
        showStatus(`Erro: ${chrome.runtime.lastError.message}`, 'error');
        return;
      }
      if (response && response.success) {
        updatePortDisplay(response.cliUrl, true);
        showStatus(`Sincronizado na porta ${response.port}! (${response.count} regras)`, 'success');
        chrome.storage.local.get(['rules'], (res) => {
          renderRules(res.rules || []);
        });
      } else {
        updatePortDisplay(data.cliUrl || 'http://localhost:8888', false);
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


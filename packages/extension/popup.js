document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.getElementById('toggle-active');
  const rulesContainer = document.getElementById('rules-container');
  const btnSync = document.getElementById('btn-sync');
  const statusMsg = document.getElementById('status-msg');

  // Load state
  const data = await chrome.storage.local.get(['enabled', 'rules', 'cliUrl']);
  toggle.checked = data.enabled !== undefined ? data.enabled : true;
  renderRules(data.rules || []);

  toggle.addEventListener('change', async () => {
    await chrome.storage.local.set({ enabled: toggle.checked });
    showStatus(toggle.checked ? 'Overrides ativados!' : 'Overrides desativados.', 'success');
  });

  btnSync.addEventListener('click', () => {
    showStatus('Sincronizando com CLI...', '');
    chrome.runtime.sendMessage({ type: 'SYNC_FROM_CLI' }, (response) => {
      if (response && response.success) {
        showStatus(`Sincronizado! ${response.count} regra(s) atualizadas.`, 'success');
        chrome.storage.local.get(['rules'], (res) => {
          renderRules(res.rules || []);
        });
      } else {
        showStatus(`Erro ao conectar: ${response?.error || 'CLI offline'}`, 'error');
      }
    });
  });

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
      }, 3000);
    }
  }

  function escapeHtml(str) {
    return (str || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
  }
});

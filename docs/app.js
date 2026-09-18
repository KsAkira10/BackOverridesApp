// BackOverrides Documentation & Interactive Playground
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initCopyButtons();
  initPlayground();
  initScrollSpy();
});

// 1. Tab Switching Functionality
function initTabs() {
  document.querySelectorAll('.tabs-container').forEach((container) => {
    const navButtons = container.querySelectorAll('.tab-btn');
    const contentPanels = container.querySelectorAll('.tab-content');

    navButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-tab');

        navButtons.forEach((b) => b.classList.remove('active'));
        contentPanels.forEach((p) => p.classList.remove('active'));

        btn.classList.add('active');
        const activePanel = container.querySelector(`#${targetId}`);
        if (activePanel) activePanel.classList.add('active');
      });
    });
  });
}

// 2. Copy Code to Clipboard
function initCopyButtons() {
  document.querySelectorAll('.code-copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const targetId = btn.getAttribute('data-target');
      let textToCopy = '';

      if (targetId) {
        const targetEl = document.getElementById(targetId);
        textToCopy = targetEl ? targetEl.innerText : '';
      } else {
        const pre = btn.closest('.code-box')?.querySelector('pre');
        textToCopy = pre ? pre.innerText : '';
      }

      try {
        await navigator.clipboard.writeText(textToCopy);
        const originalText = btn.innerHTML;
        btn.innerHTML = '✓ Copiado!';
        btn.style.borderColor = 'var(--accent-emerald)';
        btn.style.color = 'var(--accent-emerald)';

        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.borderColor = '';
          btn.style.color = '';
        }, 2000);
      } catch (err) {
        console.error('Falha ao copiar:', err);
      }
    });
  });
}

// 3. Interactive Playground Simulator
function initPlayground() {
  const endpointSelect = document.getElementById('playground-endpoint');
  const modeSelect = document.getElementById('playground-mode');
  const btnExecute = document.getElementById('btn-playground-run');

  const nodeClient = document.getElementById('node-client');
  const nodeInterceptor = document.getElementById('node-interceptor');
  const nodeDestination = document.getElementById('node-destination');
  const consoleOutput = document.getElementById('playground-output');
  const consoleMeta = document.getElementById('playground-meta');

  if (!btnExecute) return;

  const SIMULATED_DATA = {
    '/bff/core/v1/session': {
      method: 'GET',
      isOAuthPage: false,
      remoteResponse: {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': 'https://portal.corporate-cloud.io',
          'access-control-allow-credentials': 'true',
        },
        body: {
          user: 'Jane Doe',
          email: 'jane.doe@enterprise.corp',
          role: 'Standard User',
          cluster: 'Cloud Production (us-east-1)',
        },
      },
      localResponse: null, // this route stays on cloud
    },
    '/bff/core/v1/catalog': {
      method: 'GET',
      isOAuthPage: false,
      remoteResponse: {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': 'https://portal.corporate-cloud.io',
        },
        body: {
          source: 'Remote Cloud Catalog Service',
          products: [
            { id: 'db-1', name: 'Enterprise Cloud DB', price: '$299/mo' },
            { id: 'k8s-1', name: 'Managed Kubernetes', price: '$850/mo' },
          ],
        },
      },
      localResponse: null,
    },
    '/bff/core/v1/orders': {
      method: 'POST',
      isOAuthPage: false,
      remoteResponse: {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': 'https://portal.corporate-cloud.io',
        },
        body: {
          source: 'Remote Cloud (Production)',
          orderId: 'CLOUD-ORD-1092',
          status: 'created_legacy_flow',
        },
      },
      localResponse: {
        status: 201,
        headers: {
          'content-type': 'application/json',
          'x-back-overrides-target': 'http://localhost:8080/bff/core/v1/orders',
          'x-back-overrides-type': 'local-override',
          'access-control-allow-origin': 'https://portal.corporate-cloud.io',
          'access-control-allow-credentials': 'true',
        },
        body: {
          source: 'Local Dev BFF (Port 8080) ⚡',
          orderId: 'LOCAL-ORD-8080-V2',
          status: 'created_with_new_instant_checkout_v2',
          feature: 'NEW_CHECKOUT_PIPELINE_ACTIVE',
          discount: '20% OFF LOCAL DEV',
          debugInfo: 'Served by developer localhost',
        },
      },
    },
    '/bff/core/v1/oauth2/authorize': {
      method: 'GET',
      isOAuthPage: true, // Requires main_frame full-page redirect
      remoteResponse: {
        status: 302,
        headers: {
          Location: 'https://idp.remote-corporate-cloud.io/login?client_id=legacy_client',
        },
        body: {
          info: 'Navegação direcionada para o Identity Provider remoto antigo.',
        },
      },
      localResponse: {
        status: 302,
        headers: {
          Location: 'https://new-sso.enterprise-idp.corp/as/authorization.oauth2?client_id=local_dev_client',
          'x-back-overrides-target': 'http://localhost:8080/bff/core/v1/oauth2/authorize',
          'x-back-overrides-nav-hint': 'For top-level browser redirects, ensure BackOverrides Extension is active',
        },
        body: {
          info: 'Navegação interceptada com sucesso via main_frame para o BFF local com o novo IdP.',
        },
      },
    },
  };

  btnExecute.addEventListener('click', () => {
    const endpoint = endpointSelect.value;
    const mode = modeSelect.value;
    const sim = SIMULATED_DATA[endpoint];

    btnExecute.disabled = true;
    btnExecute.textContent = 'Enviando...';
    consoleOutput.textContent = 'Disparando requisição de teste...\n';

    setTimeout(() => {
      btnExecute.disabled = false;
      btnExecute.textContent = '⚡ Disparar Requisição';

      let destinationName = '';
      let isOverridden = false;
      let resultData = null;
      let responseStatus = 200;
      let responseHeaders = {};

      if (mode === 'disabled') {
        destinationName = 'Nuvem Remota (api.corporate-cloud.io)';
        isOverridden = false;
        resultData = sim.remoteResponse.body;
        responseStatus = sim.remoteResponse.status;
        responseHeaders = sim.remoteResponse.headers;
      } else if (mode === 'in-browser') {
        if (sim.isOAuthPage) {
          // In-page script cannot intercept top-level browser redirects
          destinationName = 'Nuvem Remota (Falha: In-Browser não intercepta window.location)';
          isOverridden = false;
          resultData = {
            aviso: 'O script in-browser (@back-overrides/client) NÃO consegue interceptar redirecionamentos de página inteira (window.location.href) por segurança do navegador.',
            solucao: 'Para interceptar rotas de login/authorize sem alterar o frontend, use a Extensão Chrome do BackOverrides com suporte a main_frame!',
            fallback: sim.remoteResponse.body,
          };
          responseStatus = 302;
          responseHeaders = sim.remoteResponse.headers;
        } else if (sim.localResponse) {
          destinationName = 'BFF Local (localhost:8080)';
          isOverridden = true;
          resultData = sim.localResponse.body;
          responseStatus = sim.localResponse.status;
          responseHeaders = sim.localResponse.headers;
        } else {
          destinationName = 'Nuvem Remota (Passthrough)';
          isOverridden = false;
          resultData = sim.remoteResponse.body;
          responseStatus = sim.remoteResponse.status;
          responseHeaders = sim.remoteResponse.headers;
        }
      } else if (mode === 'extension') {
        // Chrome extension declarativeNetRequest catches both fetch and main_frame
        if (sim.localResponse) {
          destinationName = 'BFF Local (localhost:8080)';
          isOverridden = true;
          resultData = sim.localResponse.body;
          responseStatus = sim.localResponse.status;
          responseHeaders = sim.localResponse.headers;
        } else {
          destinationName = 'Nuvem Remota (Passthrough)';
          isOverridden = false;
          resultData = sim.remoteResponse.body;
          responseStatus = sim.remoteResponse.status;
          responseHeaders = sim.remoteResponse.headers;
        }
      }

      // Update flow visualizer
      nodeClient.innerHTML = `<div class="node-title">Origem</div><div class="node-name">Single-SPA Portal</div>`;
      
      const interceptorLabel = mode === 'disabled' 
        ? 'Nenhum (Direto)' 
        : mode === 'in-browser' ? 'Script In-Browser' : 'Extensão (main_frame)';
      
      nodeInterceptor.innerHTML = `<div class="node-title">Interceptor</div><div class="node-name" style="color: var(--accent-cyan);">${interceptorLabel}</div>`;

      const destColor = isOverridden ? 'var(--accent-emerald)' : 'var(--accent-cyan)';
      nodeDestination.innerHTML = `<div class="node-title">Destino Final</div><div class="node-name" style="color: ${destColor};">${destinationName}</div>`;

      // Update console
      const time = new Date().toLocaleTimeString();
      const statusColor = responseStatus < 300 ? '#10b981' : responseStatus < 400 ? '#38bdf8' : '#ef4444';
      
      consoleMeta.innerHTML = `<span>${time} • HTTP ${responseStatus} • ${isOverridden ? 'LOCAL OVERRIDE' : 'REMOTE'}</span>`;

      const logText = [
        `[${time}] ${sim.method} https://api.corporate-cloud.io${endpoint}`,
        `Status: ${responseStatus}`,
        `Destino Atribuído: ${destinationName}`,
        `Cabeçalhos Recebidos:`,
        JSON.stringify(responseHeaders, null, 2),
        `\nCorpo da Resposta (Payload):`,
        JSON.stringify(resultData, null, 2),
      ].join('\n');

      consoleOutput.textContent = logText;
    }, 300);
  });
}

// 4. ScrollSpy for Sidebar
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.sidebar-item a');

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollPos = window.scrollY + 100;

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}

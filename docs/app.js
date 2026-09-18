// BackOverrides Documentation & Interactive Playground with i18n
document.addEventListener('DOMContentLoaded', () => {
  initI18n();
  initTabs();
  initCopyButtons();
  initPlayground();
  initScrollSpy();
});

// Translation dictionary
const TRANSLATIONS = {
  'pt-BR': {
    page_title: 'BackOverrides — Interceptador Seletivo de Endpoints com Resolução de CORS',
    meta_description: 'Redirecione endpoints específicos de APIs remotas para o localhost sem alterar código no frontend, com resolução automática de CORS e suporte a Single-SPA e OAuth.',
    nav_quickstart: 'Início Rápido',
    nav_modes: '3 Modos',
    nav_examples: 'Exemplos Reais',
    nav_playground: 'Simulador Live',
    nav_extension: 'Extensão Chrome',
    sidebar_getting_started: 'Começando',
    sidebar_overview: 'Visão Geral',
    sidebar_problem: 'O Desafio de Rede',
    sidebar_quickstart: 'Início Rápido (30s)',
    sidebar_architecture: 'Arquitetura',
    sidebar_modes: 'Os 3 Modos de Operação',
    sidebar_cors_pna: 'Resolução de CORS & PNA',
    sidebar_examples: 'Exemplos Práticos',
    sidebar_ex_basic: '1. REST Simples',
    sidebar_ex_dynamic: '2. Rotas Dinâmicas & Wildcard',
    sidebar_ex_single_spa: '3. Single-SPA + Fake BFF',
    sidebar_ex_oauth: '4. OAuth / SSO (main_frame)',
    sidebar_tools_docs: 'Ferramentas & Docs',
    sidebar_playground: 'Simulador Interativo Live',
    sidebar_config_ref: 'Configuração JSON',
    sidebar_extension: 'Extensão do Chrome',
    hero_badge: 'Versão 0.1.0 • Produzido para Microfrontends & BFFs',
    hero_title: 'Teste APIs locais mantendo seu frontend 100% apontado para a nuvem.',
    hero_desc: 'O <strong>BackOverrides</strong> intercepta seletivamente endpoints específicos de APIs remotas e os desvia para o seu <code>localhost</code>, resolvendo automaticamente barreiras de <strong>CORS</strong>, <strong>Private Network Access (PNA)</strong> e redirecionamentos de página <strong>OAuth</strong> sem alterar nenhuma linha de código no frontend.',
    hero_cta_start: '🚀 Início Rápido',
    hero_cta_playground: '⚡ Testar Simulador Live',
    problem_tag: 'Cenário Corporativo',
    problem_title: 'O Problema de Testar Local com Nuvem',
    problem_desc: 'Por que alterar URLs base no frontend quebra seu fluxo de desenvolvimento.',
    problem_c1_title: 'Bloqueios de CORS e PNA',
    problem_c1_desc: 'Quando seu portal roda em HTTPS público (ex.: <code>https://portal.corporate-cloud.io</code>), navegadores modernos bloqueiam chamadas diretas para <code>http://localhost</code> por segurança de Private Network Access.',
    problem_c2_title: 'Acoplamento de Código',
    problem_c2_desc: 'Alterar a URL base de <code>https://api.corporate-cloud.io</code> para <code>http://localhost:8080</code> exige editar <code>.env</code>, recompilar o frontend e corre o risco de subir URLs locais para produção por engano.',
    problem_c3_title: 'A Solução BackOverrides',
    problem_c3_desc: 'Suas URLs permanecem <strong>100% idênticas às de produção</strong>. O BackOverrides intercepta em tempo de execução apenas as rotas declaradas e injeta cabeçalhos CORS permissivos transparentemente.',
    qs_tag: 'Instalação',
    qs_title: 'Início Rápido em 30 Segundos',
    qs_desc: 'Escolha usar via CLI ou diretamente como biblioteca no seu projeto.',
    qs_tab1_btn: '1. Usando a CLI (Zero Instalação)',
    qs_tab2_btn: '2. Usando no Código (@back-overrides/client)',
    qs_tab3_btn: '3. Extensão Chrome (Zero Código)',
    qs_tab1_p: 'Inicie o proxy reverso apontando para sua API remota e seu backend local:',
    qs_tab2_p: 'Importe o interceptor no ponto de entrada do seu microfrontend ou Single-SPA app:',
    qs_tab3_p: 'Carregue a extensão no Chrome para interceptar chamadas <code>fetch</code> e navegações <code>main_frame</code> sem alterar nenhuma linha do projeto:',
    qs_tab3_step_title: 'Passo a Passo',
    qs_tab3_steps: '1. Acesse chrome://extensions/ no Google Chrome ou Edge\n2. Ative a opção "Modo do desenvolvedor" no canto superior direito\n3. Clique em "Carregar sem compactação" (Load unpacked)\n4. Selecione a pasta: packages/extension',
    modes_tag: 'Arquitetura Flexível',
    modes_title: 'Os 3 Modos de Operação',
    modes_desc: 'O BackOverrides se adapta ao seu ambiente de desenvolvimento.',
    modes_m1_title: '1. Proxy CLI Inteligente',
    modes_m1_desc: 'Proxy reverso Node.js com logs detalhados de requisições, tempo de resposta, headers injetados e tratamento de erros 502 com dicas de diagnóstico.',
    modes_m2_title: '2. Interceptor In-Browser',
    modes_m2_desc: 'Patch transparente em <code>window.fetch</code> e <code>XMLHttpRequest</code> ou Service Worker. Ideal para Single-SPA e microfrontends carregados via Import Map.',
    modes_m3_title: '3. Extensão Chrome (Manifest V3)',
    modes_m3_desc: 'Interceptação na camada de rede com <code>chrome.declarativeNetRequest</code>. Suporta requisições assíncronas e redirecionamentos de tela cheia (<code>main_frame</code>) para fluxos de autenticação.',
    ex_tag: 'Guias Práticos',
    ex_title: 'Exemplos Reais: Do Básico ao Avançado',
    ex_desc: 'Aprenda a aplicar o BackOverrides em diferentes níveis de complexidade.',
    ex1_level: 'Nível 1',
    ex1_title: 'Sobrescrita de Endpoint REST Simples',
    ex1_desc: 'Você está criando a rota de criação de usuários localmente (<code>POST /v1/users</code> na porta <code>3000</code>), mas quer que a listagem (<code>GET /v1/users</code>) continue vindo da API de homologação/nuvem.',
    ex2_level: 'Nível 2',
    ex2_title: 'Parâmetros Dinâmicos e Preservação de Query Strings',
    ex2_desc: 'Suporte nativo a parâmetros no formato <code>:id</code> ou <code>{id}</code>, além de wildcards (<code>*</code>) preservando perfeitamente query strings (ex.: <code>?filter=active&sort=desc</code>).',
    ex3_level: 'Nível 3',
    ex3_title: 'Single-SPA Microfrontends com BFF Simulado',
    ex3_desc: 'No cenário corporativo mais comum, o portal central roda Single-SPA com múltiplos microfrontends. O desenvolvedor edita apenas um MFE apontado via <code>import-map-overrides</code> e quer validar novas rotas de um BFF local:',
    ex3_tab_run_desc: 'Clone o repositório e execute a demonstração do Single-SPA com um comando:',
    ex4_level: 'Nível 4',
    ex4_title: 'Fluxo OAuth 2.0 / SSO Completo com <code>main_frame</code>',
    ex4_p1: 'Quando uma aplicação inicia o login, ela executa uma <strong>navegação de página inteira</strong> (<code>window.location.href = .../authorize</code>). Scripts comuns in-browser são bloqueados pelo navegador e não capturam essa mudança.',
    ex4_p2: 'A <strong>Extensão BackOverrides</strong> utiliza a API <code>chrome.declarativeNetRequest</code> com o tipo de recurso <code>main_frame</code> habilitado. Ela intercepta a navegação no nível do motor de rede do Chrome e desvia a aba para o seu BFF local, disparando o Identity Provider correto sem que você precise tocar em nenhuma linha do frontend.',
    pg_tag: 'Playground Interativo',
    pg_title: 'Simulador de Roteamento ao Vivo',
    pg_desc: 'Teste como o BackOverrides se comporta em cada rota e modo de operação diretamente no seu navegador.',
    pg_label_endpoint: 'Endpoint a Testar:',
    pg_opt_session: 'GET /bff/core/v1/session (Sessão Nuvem)',
    pg_opt_catalog: 'GET /bff/core/v1/catalog (Catálogo Nuvem)',
    pg_opt_orders: 'POST /bff/core/v1/orders (Pedido - Regra Local)',
    pg_opt_oauth: 'GET /bff/core/v1/oauth2/authorize (Login SSO)',
    pg_label_mode: 'Modo do BackOverrides:',
    pg_mode_ext: 'Extensão Chrome (main_frame Ativo)',
    pg_mode_browser: 'Script In-Browser (@back-overrides/client)',
    pg_mode_disabled: 'Desativado (Tráfego Direto para Nuvem)',
    pg_btn_run: '⚡ Disparar Requisição',
    pg_btn_sending: 'Enviando...',
    pg_node_origin_title: 'Origem',
    pg_node_origin_val: 'Single-SPA Portal',
    pg_node_interceptor_title: 'Interceptor',
    pg_node_dest_title: 'Destino Final',
    pg_node_dest_waiting: 'Aguardando teste...',
    pg_console_header: 'Inspetor de Resposta & Headers',
    pg_console_ready: 'Pronto',
    pg_console_initial: 'Clique em "⚡ Disparar Requisição" acima para ver o diagnóstico em tempo real.',
    cfg_tag: 'Referência da API',
    cfg_title: 'Esquema do <code>back-overrides.json</code>',
    cfg_desc: 'Todos os parâmetros disponíveis para customização do proxy e regras.',
    cfg_th_prop: 'Propriedade',
    cfg_th_type: 'Tipo',
    cfg_th_default: 'Padrão',
    cfg_th_desc: 'Descrição',
    cfg_required: 'Obrigatório',
    cfg_desc_remote: 'URL base da API remota oficial (ex.: <code>https://api.corporate-cloud.io</code>).',
    cfg_desc_local: 'URL base padrão para onde as rotas interceptadas serão encaminhadas.',
    cfg_desc_port: 'Porta local em que o proxy reverso CLI escutará.',
    cfg_desc_cors_enabled: 'Injeta cabeçalhos permissivos (<code>Access-Control-Allow-Origin</code>) refletindo a origem solicitante.',
    cfg_desc_cors_credentials: 'Permite envio de cookies de sessão corporativos (<code>Access-Control-Allow-Credentials: true</code>).',
    cfg_desc_secure: 'Quando <code>false</code>, aceita certificados SSL autoassinados ou corporativos em redes privadas.',
    cfg_desc_overrides: 'Lista de regras de roteamento (com <code>methods</code>, <code>path</code>, <code>target</code>, <code>passthrough</code>).',
    ext_tag: 'Zero Código',
    ext_title: 'Extensão para Google Chrome & Edge',
    ext_desc: 'Instale uma vez e intercepte endpoints corporativos sem modificar repositórios de código.',
    ext_c1_title: 'Carregar no Navegador',
    ext_c1_desc: 'Abra <code>chrome://extensions</code>, ative o <strong>Modo do Desenvolvedor</strong> e clique em <strong>Carregar sem compactação</strong> apontando para <code>packages/extension</code>.',
    ext_c2_title: 'Sincronização com 1 Clique',
    ext_c2_desc: 'A extensão se conecta automaticamente ao BackOverrides CLI (<code>http://localhost:8888</code>) e importa todas as regras do seu <code>back-overrides.json</code> dinamicamente.',
    ext_c3_title: 'Suporte a main_frame',
    ext_c3_desc: 'Intercepta não apenas <code>fetch</code> e <code>XHR</code>, mas também navegações completas do navegador como o fluxo de login corporativo OAuth/SSO.',
    footer_text: '<strong>BackOverrides</strong> — MIT Licensed. Feito para desenvolvedores que valorizam agilidade.',
    footer_back_to_top: 'Voltar ao Topo ↑',
    copy_text: 'Copiar',
    copied_text: '✓ Copiado!',
    // Simulator strings
    sim_dest_remote: 'Nuvem Remota (api.corporate-cloud.io)',
    sim_dest_remote_fail: 'Nuvem Remota (Falha: In-Browser não intercepta window.location)',
    sim_dest_local: 'BFF Local (localhost:8080)',
    sim_dest_passthrough: 'Nuvem Remota (Passthrough)',
    sim_interceptor_none: 'Nenhum (Direto)',
    sim_interceptor_browser: 'Script In-Browser',
    sim_interceptor_ext: 'Extensão (main_frame)',
    sim_oauth_notice: 'O script in-browser (@back-overrides/client) NÃO consegue interceptar redirecionamentos de página inteira (window.location.href) por segurança do navegador.',
    sim_oauth_solution: 'Para interceptar rotas de login/authorize sem alterar o frontend, use a Extensão Chrome do BackOverrides com suporte a main_frame!',
    sim_trigger_log: 'Disparando requisição de teste...\n',
    sim_assigned_dest: 'Destino Atribuído:',
    sim_received_headers: 'Cabeçalhos Recebidos:',
    sim_payload_body: 'Corpo da Resposta (Payload):'
  },
  'en': {
    page_title: 'BackOverrides — Selective Endpoint Interceptor with CORS Resolution',
    meta_description: 'Selectively redirect specific remote API endpoints to localhost without modifying frontend code, with automatic CORS resolution, Single-SPA and OAuth support.',
    nav_quickstart: 'Quickstart',
    nav_modes: '3 Modes',
    nav_examples: 'Real Examples',
    nav_playground: 'Live Simulator',
    nav_extension: 'Chrome Extension',
    sidebar_getting_started: 'Getting Started',
    sidebar_overview: 'Overview',
    sidebar_problem: 'The Network Challenge',
    sidebar_quickstart: 'Quickstart (30s)',
    sidebar_architecture: 'Architecture',
    sidebar_modes: '3 Operating Modes',
    sidebar_cors_pna: 'CORS & PNA Resolution',
    sidebar_examples: 'Practical Examples',
    sidebar_ex_basic: '1. Simple REST',
    sidebar_ex_dynamic: '2. Dynamic Routes & Wildcards',
    sidebar_ex_single_spa: '3. Single-SPA + Fake BFF',
    sidebar_ex_oauth: '4. OAuth / SSO (main_frame)',
    sidebar_tools_docs: 'Tools & Docs',
    sidebar_playground: 'Interactive Live Simulator',
    sidebar_config_ref: 'JSON Configuration',
    sidebar_extension: 'Chrome Extension',
    hero_badge: 'Version 0.1.0 • Built for Microfrontends & BFFs',
    hero_title: 'Test local APIs while keeping your frontend 100% pointed to the cloud.',
    hero_desc: '<strong>BackOverrides</strong> selectively intercepts specific remote API endpoints and redirects them to your <code>localhost</code>, automatically solving <strong>CORS</strong>, <strong>Private Network Access (PNA)</strong> barriers, and <strong>OAuth</strong> full-page redirects without touching a single line of frontend code.',
    hero_cta_start: '🚀 Quickstart',
    hero_cta_playground: '⚡ Try Live Simulator',
    problem_tag: 'Production Scenario',
    problem_title: 'The Challenge of Local Dev with Remote Cloud',
    problem_desc: 'Why changing base URLs in the frontend disrupts your development workflow.',
    problem_c1_title: 'CORS & PNA Blockers',
    problem_c1_desc: 'When your portal runs on public HTTPS (e.g., <code>https://portal.corporate-cloud.io</code>), modern browsers block direct calls to <code>http://localhost</code> due to Private Network Access policies.',
    problem_c2_title: 'Code Coupling & Leaks',
    problem_c2_desc: 'Changing the base URL from <code>https://api.corporate-cloud.io</code> to <code>http://localhost:8080</code> requires editing <code>.env</code>, recompiling the frontend, and risks accidentally committing local URLs to production.',
    problem_c3_title: 'The BackOverrides Solution',
    problem_c3_desc: 'Your URLs remain <strong>100% identical to production</strong>. BackOverrides intercepts only declared routes at runtime and injects permissive CORS headers transparently.',
    qs_tag: 'Installation',
    qs_title: 'Quickstart in 30 Seconds',
    qs_desc: 'Choose CLI mode or use directly as an in-project library.',
    qs_tab1_btn: '1. Using the CLI (Zero Install)',
    qs_tab2_btn: '2. In-Code SDK (@back-overrides/client)',
    qs_tab3_btn: '3. Chrome Extension (Zero Code)',
    qs_tab1_p: 'Start the reverse proxy pointing to your remote API and local backend:',
    qs_tab2_p: 'Import the interceptor at your microfrontend or Single-SPA app entry point:',
    qs_tab3_p: 'Load the extension in Chrome to intercept <code>fetch</code> calls and <code>main_frame</code> navigations without modifying project code:',
    qs_tab3_step_title: 'Step-by-Step',
    qs_tab3_steps: '1. Open chrome://extensions/ in Google Chrome or Edge\n2. Enable "Developer mode" toggle in top right corner\n3. Click "Load unpacked"\n4. Select directory: packages/extension',
    modes_tag: 'Flexible Architecture',
    modes_title: '3 Operating Modes',
    modes_desc: 'BackOverrides adapts seamlessly to your development workflow.',
    modes_m1_title: '1. Intelligent CLI Proxy',
    modes_m1_desc: 'Node.js reverse proxy with detailed request logging, response times, injected headers, and 502 Bad Gateway recovery tips.',
    modes_m2_title: '2. In-Browser Interceptor',
    modes_m2_desc: 'Transparent patch on <code>window.fetch</code>, <code>XMLHttpRequest</code>, or Service Worker. Ideal for Single-SPA and microfrontends loaded via Import Maps.',
    modes_m3_title: '3. Chrome Extension (Manifest V3)',
    modes_m3_desc: 'Network-level interception via <code>chrome.declarativeNetRequest</code>. Supports both async requests and full-page redirects (<code>main_frame</code>) for auth flows.',
    ex_tag: 'Practical Guides',
    ex_title: 'Real Examples: From Basic to Advanced',
    ex_desc: 'Learn how to apply BackOverrides across various complexity levels.',
    ex1_level: 'Level 1',
    ex1_title: 'Simple REST Endpoint Override',
    ex1_desc: 'You are developing user creation locally (<code>POST /v1/users</code> on port <code>3000</code>), but want listing (<code>GET /v1/users</code>) to continue coming from the remote staging/cloud API.',
    ex2_level: 'Level 2',
    ex2_title: 'Dynamic Parameters & Query String Preservation',
    ex2_desc: 'Native support for <code>:id</code> or <code>{id}</code> params, plus wildcards (<code>*</code>) perfectly preserving query strings (e.g. <code>?filter=active&sort=desc</code>).',
    ex3_level: 'Level 3',
    ex3_title: 'Single-SPA Microfrontends with Simulated BFF',
    ex3_desc: 'In typical corporate microfrontend setups, the root portal runs Single-SPA. A developer edits one MFE pointed via <code>import-map-overrides</code> and wants to validate new routes against a local BFF:',
    ex3_tab_run_desc: 'Clone the repository and run the Single-SPA demo with one command:',
    ex4_level: 'Level 4',
    ex4_title: 'Full OAuth 2.0 / SSO Flow with <code>main_frame</code>',
    ex4_p1: 'When an application initiates login, it performs a <strong>full-page navigation</strong> (<code>window.location.href = .../authorize</code>). Standard in-browser scripts cannot intercept top-level document navigations due to browser security restrictions.',
    ex4_p2: 'The <strong>BackOverrides Extension</strong> uses <code>chrome.declarativeNetRequest</code> with the <code>main_frame</code> resource type enabled. It intercepts navigations directly in the browser network stack and redirects to your local BFF, triggering the correct Identity Provider without modifying any frontend code.',
    pg_tag: 'Interactive Playground',
    pg_title: 'Live Routing Simulator',
    pg_desc: 'Test how BackOverrides handles each route and operating mode directly inside your browser.',
    pg_label_endpoint: 'Endpoint to Test:',
    pg_opt_session: 'GET /bff/core/v1/session (Cloud Session)',
    pg_opt_catalog: 'GET /bff/core/v1/catalog (Cloud Catalog)',
    pg_opt_orders: 'POST /bff/core/v1/orders (Order - Local Rule)',
    pg_opt_oauth: 'GET /bff/core/v1/oauth2/authorize (SSO Login)',
    pg_label_mode: 'BackOverrides Mode:',
    pg_mode_ext: 'Chrome Extension (main_frame Active)',
    pg_mode_browser: 'In-Browser Script (@back-overrides/client)',
    pg_mode_disabled: 'Disabled (Direct to Cloud)',
    pg_btn_run: '⚡ Trigger Request',
    pg_btn_sending: 'Sending...',
    pg_node_origin_title: 'Origin',
    pg_node_origin_val: 'Single-SPA Portal',
    pg_node_interceptor_title: 'Interceptor',
    pg_node_dest_title: 'Final Destination',
    pg_node_dest_waiting: 'Awaiting test...',
    pg_console_header: 'Response & Headers Inspector',
    pg_console_ready: 'Ready',
    pg_console_initial: 'Click "⚡ Trigger Request" above to view real-time diagnostics.',
    cfg_tag: 'API Reference',
    cfg_title: '<code>back-overrides.json</code> Schema',
    cfg_desc: 'All parameters available for configuring proxy behavior and rules.',
    cfg_th_prop: 'Property',
    cfg_th_type: 'Type',
    cfg_th_default: 'Default',
    cfg_th_desc: 'Description',
    cfg_required: 'Required',
    cfg_desc_remote: 'Base URL of the remote official API (e.g., <code>https://api.corporate-cloud.io</code>).',
    cfg_desc_local: 'Default base URL where intercepted routes will be forwarded.',
    cfg_desc_port: 'Local port where the reverse proxy CLI will listen.',
    cfg_desc_cors_enabled: 'Injects permissive headers (<code>Access-Control-Allow-Origin</code>) matching the requesting origin.',
    cfg_desc_cors_credentials: 'Allows corporate session cookies (<code>Access-Control-Allow-Credentials: true</code>).',
    cfg_desc_secure: 'When <code>false</code>, accepts self-signed or enterprise internal SSL certificates.',
    cfg_desc_overrides: 'List of routing rules (with <code>methods</code>, <code>path</code>, <code>target</code>, <code>passthrough</code>).',
    ext_tag: 'Zero Code',
    ext_title: 'Extension for Google Chrome & Edge',
    ext_desc: 'Install once and intercept remote endpoints without touching code repositories.',
    ext_c1_title: 'Load in Browser',
    ext_c1_desc: 'Open <code>chrome://extensions</code>, toggle on <strong>Developer mode</strong>, and click <strong>Load unpacked</strong> pointing to <code>packages/extension</code>.',
    ext_c2_title: '1-Click Sync',
    ext_c2_desc: 'The extension automatically connects to the BackOverrides CLI (<code>http://localhost:8888</code>) and imports all rules from your <code>back-overrides.json</code> dynamically.',
    ext_c3_title: 'main_frame Support',
    ext_c3_desc: 'Intercepts not just <code>fetch</code> and <code>XHR</code>, but also full-page navigations like remote OAuth/SSO login flows.',
    footer_text: '<strong>BackOverrides</strong> — MIT Licensed. Built for developers who value agility.',
    footer_back_to_top: 'Back to Top ↑',
    copy_text: 'Copy',
    copied_text: '✓ Copied!',
    // Simulator strings
    sim_dest_remote: 'Remote Cloud (api.corporate-cloud.io)',
    sim_dest_remote_fail: 'Remote Cloud (Failed: In-Browser cannot intercept window.location)',
    sim_dest_local: 'Local BFF (localhost:8080)',
    sim_dest_passthrough: 'Remote Cloud (Passthrough)',
    sim_interceptor_none: 'None (Direct)',
    sim_interceptor_browser: 'In-Browser Script',
    sim_interceptor_ext: 'Extension (main_frame)',
    sim_oauth_notice: 'The in-browser script (@back-overrides/client) CANNOT intercept top-level page navigations (window.location.href) due to browser security restrictions.',
    sim_oauth_solution: 'To intercept login/authorize routes without modifying frontend code, use the BackOverrides Chrome Extension with main_frame support!',
    sim_trigger_log: 'Triggering test request...\n',
    sim_assigned_dest: 'Assigned Destination:',
    sim_received_headers: 'Received Headers:',
    sim_payload_body: 'Response Body (Payload):'
  }
};

let currentLocale = 'pt-BR';

function t(key) {
  const langTable = TRANSLATIONS[currentLocale] || TRANSLATIONS['pt-BR'];
  return langTable[key] || TRANSLATIONS['pt-BR'][key] || key;
}

// 0. Internationalization (i18n) Engine & Auto-Detection
function initI18n() {
  currentLocale = detectInitialLocale();
  applyTranslations(currentLocale);
  setupLanguageSwitcher();
}

function detectInitialLocale() {
  // 1. Check explicit user preference in localStorage
  const saved = localStorage.getItem('backoverrides_locale');
  if (saved === 'pt-BR' || saved === 'en') {
    return saved;
  }

  // 2. Detect browser locale: if Brazil / Portuguese or unidentifiable -> pt-BR, else -> en
  const navLang = (navigator.language || (navigator.languages && navigator.languages[0]) || navigator.userLanguage || '').toLowerCase().trim();
  
  if (!navLang) {
    return 'pt-BR';
  }
  if (navLang.startsWith('pt') || navLang.includes('br')) {
    return 'pt-BR';
  }
  return 'en';
}

function setLocale(lang) {
  if (lang !== 'pt-BR' && lang !== 'en') return;
  currentLocale = lang;
  localStorage.setItem('backoverrides_locale', lang);
  applyTranslations(lang);
  updateSwitcherUI(lang);
}

function applyTranslations(lang) {
  // Update html lang attribute
  document.documentElement.setAttribute('lang', lang);

  // Update Page Title and Meta Description
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = t('page_title');

  const metaDescEl = document.getElementById('meta-desc');
  if (metaDescEl) metaDescEl.setAttribute('content', t('meta_description'));

  // Update elements with text translation
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  // Update elements with HTML translation (preserving <code>, <strong>, etc.)
  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const key = el.getAttribute('data-i18n-html');
    el.innerHTML = t(key);
  });
}

function updateSwitcherUI(lang) {
  const flagEl = document.getElementById('current-lang-flag');
  const codeEl = document.getElementById('current-lang-code');
  if (flagEl) flagEl.textContent = lang === 'en' ? '🇺🇸' : '🇧🇷';
  if (codeEl) codeEl.textContent = lang === 'en' ? 'EN' : 'PT';

  document.querySelectorAll('.lang-option').forEach((opt) => {
    if (opt.getAttribute('data-lang') === lang) {
      opt.classList.add('active');
    } else {
      opt.classList.remove('active');
    }
  });
}

function setupLanguageSwitcher() {
  const switcher = document.getElementById('lang-switcher');
  const btn = document.getElementById('lang-btn');
  const dropdown = document.getElementById('lang-dropdown');

  if (!switcher || !btn || !dropdown) return;

  updateSwitcherUI(currentLocale);

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = switcher.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  document.addEventListener('click', (e) => {
    if (!switcher.contains(e.target)) {
      switcher.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && switcher.classList.contains('open')) {
      switcher.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      btn.focus();
    }
  });

  document.querySelectorAll('.lang-option').forEach((opt) => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      const selectedLang = opt.getAttribute('data-lang');
      setLocale(selectedLang);
      switcher.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
  });
}

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
        const originalText = btn.textContent;
        btn.textContent = t('copied_text');
        btn.style.borderColor = 'var(--accent-emerald)';
        btn.style.color = 'var(--accent-emerald)';

        setTimeout(() => {
          btn.textContent = t('copy_text');
          btn.style.borderColor = '';
          btn.style.color = '';
        }, 2000);
      } catch (err) {
        console.error('Copy failed:', err);
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
          email: 'jane.doe@example.com',
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
            { id: 'db-1', name: 'Cloud DB', price: '$299/mo' },
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
          info: 'Remote Old Identity Provider Login Redirect',
        },
      },
      localResponse: {
        status: 302,
        headers: {
          Location: 'https://new-sso.idp.example.io/as/authorization.oauth2?client_id=local_dev_client',
          'x-back-overrides-target': 'http://localhost:8080/bff/core/v1/oauth2/authorize',
          'x-back-overrides-nav-hint': 'For top-level browser redirects, ensure BackOverrides Extension is active',
        },
        body: {
          info: 'Navigation intercepted successfully via main_frame to local BFF with new IdP.',
        },
      },
    },
  };

  btnExecute.addEventListener('click', () => {
    const endpoint = endpointSelect.value;
    const mode = modeSelect.value;
    const sim = SIMULATED_DATA[endpoint];

    btnExecute.disabled = true;
    btnExecute.textContent = t('pg_btn_sending');
    consoleOutput.textContent = t('sim_trigger_log');

    setTimeout(() => {
      btnExecute.disabled = false;
      btnExecute.textContent = t('pg_btn_run');

      let destinationName = '';
      let isOverridden = false;
      let resultData = null;
      let responseStatus = 200;
      let responseHeaders = {};

      if (mode === 'disabled') {
        destinationName = t('sim_dest_remote');
        isOverridden = false;
        resultData = sim.remoteResponse.body;
        responseStatus = sim.remoteResponse.status;
        responseHeaders = sim.remoteResponse.headers;
      } else if (mode === 'in-browser') {
        if (sim.isOAuthPage) {
          destinationName = t('sim_dest_remote_fail');
          isOverridden = false;
          resultData = {
            notice: t('sim_oauth_notice'),
            solution: t('sim_oauth_solution'),
            fallback: sim.remoteResponse.body,
          };
          responseStatus = 302;
          responseHeaders = sim.remoteResponse.headers;
        } else if (sim.localResponse) {
          destinationName = t('sim_dest_local');
          isOverridden = true;
          resultData = sim.localResponse.body;
          responseStatus = sim.localResponse.status;
          responseHeaders = sim.localResponse.headers;
        } else {
          destinationName = t('sim_dest_passthrough');
          isOverridden = false;
          resultData = sim.remoteResponse.body;
          responseStatus = sim.remoteResponse.status;
          responseHeaders = sim.remoteResponse.headers;
        }
      } else if (mode === 'extension') {
        if (sim.localResponse) {
          destinationName = t('sim_dest_local');
          isOverridden = true;
          resultData = sim.localResponse.body;
          responseStatus = sim.localResponse.status;
          responseHeaders = sim.localResponse.headers;
        } else {
          destinationName = t('sim_dest_passthrough');
          isOverridden = false;
          resultData = sim.remoteResponse.body;
          responseStatus = sim.remoteResponse.status;
          responseHeaders = sim.remoteResponse.headers;
        }
      }

      // Update flow visualizer
      nodeClient.innerHTML = `<div class="node-title">${t('pg_node_origin_title')}</div><div class="node-name">${t('pg_node_origin_val')}</div>`;
      
      const interceptorLabel = mode === 'disabled' 
        ? t('sim_interceptor_none') 
        : mode === 'in-browser' ? t('sim_interceptor_browser') : t('sim_interceptor_ext');
      
      nodeInterceptor.innerHTML = `<div class="node-title">${t('pg_node_interceptor_title')}</div><div class="node-name" style="color: var(--accent-cyan);">${interceptorLabel}</div>`;

      const destColor = isOverridden ? 'var(--accent-emerald)' : 'var(--accent-cyan)';
      nodeDestination.innerHTML = `<div class="node-title">${t('pg_node_dest_title')}</div><div class="node-name" style="color: ${destColor};">${destinationName}</div>`;

      // Update console
      const time = new Date().toLocaleTimeString();
      consoleMeta.innerHTML = `<span>${time} • HTTP ${responseStatus} • ${isOverridden ? 'LOCAL OVERRIDE' : 'REMOTE'}</span>`;

      const logText = [
        `[${time}] ${sim.method} https://api.corporate-cloud.io${endpoint}`,
        `Status: ${responseStatus}`,
        `${t('sim_assigned_dest')} ${destinationName}`,
        `${t('sim_received_headers')}`,
        JSON.stringify(responseHeaders, null, 2),
        `\n${t('sim_payload_body')}`,
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

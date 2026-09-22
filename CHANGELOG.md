# Changelog

Todas as mudanças notáveis no projeto **BackOverrides** são documentadas neste arquivo de acordo com as diretrizes do [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) e [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [v0.8.0] - 2026-09-22

### ✨ Features

- add CLI quick launch assistant, auto-detection, and interactive popup mockup in docs (#10) ([9beca35](https://github.com/KsAkira10/BackOverridesApp/commit/9beca35c17284ef482d8bd72d92cc0f470bb6ace))


## [v0.7.1] - 2026-09-21

### 🧰 Maintenance & Other Changes

- *(docs)* fix broken release, rc, and monorepo package version badges (#9) ([a297fc1](https://github.com/KsAkira10/BackOverridesApp/commit/a297fc14372c11d5fd203fe65a4b2395de6730a5))


## [v0.7.0] - 2026-09-21

### ✨ Features

- **extension**: add options studio page, content-script generator and reload controls (#8) ([2b2cf0e](https://github.com/KsAkira10/BackOverridesApp/commit/2b2cf0e2cc41ce5b18024ac3c123976f4a783af0))


## [v0.6.0] - 2026-09-21

### ✨ Features

- add Model Context Protocol (MCP) server package for AI assistant integration (#7) ([0ead6c8](https://github.com/KsAkira10/BackOverridesApp/commit/0ead6c8e221628c4fcede2915d930ec17ee87273))


## [v0.5.0] - 2026-09-21

### ✨ Features

- add mobile navigation drawer and update backend override configuration (#6) ([39bbd26](https://github.com/KsAkira10/BackOverridesApp/commit/39bbd267f74205674ad363c823f4f159e598e867))

### 🧰 Maintenance & Other Changes

- *(chore)* update backend override configurations, add agent guidelines, and update gitignore ([0f991f4](https://github.com/KsAkira10/BackOverridesApp/commit/0f991f47a0553a47b6b86834e7d188bfbc9c16f0))


## [v0.4.1] - 2026-09-18

### 🐛 Bug Fixes

- **docs**: fix repository link in github pages (#5) ([b320748](https://github.com/KsAkira10/BackOverridesApp/commit/b32074810a433cfbe2deafb04151d593bd3c1502))


## [v0.4.0] - 2026-09-18

### ✨ Features

- add automatic port fallback and runtime discovery for CLI proxy and client (#4) ([f302402](https://github.com/KsAkira10/BackOverridesApp/commit/f302402502b2b6310ae2b0938ddc6e4777d3728d))


## [v0.3.0] - 2026-09-18

### ✨ Features

- **release**: clean up obsolete release candidate tags and pre-releases on main merge (#3) ([21dabc6](https://github.com/KsAkira10/BackOverridesApp/commit/21dabc6913fe9e68dbedb8a10402304a9c823384))


## [v0.2.1] - 2026-09-18

### 🐛 Bug Fixes

- **docs**: remove innersource references and align contributing guide for public repository (#2) ([f3216a7](https://github.com/KsAkira10/BackOverridesApp/commit/f3216a778f96ec56d8c4187e4b745c52b9f7cabd))


## [v0.2.0] - 2026-09-18

### ✨ Features

- **ci**: implement semantic versioning, changelog generation, and RC pipelines ([f4d3ff4](https://github.com/KsAkira10/BackOverridesApp/commit/f4d3ff40f6984ddc041a946485e36bcc9d430734))
- **docs**: add internationalization (pt-BR default and en) to docs and GitHub Pages ([476e191](https://github.com/KsAkira10/BackOverridesApp/commit/476e191142aac874e7c95e3af6d7847a7cec2824))

### 🐛 Bug Fixes

- **ci**: encode forbidden patterns in base64 and exclude ci.yml to prevent false positive self-triggering in guardrails ([3fbcef4](https://github.com/KsAkira10/BackOverridesApp/commit/3fbcef4306aa3f0c0807220a5b0b95a0a4913ba7))

### 🧰 Maintenance & Other Changes

- *(docs)* **templates**: add issue templates for bugs, security and features, and enrich PR template with visual evidence guidance ([197a819](https://github.com/KsAkira10/BackOverridesApp/commit/197a819420cabc584aa77b5dcaec94afccd728b8))
- *(docs)* **contributing**: add contributor guide, PR template with guardrails, and GitHub Copilot review instructions ([2eb4567](https://github.com/KsAkira10/BackOverridesApp/commit/2eb4567ebfc623e65b7cb9770f8bed8a6dd71ac6))
- *(docs)* **readme**: add dynamic badges for releases, packages, build status, and docs link ([3f40ed3](https://github.com/KsAkira10/BackOverridesApp/commit/3f40ed34e684f7c4d6405f6318adb93b123c396b))


## [v0.1.0] - 2026-09-18

### ✨ Features

- **core**: Motor agnóstico de roteamento com suporte a rotas estáticas, dinâmicas (`:id`), wildcards (`*`) e resolução automatizada de cabeçalhos CORS e PNA.
- **cli**: Proxy reverso Node.js com logs em tempo real, suporte a recarregamento dinâmico de regras e dicas de diagnóstico para erros 502.
- **client**: Interceptor in-browser transparente em `window.fetch` e Service Worker para Single-SPA e microfrontends.
- **extension**: Extensão para Google Chrome e Edge (Manifest V3) com interceptação de `main_frame` para fluxos de autenticação SSO/OAuth.
- **docs**: Portal interativo de documentação no GitHub Pages com simulador ao vivo e suporte bilíngue (`pt-BR` e `en`) com detecção de localidade do navegador.
- **ci/cd**: Pipelines completas no GitHub Actions para CI (Node 18, 20, 22), empacotamento da extensão, publicação no NPM e GitHub Releases.

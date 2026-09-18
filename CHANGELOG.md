# Changelog

Todas as mudanças notáveis no projeto **BackOverrides** são documentadas neste arquivo de acordo com as diretrizes do [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) e [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [v0.1.0] - 2026-09-18

### ✨ Features

- **core**: Motor agnóstico de roteamento com suporte a rotas estáticas, dinâmicas (`:id`), wildcards (`*`) e resolução automatizada de cabeçalhos CORS e PNA.
- **cli**: Proxy reverso Node.js com logs em tempo real, suporte a recarregamento dinâmico de regras e dicas de diagnóstico para erros 502.
- **client**: Interceptor in-browser transparente em `window.fetch` e Service Worker para Single-SPA e microfrontends.
- **extension**: Extensão para Google Chrome e Edge (Manifest V3) com interceptação de `main_frame` para fluxos de autenticação SSO/OAuth.
- **docs**: Portal interativo de documentação no GitHub Pages com simulador ao vivo e suporte bilíngue (`pt-BR` e `en`) com detecção de localidade do navegador.
- **ci/cd**: Pipelines completas no GitHub Actions para CI (Node 18, 20, 22), empacotamento da extensão, publicação no NPM e GitHub Releases.

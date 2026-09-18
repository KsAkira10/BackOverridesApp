# ⚡ BackOverrides

> Interceptador seletivo de endpoints de APIs remotas e redirecionador para `localhost` com resolução automática e transparente de CORS e Private Network Access (PNA) para validação de comportamento integrado.

> 🌐 **Language / Idioma:** [🇧🇷 Português](./README.md) | [🇺🇸 English](./README.en.md)

<div align="center">

[![CI Status](https://github.com/KsAkira10/BackOverridesApp/actions/workflows/ci.yml/badge.svg)](https://github.com/KsAkira10/BackOverridesApp/actions/workflows/ci.yml)
[![Pages Status](https://github.com/KsAkira10/BackOverridesApp/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/KsAkira10/BackOverridesApp/actions/workflows/deploy-pages.yml)
[![Docs](https://img.shields.io/badge/docs-GitHub%20Pages-38bdf8?style=flat&logo=githubpages&logoColor=white)](https://ksakira10.github.io/BackOverridesApp/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

<br />

[![Latest Release](https://img.shields.io/github/v/release/KsAkira10/BackOverridesApp?include_prereleases=false&label=release&color=10b981&logo=github)](https://github.com/KsAkira10/BackOverridesApp/releases/latest)
[![Release Candidate](https://img.shields.io/github/v/release/KsAkira10/BackOverridesApp?include_prereleases=true&label=rc&color=f59e0b&logo=github)](https://github.com/KsAkira10/BackOverridesApp/releases)
[![@back-overrides/cli](https://img.shields.io/npm/v/@back-overrides/cli?label=%40back-overrides%2Fcli&color=0284c7&logo=npm)](https://www.npmjs.com/package/@back-overrides/cli)
[![@back-overrides/core](https://img.shields.io/npm/v/@back-overrides/core?label=%40back-overrides%2Fcore&color=0284c7&logo=npm)](https://www.npmjs.com/package/@back-overrides/core)
[![@back-overrides/client](https://img.shields.io/npm/v/@back-overrides/client?label=%40back-overrides%2Fclient&color=0284c7&logo=npm)](https://www.npmjs.com/package/@back-overrides/client)
[![Chrome Extension](https://img.shields.io/badge/extension-Chrome%20%2F%20Edge-a855f7?logo=googlechrome&logoColor=white)](https://github.com/KsAkira10/BackOverridesApp/releases/latest)

</div>

> 📖 **Documentação Online Interativa:** Acesse o portal completo com simulador de rotas ao vivo no GitHub Pages: **[https://ksakira10.github.io/BackOverridesApp/](https://ksakira10.github.io/BackOverridesApp/)**  
> 🤝 **Contribuindo:** Leia nosso [Guia de Contribuição](./CONTRIBUTING.md) com instruções para Pull Requests, guardrails e code review.

---

## 💡 Sobre o Projeto

Quando desenvolvemos ou testamos uma funcionalidade no frontend apontando para um ambiente remoto (produção, staging ou homologação), muitas vezes queremos validar **apenas um endpoint específico** rodando no nosso backend local (ex.: `POST /v1/users` no `localhost:3000` ou um BFF local na porta `8080`), enquanto todos os outros endpoints da aplicação continuam respondendo pelas APIs remotas oficiais (`https://api.corporate-cloud.io`).

Fazer isso diretamente no navegador gera **três grandes barreiras de rede**:
1. **Problemas de CORS e PNA (Private Network Access)**: Quando o frontend está em uma origem HTTPS pública (ex: `https://portal.corporate-cloud.io`), o navegador bloqueia chamadas diretas para `localhost` exigindo `Access-Control-Allow-Private-Network: true` e `Access-Control-Allow-Origin`.
2. **Acoplamento de URLs no Frontend**: Mudar a URL base da API no frontend exige alterar arquivos `.env`, recompilar código ou criar condicionais artificiais de desenvolvimento.
3. **Ambientes Distribuídos Complexos**: Em arquiteturas de Microfrontends (Single-SPA), o portal roda em produção/staging e apenas um microfrontend é sobrescrito localmente via import map.

O **BackOverrides** resolve isso através de um **Core agnóstico em TypeScript**, uma **CLI com Proxy Inteligente**, uma **Biblioteca de Interceptação In-Browser/Service Worker** e uma **Extensão de Navegador (Chrome/Edge)**.

---

## 🏢 Cenário Real Enterprise: Single-SPA + Import Maps + BFF + Microserviços

Este é o cenário mais comum e real na vida de desenvolvedores corporativos:

```
                  ┌─────────────────────────────────────────────────────────┐
                  │             Navegador (Google Chrome / Edge)            │
                  │                                                         │
                  │  Página: https://portal.corporate-cloud.io (Single-SPA) │
                  │  Import Map Override aponta seu MFE -> http://localhost │
                  └───────────────────────────┬─────────────────────────────┘
                                              │
                        fetch('https://api.corporate-cloud.io/...')
                                              │
                      ┌───────────────────────▼────────────────────────┐
                      │              BackOverrides Interceptor         │
                      │   (In-Browser Client / Extension / CLI Proxy)  │
                      └───────────────┬────────────────┬───────────────┘
                                      │                │
                        /bff/core/v1  │                │  Qualquer outro endpoint
                     (Regra de Override)      │                │  (Autenticação, Catálogo, etc.)
                                      ▼                ▼
                         ┌─────────────────┐      ┌─────────────────────────────┐
                         │   BFF LOCAL     │      │         API REMOTA          │
                         │  localhost:8080 │      │  api.corporate-cloud.io     │
                         └─────────────────┘      └─────────────────────────────┘
```

### Como usar o BackOverrides nesse fluxo real:

Você tem **3 formas práticas** para usar no dia a dia, mantendo a URL `https://api.corporate-cloud.io` 100% intacta no seu frontend:

---

### 🥇 Opção 1: No ponto de entrada do seu Microfrontend Local (Mais Recomendado)

Como você já faz o override do seu microfrontend apontando para o seu localhost via import map, basta adicionar uma única linha no topo do arquivo principal dele (ex: `src/main.ts`, `src/index.ts` ou `src/root.component.tsx`):

```javascript
// Carrega o interceptor direto do BackOverrides
import('http://localhost:8888/__back-overrides/client.js');
```

Ou usando o pacote `@back-overrides/client` instalado:

```typescript
import { setupBackOverrides } from '@back-overrides/client';

setupBackOverrides({
  cliUrl: 'http://localhost:8888',
  autoSync: true // Sincroniza regras automaticamente se você editar o back-overrides.json
});
```

**O que acontece:**
1. Quando a página `https://portal.corporate-cloud.io` carrega seu microfrontend via import map, o interceptor inicia em memória.
2. Seu código continua fazendo `fetch('https://api.corporate-cloud.io/bff/core/v1/...')` normalmente.
3. Em tempo de execução no navegador, o interceptor detecta a regra e redireciona a chamada para o seu backend local na porta `8080`.
4. Todas as outras chamadas (para outros microsserviços ou APIs remotas) continuam indo direto para a API remota oficial.
5. **Zero alterações de URL base no projeto e zero impacto no shell central.**

---

### 🥈 Opção 2: Extensão de Navegador Chrome/Edge (Zero código no projeto)

Se você preferir não colocar nenhuma linha de código no seu microfrontend:

1. No Chrome ou Edge, acesse: `chrome://extensions`
2. No canto superior direito, ative a chave **"Modo do desenvolvedor"** (Developer mode).
3. Clique em **"Carregar sem compactação"** (Load unpacked).
4. Selecione a pasta:
   ```text
   /caminho/do/projeto/BackOverridesApp/packages/extension
   ```
5. Pronto!
   - A extensão usa `chrome.declarativeNetRequest` em nível de rede do navegador.
   - Qualquer requisição para `https://api.corporate-cloud.io/bff/core/v1*` é redirecionada para `http://localhost:8080/bff/core/v1*`.
   - A extensão injeta cabeçalhos de CORS e PNA automaticamente, liberando a chamada.

---

### 🥉 Opção 3: Teste Rápido via Console do DevTools

Se o portal `https://portal.corporate-cloud.io` já está aberto no seu navegador:

1. Pressione **F12** (ou `Cmd+Option+I` no Mac) e vá na aba **Console**.
2. Cole e aperte **Enter**:
   ```javascript
   fetch('http://localhost:8888/__back-overrides/client.js').then(r => r.text()).then(eval)
   ```
3. Você verá a confirmação:
   ```text
   ⚡ [BackOverrides] In-Browser Interceptor Activated!
   Connected to CLI at: http://localhost:8888
   ```
4. Para desligar a qualquer momento: dê refresh na página ou digite `window.__BACK_OVERRIDES__.restore()`.

---

## 🏛️ Arquitetura Modular (Monorepo)

O projeto é estruturado em monorepo com npm workspaces:

```
BackOverridesApp/
├── packages/
│   ├── core/         # @back-overrides/core: 100% puro TypeScript, agnóstico de ambiente (sem dependências de Node)
│   │                 # Contém o RouteMatcher (rotas relativas e URLs absolutas), gerador de CORS/PNA e validação de schema.
│   ├── client/       # @back-overrides/client: Biblioteca TypeScript e bundle autônomo para o navegador
│   │                 # Interceptores de window.fetch, XMLHttpRequest e Service Worker.
│   ├── extension/    # packages/extension: Extensão de Navegador Manifest V3 para Chrome e Edge
│   │                 # Interceptação nativa via chrome.declarativeNetRequest com interface popup.
│   └── cli/          # @back-overrides/cli: Proxy reverso local em Node.js com visual colorido no terminal
└── examples/         # Demonstração ponta a ponta com mocks de API remota e serviço local.
```

---

## 🚀 Instalação e Build

### Pré-requisitos
- Node.js 18+
- npm 9+

```bash
# Instalar dependências de todos os workspaces
npm install

# Compilar todos os pacotes (core, client e cli)
npm run build

# Executar suíte completa de testes unitários e de integração
npm test
```

---

## ⚙️ Configuração Declarativa (`back-overrides.json`)

Você define suas regras em um arquivo central `back-overrides.json` na raiz do seu projeto:

```json
{
  "port": 8888,
  "remote": "https://api.corporate-cloud.io",
  "local": "http://localhost:8080",
  "cors": {
    "enabled": true,
    "credentials": true
  },
  "overrides": [
    {
      "methods": ["*"],
      "path": "/bff/core/v1/oauth2/loginUrl",
      "description": "Redireciona loginUrl para localhost:8080"
    },
    {
      "methods": ["*"],
      "path": "/bff/core/v1/oauth2/authorize",
      "description": "Redireciona authorize para localhost:8080"
    },
    {
      "methods": ["*"],
      "path": "/bff/core/v1/oauth2/profile/{scope}/me",
      "description": "Redireciona profile dinâmico (suporta {scope} e :scope) para localhost:8080"
    },
    {
      "methods": ["*"],
      "path": "/bff/core/v1/oauth2/tokenRequest",
      "description": "Redireciona tokenRequest para localhost:8080"
    },
    {
      "methods": ["*"],
      "path": "/bff/core/v1/oauth2/logout",
      "description": "Redireciona logout para localhost:8080"
    }
  ]
}
```

---

## 💻 Comandos da CLI

### 1. Iniciar o Proxy
```bash
# Usando o arquivo de configuração
node packages/cli/dist/cli.js -c back-overrides.json

# Ou passando parâmetros diretos (sem arquivo)
node packages/cli/dist/cli.js \
  -p 8888 \
  -r https://api.corporate-cloud.io \
  -l http://localhost:8080 \
  -o "/bff/core/v1*"
```

### 2. Gerar Snippets de Injeção
Para exibir os snippets prontos para copiar e colar no console ou no seu frontend:
```bash
node packages/cli/dist/cli.js snippet -p 8888
```

### 3. Inspecionar Regras Carregadas
```bash
node packages/cli/dist/cli.js list -c back-overrides.json
```

---

## 🧪 Demonstração Prática Automatizada

Para ver o BackOverrides funcionando em tempo real com servidores de teste:

```bash
./examples/run-demo.sh
```

O script inicia:
1. Um mock de **API Remota** na porta `4000`.
2. Um mock de **Serviço Local** na porta `3000`.
3. O **BackOverrides Proxy** na porta `8080`.
4. Executa requisições via `curl` demonstrando:
   - `GET /v1/users` -> respondido pela API Remota.
   - `POST /v1/users` -> interceptado e respondido pelo Serviço Local.
   - `OPTIONS /v1/users` -> respondido com status 204 e cabeçalhos de CORS e PNA.
   - `GET /v1/users/42?filter=active` -> interceptado preservando parâmetros dinâmicos e query strings.

---

## 🛡️ Suporte a Certificados SSL Corporativos (Intranet / VPN)
O BackOverrides é configurado por padrão com `secure: false` para chamadas HTTPS remotas, aceitando certificados privados de redes corporativas (como `*.corporate-cloud.io`), eliminando falhas como `unable to verify leaf certificate`.

# ⚡ BackOverrides

> Selective remote API endpoint interceptor and local redirector to `localhost` with automated, transparent resolution of CORS and Private Network Access (PNA) for integrated behavior testing.

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
[![@back-overrides/mcp](https://img.shields.io/npm/v/@back-overrides/mcp?label=%40back-overrides%2Fmcp&color=8b5cf6&logo=npm)](https://www.npmjs.com/package/@back-overrides/mcp)
[![MCP Protocol](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-8b5cf6?logo=anthropic&logoColor=white)](https://modelcontextprotocol.io)
[![Chrome Extension](https://img.shields.io/badge/extension-Chrome%20%2F%20Edge-a855f7?logo=googlechrome&logoColor=white)](https://github.com/KsAkira10/BackOverridesApp/releases/latest)

</div>

> 📖 **Interactive Online Documentation:** Visit our full GitHub Pages portal with live real-time routing simulator and guides: **[https://ksakira10.github.io/BackOverridesApp/](https://ksakira10.github.io/BackOverridesApp/)**  
> 🤝 **Contributing:** Read our [Contribution Guide](./CONTRIBUTING.en.md) for PR workflows, guardrails, and Copilot code review.

---

## 💡 About the Project

When developing or testing a frontend feature against a remote environment (production, staging, or QA), developers often need to validate **just one specific endpoint** running on their local backend (e.g., `POST /v1/users` on `localhost:3000` or a local BFF on port `8080`), while all other application endpoints continue being served by the official remote APIs (`https://api.corporate-cloud.io`).

Doing this directly in the browser introduces **three major network roadblocks**:
1. **CORS and PNA (Private Network Access) Restrictions**: When the frontend runs on a public HTTPS origin (e.g., `https://portal.corporate-cloud.io`), modern browsers block direct requests to `localhost`, requiring `Access-Control-Allow-Private-Network: true` and permissive `Access-Control-Allow-Origin` headers.
2. **Frontend URL Coupling**: Changing the API base URL in the frontend requires modifying `.env` files, rebuilding code, or introducing fragile development conditionals that risk leaking into production.
3. **Complex Distributed Environments**: In Microfrontend architectures (such as Single-SPA), the root portal runs in production/staging while only a single microfrontend is overridden locally via import maps.

**BackOverrides** solves this via an **environment-agnostic TypeScript Core**, an **intelligent CLI Reverse Proxy**, an **In-Browser / Service Worker Interceptor**, and a **Chrome/Edge Browser Extension (Manifest V3)**.

---

## 🏢 Real-World Scenario: Single-SPA + Import Maps + BFF + Microservices

This is the most common real-world architecture in modern microfrontend development:

```
                  ┌─────────────────────────────────────────────────────────┐
                  │             Browser (Google Chrome / Edge)              │
                  │                                                         │
                  │  Page: https://portal.corporate-cloud.io (Single-SPA)   │
                  │  Import Map Override points MFE -> http://localhost     │
                  └───────────────────────────┬─────────────────────────────┘
                                              │
                        fetch('https://api.corporate-cloud.io/...')
                                              │
                      ┌───────────────────────▼────────────────────────┐
                      │              BackOverrides Interceptor         │
                      │   (In-Browser Client / Extension / CLI Proxy)  │
                      └───────────────┬────────────────┬───────────────┘
                                      │                │
                        /bff/core/v1  │                │  Any other endpoint
                      (Override Rule) │                │  (Auth, Catalog, etc.)
                                      ▼                ▼
                         ┌─────────────────┐      ┌─────────────────────────────┐
                         │    LOCAL BFF    │      │         REMOTE API          │
                         │  localhost:8080 │      │  api.corporate-cloud.io     │
                         └─────────────────┘      └─────────────────────────────┘
```

### How to use BackOverrides in this workflow:

You have **3 practical methods**, keeping the URL `https://api.corporate-cloud.io` 100% untouched in your frontend:

---

### 🥇 Option 1: In your Local Microfrontend Entrypoint (Recommended)

Since you already override your microfrontend to point to localhost via import maps, simply add a single line at the top of its entrypoint file (e.g., `src/main.ts`, `src/index.ts`, or `src/root.component.tsx`):

```javascript
// Load the interceptor directly from the running BackOverrides CLI
import('http://localhost:8888/__back-overrides/client.js');
```

Or using the installed `@back-overrides/client` package:

```typescript
import { setupBackOverrides } from '@back-overrides/client';

setupBackOverrides({
  cliUrl: 'http://localhost:8888',
  autoSync: true // Automatically syncs rules if you edit back-overrides.json
});
```

**How it works:**
1. When `https://portal.corporate-cloud.io` loads your microfrontend via import map, the interceptor initializes in memory.
2. Your code continues calling `fetch('https://api.corporate-cloud.io/bff/core/v1/...')` normally.
3. At runtime in the browser, the interceptor matches the rule and redirects the request to your local backend on port `8080`.
4. All other calls (to other microservices or remote APIs) continue going directly to the official remote API.
5. **Zero base URL changes in the project and zero impact on the central shell.**

---

### 🥈 Option 2: Chrome/Edge Browser Extension (Zero code changes)

If you prefer not to add any code to your microfrontend:

1. In Chrome or Edge, navigate to: `chrome://extensions`
2. In the top right corner, toggle **"Developer mode"** ON.
3. Click **"Load unpacked"**.
4. Select the directory:
   ```text
   /path/to/BackOverridesApp/packages/extension
   ```
5. Done!
   - The extension uses `chrome.declarativeNetRequest` at the browser network layer.
   - Any request matching `https://api.corporate-cloud.io/bff/core/v1*` is redirected to `http://localhost:8080/bff/core/v1*`.
   - The extension injects CORS and PNA headers automatically, allowing the request.
   - Supports **`main_frame`**: intercepts full-page redirects like OAuth `/authorize` without altering frontend code!

---

### 🥉 Option 3: Quick Test via Browser DevTools Console

If the portal `https://portal.corporate-cloud.io` is already open in your browser:

1. Press **F12** (or `Cmd+Option+I` on Mac) and open the **Console** tab.
2. Paste and press **Enter**:
   ```javascript
   fetch('http://localhost:8888/__back-overrides/client.js').then(r => r.text()).then(eval)
   ```
3. You will see confirmation:
   ```text
   ⚡ [BackOverrides] In-Browser Interceptor Activated!
   Connected to CLI at: http://localhost:8888
   ```
4. To deactivate at any time: refresh the page or run `window.__BACK_OVERRIDES__.restore()`.

---

## 🏛️ Modular Architecture (Monorepo)

The repository is structured as an npm workspaces monorepo:

```
BackOverridesApp/
├── packages/
│   ├── core/         # @back-overrides/core: 100% pure TypeScript, environment-agnostic (no Node dependencies)
│   │                 # Contains RouteMatcher (relative routes & absolute URLs), CORS/PNA generator, schema validation.
│   ├── client/       # @back-overrides/client: In-browser TypeScript library and standalone bundle
│   │                 # Interceptors for window.fetch, XMLHttpRequest, and Service Worker.
│   ├── extension/    # packages/extension: Manifest V3 Browser Extension for Chrome and Edge
│   │                 # Native network interception via chrome.declarativeNetRequest with popup UI.
│   └── cli/          # @back-overrides/cli: Local Node.js reverse proxy with colored terminal output and diagnostics
├── docs/             # GitHub Pages documentation site with interactive live playground
└── examples/         # End-to-end runnable demos with remote API mocks and Single-SPA portal.
```

---

## 🚀 Installation and Build

### Prerequisites
- Node.js 18+
- npm 9+

```bash
# Install all dependencies across workspaces
npm install

# Build all packages (core, client, cli)
npm run build

# Run test suite
npm test
```

---

## ⚙️ Declarative Configuration (`back-overrides.json`)

Define your override rules in a central `back-overrides.json` file:

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
      "description": "Redirects loginUrl to localhost:8080"
    },
    {
      "methods": ["*"],
      "path": "/bff/core/v1/oauth2/authorize",
      "description": "Redirects authorize to localhost:8080"
    },
    {
      "methods": ["*"],
      "path": "/bff/core/v1/oauth2/profile/{scope}/me",
      "description": "Dynamic route parameters (supports {scope} and :scope)"
    },
    {
      "methods": ["*"],
      "path": "/bff/core/v1/oauth2/tokenRequest",
      "description": "Redirects tokenRequest to localhost:8080"
    },
    {
      "methods": ["*"],
      "path": "/bff/core/v1/oauth2/logout",
      "description": "Redirects logout to localhost:8080"
    }
  ]
}
```

---

## 💻 CLI Commands

### 1. Start the Proxy
```bash
# Using a configuration file
node packages/cli/dist/cli.js -c back-overrides.json

# Or passing direct command-line arguments (without file)
node packages/cli/dist/cli.js \
  -p 8888 \
  -r https://api.corporate-cloud.io \
  -l http://localhost:8080 \
  -o "/bff/core/v1*"
```

### 2. Generate Injection Snippets
Display ready-to-copy code snippets for DevTools console or frontend files:
```bash
node packages/cli/dist/cli.js snippet -p 8888
```

### 3. Inspect Loaded Rules
```bash
node packages/cli/dist/cli.js list -c back-overrides.json
```

### 4. MCP Server for AI Agents (GitHub Copilot, Claude, Cursor)
```bash
# Start MCP server over stdio
node packages/cli/dist/cli.js mcp
# or
npm run mcp
```

---

## 🤖 Connect with AI Agents (Model Context Protocol - MCP)

**BackOverrides** natively implements the [Model Context Protocol (MCP)](https://modelcontextprotocol.io) open standard, enabling intelligent assistants like **GitHub Copilot Chat in VS Code**, **Claude Desktop**, **Cursor**, and **Antigravity** to interact with, manage, and test BackOverrides.

### 🌟 What AI agents can do with BackOverrides MCP:
- 🔄 **Lifecycle management:** Start, stop, and verify proxy health (`back_overrides_start`, `back_overrides_stop`, `back_overrides_status`).
- ✍️ **Rules manipulation:** Inspect and add/toggle endpoint override rules in `back-overrides.json` (`back_overrides_list_rules`, `back_overrides_add_rule`, `back_overrides_toggle_rule`).
- 🚀 **Launch browser with preloaded extension:** Open Chrome/Brave/Edge with `--load-extension` for instant zero-config testing (`back_overrides_launch_browser`).
- 🧪 **Simulate route matching & CORS:** Test how any URL/method is routed and what CORS headers are applied before making requests (`back_overrides_test_route`).
- 📋 **Generate frontend snippets:** Obtain ready-to-use DevTools console one-liners or script tags (`back_overrides_get_snippets`).

### ⚙️ Automated VS Code Setup (GitHub Copilot):
The repository includes `.vscode/mcp.json` preconfigured:
```json
{
  "mcpServers": {
    "back-overrides": {
      "command": "node",
      "args": ["packages/mcp/dist/index.js"]
    }
  }
}
```
For more details and instructions for Claude Desktop and Cursor, check out [@back-overrides/mcp documentation](./packages/mcp/README.md).

## 🧪 Automated Demos

### Demo 1: REST Microservices
```bash
npm run demo
```
Starts remote mock (port 4000), local service (port 3000), and BackOverrides proxy (port 8080) running automated validation queries.

### Demo 2: Single-SPA Portal + Fake BFF
```bash
npm run demo:single-spa
```
Starts remote cloud BFF (port 9001), local dev BFF (port 8080), and BackOverrides proxy (port 8889) with a graphical Single-SPA app shell viewable at `examples/single-spa-demo/index.html`.

---

## 🛡️ Corporate SSL Certificates Support (VPN / Intranet)
BackOverrides defaults to `secure: false` for remote HTTPS requests, accepting private corporate network certificates (such as `*.corporate-cloud.io`) and eliminating errors like `unable to verify leaf certificate`.

# BackOverrides Chrome Extension (Manifest V3)

> 🌐 **Language / Idioma:** [🇧🇷 Português](./README.md) | [🇺🇸 English](./README.en.md)

[![Latest Release](https://img.shields.io/github/v/release/KsAkira10/BackOverridesApp?label=release&color=10b981&logo=github)](https://github.com/KsAkira10/BackOverridesApp/releases/latest)
[![Release Candidate](https://img.shields.io/github/v/tag/KsAkira10/BackOverridesApp?include_prereleases&label=rc&color=f59e0b&logo=github)](https://github.com/KsAkira10/BackOverridesApp/releases)
[![Extension Manifest](https://img.shields.io/badge/extension-Manifest%20V3-a855f7?logo=googlechrome&logoColor=white)](https://github.com/KsAkira10/BackOverridesApp/releases/latest)
[![Docs](https://img.shields.io/badge/docs-GitHub%20Pages-38bdf8?style=flat&logo=githubpages&logoColor=white)](https://ksakira10.github.io/BackOverridesApp/#extension)

> 📖 **Full Documentation:** [https://ksakira10.github.io/BackOverridesApp/#extension](https://ksakira10.github.io/BackOverridesApp/#extension)

This extension intercepts network traffic directly at the browser network layer (using `chrome.declarativeNetRequest`), providing:
- **Redirection of asynchronous endpoints (`fetch` / `XMLHttpRequest`)** without changing API URLs in frontend code.
- **Redirection of full-page top-level navigations (`main_frame`)**, such as OAuth login flows (`window.location.href = .../authorize`), routing the browser transparently to your local BFF.
- **Automatic CORS & PNA resolution**, injecting permissive headers for `localhost`.

---

## 🚀 How to Install in Google Chrome / Microsoft Edge (Developer Mode)

1. Open Chrome and navigate to:
   ```
   chrome://extensions/
   ```
2. In the top right corner, enable **"Developer mode"**.
3. Click the **"Load unpacked"** button.
4. Select this directory:
   ```
   packages/extension
   ```
   (Or the absolute path: `/path/to/BackOverridesApp/packages/extension`)
5. Done! The **BackOverrides** lightning bolt icon will appear in your extension toolbar.

---

## 🔄 Synchronization with the CLI & Quick Launch Helper

1. Start the BackOverrides CLI proxy in your project directory:
   ```bash
   # Recommended (no installation required):
   npx @back-overrides/cli

   # In this monorepo:
   npm start

   # Or using your package manager of choice:
   pnpm dlx @back-overrides/cli
   bunx @back-overrides/cli
   ```
2. **1-Click Launch Helper Card (CLI Offline):** If the CLI proxy is not yet running, both the popup and Studio display an interactive card with 1-click preset command buttons (`📋 Copy`).
3. **Real-Time Auto-Detection & Auto-Sync:** While the popup is open, it checks the local proxy every 2 seconds. The moment the CLI starts in your terminal, the extension transitions to green and synchronizes all active rules automatically without manual refresh!
4. **Manual Sync:** Whenever you modify rules in `back-overrides.json`, click **"🔄 Sincronizar com CLI"** in the popup or Studio anytime.

---

## ⚡ BackOverrides Studio & `content-script.js` Generator

The extension provides a full-featured management and code generation studio:
- **Access:** Right-click the extension icon and select **Options**, or click **"⚙️ Studio & Gerador de Content Script"** in the popup.
- **Rule Management:** Add custom rules (source, target, allowed HTTP methods, description) or import active rules from the CLI with a single click.
- **`content-script.js` Generator:** Dynamically generates ready-to-use in-page interceptor scripts with options for static fallbacks, polling, and styled DevTools console logs.
- **Instant Reload Actions:**
  - **⚡ Reload Extension:** Triggers `chrome.runtime.reload()` immediately, updating `content-script.js`, background worker, and declarative rules without opening `chrome://extensions`.
  - **🔄 Reload Active Tab:** Refreshes the active web page with cache bypass so the updated content script executes right at `document_start`.

---

## 🛡️ Advantages over in-page script injection (`@back-overrides/client`)

| Scenario | Script Injection (`@back-overrides/client`) | Chrome Extension (`packages/extension`) |
| :--- | :---: | :---: |
| Intercept `fetch()` & `axios` | ✅ Yes | ✅ Yes |
| Intercept `XMLHttpRequest` | ✅ Yes | ✅ Yes |
| Intercept `window.location.href = ...` (OAuth login) | ❌ No (blocked by browser security) | ✅ **Yes (`main_frame`)** |
| Requires frontend code modifications | ⚠️ Requires script import | ❌ **Zero code changes** |

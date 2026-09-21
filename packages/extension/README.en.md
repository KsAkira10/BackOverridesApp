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

## 🔄 Synchronization with the CLI

1. Start the BackOverrides CLI proxy:
   ```bash
   back-overrides -c back-overrides.json
   ```
2. The extension automatically syncs with the CLI (`http://localhost:8888`) upon startup.
3. If you edit rules in your JSON file, open the extension popup and click:
   **"🔄 Sincronizar com CLI (localhost:8888)"** (or use the automatic refresh).

---

## 🛡️ Advantages over in-page script injection (`@back-overrides/client`)

| Scenario | Script Injection (`@back-overrides/client`) | Chrome Extension (`packages/extension`) |
| :--- | :---: | :---: |
| Intercept `fetch()` & `axios` | ✅ Yes | ✅ Yes |
| Intercept `XMLHttpRequest` | ✅ Yes | ✅ Yes |
| Intercept `window.location.href = ...` (OAuth login) | ❌ No (blocked by browser security) | ✅ **Yes (`main_frame`)** |
| Requires frontend code modifications | ⚠️ Requires script import | ❌ **Zero code changes** |

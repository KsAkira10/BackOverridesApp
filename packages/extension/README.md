# BackOverrides Chrome Extension (Manifest V3)

> 🌐 **Language / Idioma:** [🇧🇷 Português](./README.md) | [🇺🇸 English](./README.en.md)

[![Latest Release](https://img.shields.io/github/v/release/KsAkira10/BackOverridesApp?include_prereleases=false&label=release&color=10b981&logo=github)](https://github.com/KsAkira10/BackOverridesApp/releases/latest)
[![Release Candidate](https://img.shields.io/github/v/release/KsAkira10/BackOverridesApp?include_prereleases=true&label=rc&color=f59e0b&logo=github)](https://github.com/KsAkira10/BackOverridesApp/releases)
[![Extension Manifest](https://img.shields.io/badge/extension-Manifest%20V3-a855f7?logo=googlechrome&logoColor=white)](https://github.com/KsAkira10/BackOverridesApp/releases/latest)
[![Docs](https://img.shields.io/badge/docs-GitHub%20Pages-38bdf8?style=flat&logo=githubpages&logoColor=white)](https://ksakira10.github.io/BackOverridesApp/#extension)

> 📖 **Documentação Completa:** [https://ksakira10.github.io/BackOverridesApp/#extension](https://ksakira10.github.io/BackOverridesApp/#extension)

Esta extensão intercepta requisições de rede diretamente na camada de rede do navegador (via `chrome.declarativeNetRequest`), permitindo:
- **Redirecionamento de endpoints assíncronos (`fetch` / `XMLHttpRequest`)** sem trocar URLs no frontend.
- **Redirecionamento de navegações de tela cheia (`main_frame`)**, como o fluxo de login OAuth (`window.location.href = .../authorize`), enviando o navegador para o seu BFF local de forma transparente.
- **Resolução automática de CORS**, injetando cabeçalhos permissivos para o `localhost`.

---

## 🚀 Como Instalar no Google Chrome (Modo Desenvolvedor)

1. Abra o Google Chrome e acesse:
   ```
   chrome://extensions/
   ```
2. No canto superior direito, ative a chave **"Modo do desenvolvedor"** (*Developer mode*).
3. Clique no botão **"Carregar sem compactação"** (*Load unpacked*).
4. Selecione esta pasta:
   ```
   packages/extension
   ```
   (Ou o caminho absoluto: `/Users/akira/Developer/akira/antigravity/BackOverridesApp/packages/extension`)
5. Pronto! O ícone do **BackOverrides** aparecerá na sua barra de extensões.

---

## 🔄 Sincronização com o CLI & Studio

1. Inicie o BackOverrides CLI normalmente:
   ```bash
   back-overrides -c back-overrides.json
   ```
2. A extensão sincroniza automaticamente com o CLI (`http://localhost:8888`) ao carregar.
3. Se você alterar regras no arquivo JSON, abra o popup da extensão e clique em:
   **"🔄 Sincronizar com CLI (localhost:8888)"**.

---

## ⚡ BackOverrides Studio & Gerador de `content-script.js`

A extensão conta com uma tela completa de configuração e gerador de código:
- **Acesso:** Clique com o botão direito no ícone da extensão e selecione **Opções**, ou clique em **"⚙️ Studio & Gerador de Content Script"** no popup da extensão.
- **Configuração de Regras:** Adicione regras individuais (origem, destino, métodos HTTP permitidos e descrição) ou importe regras ativas do CLI com um clique.
- **Gerador de `content-script.js`:** Gera dinamicamente o código do script com opções de fallback estático, polling automático e logs detalhados de rede no Console.
- **Reload Facilitado:**
  - **⚡ Recarregar Extensão:** Executa `chrome.runtime.reload()` instantaneamente, recarregando `content-script.js`, service worker e regras sem precisar ir em `chrome://extensions`.
  - **🔄 Recarregar Aba:** Recarrega a aba ativa do navegador (com bypass de cache) para injetar o script atualizado no `document_start`.

---

## 🛡️ Vantagens sobre a injeção de script (`@back-overrides/client`)

| Cenário | Script Injetado (`@back-overrides/client`) | Extensão Chrome (`packages/extension`) |
| :--- | :---: | :---: |
| Interceptar `fetch()` e `axios` | ✅ Sim | ✅ Sim |
| Interceptar `XMLHttpRequest` | ✅ Sim | ✅ Sim |
| Interceptar `window.location.href = ...` (OAuth login) | ❌ Não (bloqueado pelo browser) | ✅ **Sim (`main_frame`)** |
| Necessidade de alterar código do frontend | ⚠️ Requer importação do script | ❌ **Zero código alterado** |

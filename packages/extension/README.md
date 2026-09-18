# BackOverrides Chrome Extension (Manifest V3)

> 🌐 **Language / Idioma:** [🇧🇷 Português](./README.md) | [🇺🇸 English](./README.en.md)

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

## 🔄 Sincronização com o CLI

1. Inicie o BackOverrides CLI normalmente:
   ```bash
   back-overrides -c back-overrides.json
   ```
2. A extensão sincroniza automaticamente com o CLI (`http://localhost:8888`) ao carregar.
3. Se você alterar regras no arquivo JSON, abra o popup da extensão e clique em:
   **"🔄 Sincronizar com CLI (localhost:8888)"**.

---

## 🛡️ Vantagens sobre a injeção de script (`@back-overrides/client`)

| Cenário | Script Injetado (`@back-overrides/client`) | Extensão Chrome (`packages/extension`) |
| :--- | :---: | :---: |
| Interceptar `fetch()` e `axios` | ✅ Sim | ✅ Sim |
| Interceptar `XMLHttpRequest` | ✅ Sim | ✅ Sim |
| Interceptar `window.location.href = ...` (OAuth login) | ❌ Não (bloqueado pelo browser) | ✅ **Sim (`main_frame`)** |
| Necessidade de alterar código do frontend | ⚠️ Requer importação do script | ❌ **Zero código alterado** |

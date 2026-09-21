# @back-overrides/mcp

> 🌐 **Model Context Protocol (MCP) Server for BackOverridesApp**  
> Conecte agentes de Inteligência Artificial (**GitHub Copilot**, **Claude Desktop**, **Cursor**, **Windsurf**, **Antigravity**) diretamente ao BackOverrides.

[![Latest Release](https://img.shields.io/github/v/release/KsAkira10/BackOverridesApp?include_prereleases=false&label=release&color=10b981&logo=github)](https://github.com/KsAkira10/BackOverridesApp/releases/latest)
[![MCP Protocol](https://img.shields.io/badge/MCP-2024--11--05-8b5cf6?logo=anthropic&logoColor=white)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 💡 O que é o Servidor MCP do BackOverrides?

O **servidor MCP** expõe o ecossistema do BackOverrides para assistentes de IA através de um protocolo padrão aberto (Model Context Protocol). Com ele ativo, seu agente (como o **GitHub Copilot Chat** no VS Code) pode:

1. 🔍 **Inspecionar e Diagnosticar:** Verificar se o proxy está rodando, em qual porta e com quais regras ativas.
2. 🚀 **Controlar o Ciclo de Vida:** Iniciar, parar ou reiniciar o proxy em segundo plano sem que você precise abrir outro terminal.
3. 🛠️ **Manipular Regras:** Consultar, adicionar novas regras ou desativar regras existentes no `back-overrides.json`.
4. 🌐 **Facilitar a Extensão do Navegador:** Obter o caminho exato e instruções da extensão Manifest V3, ou **abrir o Google Chrome automaticamente** com a extensão já carregada via flag `--load-extension`.
5. 🧪 **Simular Rotas e CORS:** Testar como uma URL (ex: endpoint de login OAuth) será interceptada e quais cabeçalhos CORS serão injetados antes mesmo de executar o frontend.
6. 📋 **Fornecer Snippets Rápidos:** Obter comandos prontos para injeção via DevTools Console (`fetch(...).then(eval)`), tag `<script>` ou módulo TypeScript/Vite.

---

## ⚡ Início Rápido

### 1. GitHub Copilot no VS Code (Nativo e Automático)

O BackOverridesApp inclui o arquivo `.vscode/mcp.json` na raiz do projeto:

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

Ao abrir o repositório no **VS Code** com a extensão **GitHub Copilot Chat**, o servidor MCP será detectado automaticamente. Você pode pedir no chat:

> *"Verifique se o proxy do BackOverrides está rodando e liste as regras ativas."*  
> *"Adicione uma regra de override para o endpoint /bff/v1/pagamentos/* direcionando para o BFF local."*  
> *"Abra o Chrome com a extensão do BackOverrides carregada para testar o login."*

---

### 2. Claude Desktop

Adicione ao seu arquivo de configuração do Claude (`~/Library/Application Support/Claude/claude_desktop_config.json` no macOS ou `%APPDATA%\Claude\claude_desktop_config.json` no Windows):

```json
{
  "mcpServers": {
    "back-overrides": {
      "command": "node",
      "args": ["/caminho/absoluto/para/BackOverridesApp/packages/mcp/dist/index.js"]
    }
  }
}
```

---

### 3. Cursor ou Windsurf

Crie ou edite `.cursor/mcp.json`:

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

---

### 4. Executando via CLI

Você também pode iniciar o servidor MCP manualmente pelo terminal:

```bash
# Via comando nativo da CLI BackOverrides:
back-overrides mcp

# Ou diretamente pelo script do pacote:
npm run mcp
```

---

## 🧰 Ferramentas Disponíveis (MCP Tools)

| Ferramenta | Descrição | Parâmetros |
| :--- | :--- | :--- |
| `back_overrides_status` | Retorna o status do proxy (online/offline, porta, PID, uptime, regras ativas). | *(Nenhum)* |
| `back_overrides_start` | Inicia o proxy BackOverrides em background se não estiver rodando. | `configPath?`, `port?`, `remote?`, `local?` |
| `back_overrides_stop` | Finaliza de forma limpa o processo do proxy ativo. | *(Nenhum)* |
| `back_overrides_restart` | Reinicia o proxy aplicando as alterações de configuração. | `configPath?` |
| `back_overrides_list_rules` | Lista todas as regras de override, métodos, URLs destino e estado. | `configPath?` |
| `back_overrides_add_rule` | Adiciona ou atualiza uma regra no arquivo `back-overrides.json`. | `path`, `methods?`, `target?`, `description?`, `disabled?`, `prepend?` |
| `back_overrides_toggle_rule` | Ativa ou desativa uma regra existente por índice ou caminho. | `pathOrIndex`, `disabled?` |
| `back_overrides_test_route` | Simula como uma requisição (URL + método) será tratada e seus cabeçalhos CORS. | `url`, `method?`, `origin?` |
| `back_overrides_extension_info` | Retorna o caminho de `packages/extension`, manifesto e passos de instalação. | *(Nenhum)* |
| `back_overrides_launch_browser` | Abre o navegador (Chrome/Brave/Edge) já com a extensão carregada (`--load-extension`). | `url?`, `browser?`, `isolatedProfile?` |
| `back_overrides_get_snippets` | Retorna snippets de injeção direta (DevTools Console, HTML `<script>`, Vite). | `port?` |
| `back_overrides_configure_mcp` | Gera ou atualiza `.vscode/mcp.json` para conexão com GitHub Copilot. | *(Nenhum)* |

---

## 📚 Recursos Expostos (MCP Resources)

Os agentes podem consultar recursos diretamente usando URIs do protocolo:

- `back-overrides://status`: JSON com o status operacional em tempo real do proxy.
- `back-overrides://config`: Conteúdo atualizado do arquivo `back-overrides.json`.
- `back-overrides://extension`: Metadados, versão do manifesto e guia da extensão Chrome.
- `back-overrides://snippets`: Snippets de injeção no navegador e frontend prontos para uso.

---

## 💬 Prompts Integrados (MCP Prompts)

O servidor disponibiliza modelos de prompt predefinidos:

- **`diagnose-interception`**: Diagnostica problemas de rede, avalia correspondência de rota com `back_overrides_test_route` e sugere correções no CORS ou nas regras.
- **`setup-browser-extension`**: Conduz o desenvolvedor passo a passo para carregar a extensão no navegador ou iniciar via `back_overrides_launch_browser`.
- **`configure-oauth-bff`**: Orienta a configuração de interceptação de tela cheia para fluxos de autenticação OAuth2 e redirecionamento para BFF local.

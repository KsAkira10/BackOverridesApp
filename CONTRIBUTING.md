# Guia de Contribuição — BackOverrides

> 🌐 **Language / Idioma:** [🇧🇷 Português](./CONTRIBUTING.md) | [🇺🇸 English](./CONTRIBUTING.en.md)

Obrigado pelo interesse em contribuir com o **BackOverrides**! Este projeto é construído para desenvolvedores que valorizam agilidade, excelência técnica e integridade de arquitetura em ambientes corporativos e abertos.

---

## 🏛️ Modelos de Colaboração: InnerSource vs Outsource

O **BackOverrides** foi projetado para operar com excelência em dois modelos de desenvolvimento:

### 1. InnerSource (Dentro da Empresa / Entre Squads)
*InnerSource* é a aplicação das melhores práticas do código aberto dentro das fronteiras de uma organização:
- **Adeus aos Silos:** Qualquer engenheiro ou squad que utilize o BackOverrides para simular suas APIs pode sugerir melhorias, novos matchers ou suporte a novos protocolos diretamente via Pull Request, sem depender de uma fila centralizada de suporte.
- **Transparência e Autonomia:** O repositório centraliza os pacotes `@back-overrides/core`, `@back-overrides/client`, `@back-overrides/cli` e a extensão. As decisões de arquitetura e discussões são registradas em PRs e Issues abertas para toda a empresa.
- **Reuso Corporativo:** Evita que diferentes times criem soluções caseiras de proxy reverso e interceptação de CORS, unificando a governança técnica.

### 2. Outsource / Open Source (Comunidade Pública)
No modelo aberto sob licença **MIT**:
- **Colaboração Global:** Desenvolvedores do mundo todo colaboram adicionando compatibilidade com frameworks (Single-SPA, Module Federation, Next.js, Vite), navegadores (Chrome, Edge, Firefox) e novos padrões W3C (como Private Network Access).
- **Sanitização Absoluta:** Toda contribuição pública **deve ser rigorosamente agnóstica**, livre de domínios corporativos privados, tokens, credenciais ou lógicas proprietárias de empresas específicas.

---

## 🔄 Ciclo de Vida de uma Contribuição

```
   1. Fork / Branch   ──▶   2. Código & Testes   ──▶   3. Conventional Commits
          │                                                   │
          ▼                                                   ▼
   6. Merge na main   ◀──   5. Code Review (Copilot) ◀── 4. Pull Request (RC)
```

---

## 🛠️ Passo a Passo para Abrir um Pull Request

### Passo 1: Configurar o Ambiente Local

Certifique-se de ter o **Node.js 18+** e o **npm 9+** instalados:

```bash
# Clone seu fork ou o repositório
git clone https://github.com/KsAkira10/BackOverridesApp.git
cd BackOverridesApp

# Instale todas as dependências do monorepo
npm install

# Compile os pacotes TypeScript
npm run build

# Execute a suíte de testes
npm test
```

### Passo 2: Convenção de Branches & Release Candidates

Crie uma branch a partir da `main` utilizando os seguintes prefixos:

| Prefixo de Branch | Finalidade | Comportamento na Pipeline |
| :--- | :--- | :--- |
| `feat/<nome>` | Nova funcionalidade | Gera **Release Candidate** automático (`vX.Y.Z-rc.N`) |
| `fix/<nome>` | Correção de bug | Gera **Release Candidate** automático (`vX.Y.Z-rc.N`) |
| `docs/<nome>` | Alterações em documentação | Roda validações de CI |
| `refactor/<nome>` | Refatoração de código interno | Roda validações de CI |
| `chore/<nome>` | Manutenções e dependências | Roda validações de CI |

```bash
# Exemplo de criação de branch para nova feature
git checkout -b feat/graphql-support
```

### Passo 3: Padrão de Commits (Conventional Commits)

Nosso sistema de **Semantic Versioning (SemVer)** calcula as versões e gera o `CHANGELOG.md` automaticamente com base no padrão [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<escopo opcional>): <descrição no imperativo>
```

#### Tipos Permitidos:
- `feat`: Uma nova funcionalidade (incrementa **MINOR**, zera patch).
  - Exemplo: `feat(core): add support for regex path matching`
- `fix`: Uma correção de bug (incrementa **PATCH**).
  - Exemplo: `fix(cli): handle null origin in cors preflight`
- `docs`: Alterações na documentação ou READMEs.
  - Exemplo: `docs(extension): update installation steps`
- `style`: Formatação, ponto e vírgula, sem alteração de lógica.
- `refactor`: Mudança no código que não corrige bug nem adiciona funcionalidade.
- `perf`: Mudança focada em performance.
- `test`: Adição ou correção de testes.
- `chore`: Atualização de tarefas de build ou dependências.

#### 🚨 Breaking Changes (Mudanças Incompatíveis):
Para indicar que uma mudança quebra compatibilidade anterior (incrementa **MAJOR**, zerando minor e patch):
- Adicione `!` após o tipo/escopo:
  ```bash
  git commit -m "feat(core)!: change RouteRule signature to accept URL objects"
  ```
- Ou inclua `BREAKING CHANGE:` no rodapé do commit:
  ```text
  fix(cli): update default listening port

  BREAKING CHANGE: default port changed from 3000 to 8888.
  ```

### Passo 4: Guardrails de Qualidade e Segurança

Antes de abrir seu PR, valide localmente os 4 guardrails fundamentais:

1. **Testes Unitários:** Todos os testes devem passar:
   ```bash
   npm test
   ```
2. **Checagem de Versão SemVer:** Verifique como o SemVer interpreta seus commits:
   ```bash
   npm run release:check
   ```
3. **Prévia do Changelog:** Veja como seu commit aparecerá no changelog:
   ```bash
   npm run release:changelog
   ```
4. **Sanitização de Dados (Crítico):**
   - 🚫 **Nunca comite** tokens de acesso, credenciais, segredos de API ou certificados privados.
   - 🚫 **Nunca comite** URLs ou nomes de repositórios corporativos reais. Utilize sempre URLs genéricas nos exemplos e testes (ex.: `https://api.corporate-cloud.io` ou `http://localhost:8080`).

### Passo 5: Abrir o Pull Request

1. Abra o PR apontando para a branch `main`.
2. O template [.github/PULL_REQUEST_TEMPLATE.md](file:///Users/akira/Developer/akira/antigravity/BackOverridesApp/.github/PULL_REQUEST_TEMPLATE.md) será carregado automaticamente.
3. Preencha a descrição do que foi feito, anexe **evidências visuais (prints do terminal, aba Network ou gravações)** e preencha os passos de "Como Testar".
4. Preencha o checklist de guardrails (tipo de mudança, testes, sanitização).
5. A pipeline do GitHub Actions validará seus commits e executará os testes em Node.js 18, 20 e 22.
6. Caso sua branch seja `feat/*` ou `fix/*`, um **Release Candidate (`-rc.N`)** será publicado automaticamente para validação prévia!

---

## 🐛 Relatando Bugs ou Vulnerabilidades via Issues

Ao encontrar um comportamento inesperado ou brecha de segurança, abra uma Issue utilizando nossos templates dedicados:
- **[🐛 Relato de Bug](file:///Users/akira/Developer/akira/antigravity/BackOverridesApp/.github/ISSUE_TEMPLATE/bug_report.md):** Oriente os mantenedores com o fluxo exato passo a passo para reproduzir o problema, prints da aba Network/Console e logs de execução.
- **[🔒 Relato de Vulnerabilidade](file:///Users/akira/Developer/akira/antigravity/BackOverridesApp/.github/ISSUE_TEMPLATE/security_vulnerability.md):** Descreva a severidade estimada, componente afetado, fluxo de exploração (PoC) e sugestão de mitigação.
- **[💡 Sugestão de Funcionalidade](file:///Users/akira/Developer/akira/antigravity/BackOverridesApp/.github/ISSUE_TEMPLATE/feature_request.md):** Apresente a motivação da feature, exemplos de configuração e mockups/prints conceituais.

---

## 🤖 Revisão de Código com GitHub Copilot

Este repositório possui o **GitHub Copilot Code Review** habilitado com instruções de revisão especializadas ([`.github/copilot-instructions.md`](file:///Users/akira/Developer/akira/antigravity/BackOverridesApp/.github/copilot-instructions.md)).

Durante a revisão do seu PR, o Copilot verificará:
- **Compliance de Commits:** Se o título e mensagens respeitam o formato SemVer.
- **Sanitização de Segurança:** Ausência de dados sensíveis ou URLs corporativas internas.
- **Segurança de CORS:** Se headers `Access-Control-Allow-*` e Private Network Access estão corretos e seguros.
- **Extensão Manifest V3:** Boas práticas de Service Workers e regras declarativas de rede.
- **Cobertura de Testes:** Garantia de que novos recursos possuem testes unitários associados.

---

## 📦 Merge e Publicação Oficial

- Commits diretos na `main` **não geram versão nem tag**.
- Quando o seu Pull Request for aprovado e mergeado na `main`:
  1. A pipeline analisa todos os commits do PR.
  2. Resolve para a versão final estável (`vX.Y.Z`).
  3. Atualiza os `package.json` e o `CHANGELOG.md`.
  4. Publica a **GitHub Release Oficial** e os pacotes no **NPM**.

## 📌 Issue Relacionada / Related Issue

<!-- Se este PR resolve ou está relacionado a uma issue aberta, referencie aqui (ex.: Closes #12, Refs #8): -->
Closes #

---

## 📝 O que foi feito? / What was done?

<!--
Descreva de forma clara e objetiva o que este PR implementa, corrige ou melhora.
Explique o contexto, a motivação e como a solução foi desenhada.
-->

- 
- 
- 

---

## 🖼️ Evidências Visuais / Visual Evidence (Prints, Vídeos e Logs)

<!--
A inclusão de evidências visuais é FUNDAMENTAL para acelerar a revisão do PR!
Anexe aqui capturas de tela (screenshots), GIFs, gravações de tela ou trechos de logs:

Exemplos recomendados:
1. Print do terminal exibindo logs da CLI ou testes passando.
2. Print do DevTools (aba Network) mostrando o endpoint interceptado e os headers CORS.
3. Gravação demonstrando o comportamento na extensão do navegador ou no portal Single-SPA.

⚠️ LEMBRETE DE SANITIZAÇÃO: Mascare ou omita qualquer URL corporativa interna privada, token ou dado sensível!
-->

### Antes vs Depois (se aplicável):

| Antes da Mudança (Bug / Cenário Antigo) | Depois da Mudança (Corrigido / Nova Feature) |
| :---: | :---: |
| *(cole o print aqui)* | *(cole o print aqui)* |

### Logs de Execução / Console:
```text
(Cole aqui a saída relevante do terminal ou console do navegador)
```

---

## 🧪 Como Testar / How to Test

<!--
Forneça o passo a passo exato para que os revisores possam reproduzir e validar a alteração:

Exemplo:
1. Inicie a CLI local com o comando: `npm start -- --remote https://api.corporate-cloud.io --local http://localhost:8080`
2. Dispare a requisição: `curl -i http://localhost:8080/bff/core/v1/orders`
3. Verifique se o header `x-back-overrides-type: local-override` é retornado.
-->

1. 
2. 
3. 

---

## 🏷️ Tipo de Mudança / Type of Change

Marque as opções aplicáveis (essencial para o Semantic Versioning):

- [ ] `feat`: Nova funcionalidade (incrementa **MINOR**, zera patch)
- [ ] `fix`: Correção de bug (incrementa **PATCH**)
- [ ] `perf`: Melhoria de performance (incrementa **PATCH**)
- [ ] `docs`: Documentação, READMEs ou guias
- [ ] `refactor`: Refatoração sem alteração de comportamento público
- [ ] `test`: Adição ou ajuste de testes automatizados
- [ ] `chore`: Manutenção de dependências, build ou CI
- [ ] 🚨 **BREAKING CHANGE**: Quebra de compatibilidade pública (incrementa **MAJOR**)

---

## 🚨 Informações de Breaking Changes (se aplicável)

<!-- Se houver quebra de compatibilidade, preencha esta seção para orientar os usuários no CHANGELOG: -->
<!--
- **Impacto:** O que parou de funcionar como antes?
- **Guia de Migração:** O que o usuário ou projeto consumidor precisa alterar para se adaptar?
-->

---

## 🛡️ Checklist de Guardrails

Confirme que todos os itens foram verificados antes de solicitar aprovação:

- [ ] **Conventional Commits:** O título deste PR e as mensagens de commit seguem o padrão (ex.: `feat(cli): ...`, `fix(core): ...`).
- [ ] **Testes Locais:** Executei `npm test` e todos os testes (incluindo testes de SemVer) passaram sem erros.
- [ ] **Novos Testes Adicionados:** Adicionei testes unitários cobrindo o novo cenário ou bug corrigido.
- [ ] **Sanitização Rigorosa:** Confirmei que o código e os prints **NÃO** contêm dados sensíveis, credenciais ou URLs corporativas internas reais.
- [ ] **Documentação Atualizada:** Atualizei os READMEs ou documentação do GitHub Pages se necessário.

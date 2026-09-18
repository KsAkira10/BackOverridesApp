---
name: "🐛 Relato de Bug / Bug Report"
about: "Relate um erro ou comportamento inesperado com fluxo de reprodução, logs e prints"
title: "fix: [breve resumo do problema]"
labels: ["bug", "triage"]
assignees: ""
---

## 📌 Descrição do Problema / Bug Description

<!-- Descreva de forma clara e concisa o que está acontecendo de errado. -->


---

## 🔄 Fluxo Passo a Passo para Reproduzir / Steps to Reproduce

<!--
O fluxo de reprodução é o item mais importante para diagnosticar e corrigir o bug!
Liste detalhadamente os passos exatos:
-->

1. Iniciar o proxy com o comando `...`
2. Configurar o arquivo `back-overrides.json` com:
   ```json
   {
     "remote": "https://api.corporate-cloud.io",
     "local": "http://localhost:8080"
   }
   ```
3. Acessar a aplicação em `...`
4. Executar a requisição `...`
5. Observar o erro `...`

---

## 🎯 Comportamento Esperado vs Atual / Expected vs Actual

- **O que deveria acontecer:** 
- **O que realmente aconteceu:** 

---

## 🖼️ Capturas de Tela, Prints e Vídeos / Screenshots & Visual Evidence

<!--
Cole aqui prints da tela demonstrando o erro.
Exemplos recomendados:
- Print da aba Network do DevTools (Headers e Payload).
- Print do Console do navegador com os erros em vermelho.
- Print ou gravação da extensão do Chrome ou terminal da CLI.

⚠️ AVISO DE SEGURANÇA: Mascare qualquer dado pessoal, token ou URL corporativa interna privada!
-->

*(Cole ou arraste seus prints aqui)*

---

## 📄 Logs de Terminal ou Console / Error Logs

<details>
<summary>Clique para expandir os logs</summary>

```text
Cole aqui os logs completos da CLI ou do console do navegador
```

</details>

---

## 💻 Ambiente / Environment

Preencha os dados do ambiente em que o bug ocorreu:

- **Sistema Operacional:** [ex: macOS 14.5, Ubuntu 22.04, Windows 11]
- **Navegador & Versão:** [ex: Google Chrome 128, Edge 128, Firefox 130]
- **Versão do BackOverrides:** [ex: v0.1.0 ou commit sha]
- **Modo Utilizado:** [ ] CLI Proxy | [ ] Script In-Browser (@back-overrides/client) | [ ] Extensão Chrome
- **Versão do Node.js:** [ex: 18.20.2, 20.12.0]

---

## 💡 Contexto Adicional / Additional Context

<!-- Alguma observação técnica adicional, workarounds conhecidos ou links úteis -->

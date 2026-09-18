# Contribution Guide — BackOverrides

> 🌐 **Language / Idioma:** [🇧🇷 Português](./CONTRIBUTING.md) | [🇺🇸 English](./CONTRIBUTING.en.md)

Thank you for your interest in contributing to **BackOverrides**! This project is built for developers who value agility, engineering excellence, and architectural integrity.

---

## 🌍 Open Source Collaboration Principles

**BackOverrides** is a **100% open-source** project licensed under the **MIT** license, built collaboratively by the community for developers and engineering teams worldwide.

Our open collaboration principles include:
- **Transparency & Open Governance:** All architectural decisions, discussions, and feature roadmaps happen openly and transparently through public Issues and Pull Requests.
- **Ecosystem & Interoperability:** The community actively collaborates to add and improve compatibility with modern frontend architectures (Single-SPA, Module Federation, Next.js, Vite), modern browsers (Chrome, Edge, Firefox), and emerging W3C web standards (such as Private Network Access).
- **Absolute Sanitization & Neutrality:** As a public repository, every contribution **must remain strictly environment-agnostic**, completely free from private corporate domains, internal hostnames, access tokens, credentials, or company-specific proprietary code.
- **Continuous Quality & Security:** We champion automated testing, robust and secure CORS handling, and strict adherence to Semantic Versioning (SemVer) across all changes.

---

## 🔄 Contribution Lifecycle

```
   1. Fork / Branch   ──▶   2. Code & Tests     ──▶   3. Conventional Commits
          │                                                   │
          ▼                                                   ▼
   6. Merge to main   ◀──   5. Code Review (Copilot) ◀── 4. Pull Request (RC)
```

---

## 🛠️ Step-by-Step Guide to Opening a Pull Request

### Step 1: Set Up Local Environment

Ensure you have **Node.js 18+** and **npm 9+** installed:

```bash
# Clone repository or your fork
git clone https://github.com/KsAkira10/BackOverridesApp.git
cd BackOverridesApp

# Install all monorepo dependencies
npm install

# Build all TypeScript packages
npm run build

# Run entire test suite
npm test
```

### Step 2: Branch Naming Conventions & Release Candidates

Create a branch from `main` using the following standard prefixes:

| Branch Prefix | Purpose | Pipeline Behavior |
| :--- | :--- | :--- |
| `feat/<name>` | New feature | Automatically publishes **Release Candidate** (`vX.Y.Z-rc.N`) |
| `fix/<name>` | Bug fix | Automatically publishes **Release Candidate** (`vX.Y.Z-rc.N`) |
| `docs/<name>` | Documentation changes | Runs CI verification |
| `refactor/<name>` | Internal code restructuring | Runs CI verification |
| `chore/<name>` | Maintenance & dependencies | Runs CI verification |

```bash
# Example creating a feature branch
git checkout -b feat/graphql-support
```

### Step 3: Conventional Commits Standard

Our **Semantic Versioning (SemVer)** system calculates versions and generates `CHANGELOG.md` automatically based on [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <imperative description>
```

#### Allowed Types:
- `feat`: A new feature (bumps **MINOR**, resets patch to 0).
  - Example: `feat(core): add support for regex path matching`
- `fix`: A bug fix (bumps **PATCH**).
  - Example: `fix(cli): handle null origin in cors preflight`
- `docs`: Documentation updates or README adjustments.
  - Example: `docs(extension): update installation steps`
- `style`: Formatting, semicolons, no logic change.
- `refactor`: Code change that neither fixes a bug nor adds a feature.
- `perf`: Code change focused on performance improvement.
- `test`: Adding or correcting tests.
- `chore`: Maintenance tasks, dependencies, build configs.

#### 🚨 Breaking Changes:
To signal a breaking change (bumps **MAJOR**, resetting minor and patch to 0):
- Append `!` after the type/scope:
  ```bash
  git commit -m "feat(core)!: change RouteRule signature to accept URL objects"
  ```
- Or include `BREAKING CHANGE:` in the commit body footer:
  ```text
  fix(cli): update default listening port

  BREAKING CHANGE: default port changed from 3000 to 8888.
  ```

### Step 4: Quality & Security Guardrails

Before submitting your PR, verify the 4 fundamental guardrails locally:

1. **Unit & Integration Tests:** All tests must pass:
   ```bash
   npm test
   ```
2. **SemVer Version Check:** Check how SemVer interprets your commits:
   ```bash
   npm run release:check
   ```
3. **Changelog Preview:** Preview the generated changelog section:
   ```bash
   npm run release:changelog
   ```
4. **Data Sanitization (Critical):**
   - 🚫 **Never commit** API keys, access tokens, private credentials, or internal SSL certificates.
   - 🚫 **Never commit** proprietary corporate domain names or private hostnames. Always use generic sample URLs in examples and tests (e.g., `https://api.corporate-cloud.io` or `http://localhost:8080`).

### Step 5: Open the Pull Request

1. Open your PR targeting the `main` branch.
2. The [.github/PULL_REQUEST_TEMPLATE.md](file:///Users/akira/Developer/akira/antigravity/BackOverridesApp/.github/PULL_REQUEST_TEMPLATE.md) template will load automatically.
3. Describe what was done, attach **visual evidence (terminal output prints, Network tab screenshots, or recordings)**, and specify reproduction steps under "How to Test".
4. Complete the interactive checklist (change type, tests, sanitization).
5. GitHub Actions CI will validate your commit messages and run tests across Node.js 18, 20, and 22.
6. If your branch is `feat/*` or `fix/*`, a **Release Candidate (`-rc.N`)** will be published automatically for preview testing!

---

## 🐛 Reporting Bugs & Vulnerabilities via Issues

When discovering unexpected behavior or a security issue, open an Issue using our dedicated templates:
- **[🐛 Bug Report](file:///Users/akira/Developer/akira/antigravity/BackOverridesApp/.github/ISSUE_TEMPLATE/bug_report.md):** Provide maintainers with the exact step-by-step reproduction flow, DevTools Network/Console screenshots, and execution logs.
- **[🔒 Security Vulnerability](file:///Users/akira/Developer/akira/antigravity/BackOverridesApp/.github/ISSUE_TEMPLATE/security_vulnerability.md):** Describe estimated severity, affected component, Proof of Concept (PoC) flow, and suggested remediation.
- **[💡 Feature Request](file:///Users/akira/Developer/akira/antigravity/BackOverridesApp/.github/ISSUE_TEMPLATE/feature_request.md):** Share the motivation for the feature, configuration syntax examples, and conceptual mockups/screenshots.

---

## 🤖 Code Review with GitHub Copilot

This repository is configured with **GitHub Copilot Code Review** instructions ([`.github/copilot-instructions.md`](file:///Users/akira/Developer/akira/antigravity/BackOverridesApp/.github/copilot-instructions.md)).

During review, Copilot verifies:
- **Commit Compliance:** Whether PR title and commits conform to SemVer conventional rules.
- **Security Sanitization:** Absence of private corporate URLs, internal IPs, or hardcoded credentials.
- **CORS & Network Security:** Proper headers for `Access-Control-Allow-*` and Private Network Access.
- **Manifest V3 Extension Rules:** Service worker lifecycles, declarativeNetRequest rules syntax, and memory safety.
- **Test Coverage:** Guarantee that new features or bug fixes include corresponding unit tests.

---

## 📦 Merge & Official Release

- Direct pushes to `main` **do not produce versions or tags**.
- Once your PR is approved and merged into `main`:
  1. The pipeline reviews all merged commits.
  2. Resolves the target stable version (`vX.Y.Z`).
  3. Updates `package.json` across workspaces and prepends `CHANGELOG.md`.
  4. Publishes the **Official GitHub Release** and packages to **NPM**.

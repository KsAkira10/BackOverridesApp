#!/usr/bin/env node

/**
 * BackOverrides Semantic Versioning & Release Automation
 * 
 * Rules:
 * - Conventional Commits:
 *   - Breaking changes (feat!:, fix!:, or BREAKING CHANGE:) -> MAJOR bump (resets minor and patch to 0)
 *   - feat: -> MINOR bump (resets patch to 0)
 *   - fix: / perf: / refactor: -> PATCH bump
 * - Direct commits to main: DO NOT generate version or tag.
 * - Pull requests merged to main: Resolve to final stable version (vX.Y.Z) and generate CHANGELOG.
 * - Branches feat/* and fix/*: Generate Release Candidates (vX.Y.Z-rc.N) respecting SemVer.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const REPO_URL = 'https://github.com/KsAkira10/BackOverridesApp';

/**
 * Parse a raw commit into structured Conventional Commit format
 */
export function parseCommit(commit) {
  const { hash = '', subject = '', body = '' } = commit;

  // Conventional commit: type(scope)?(!)?:\s*description
  const match = subject.match(/^([a-zA-Z0-9_-]+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/);
  const hasBreakingFooter = /BREAKING[- ]CHANGE:/i.test(body);

  if (!match) {
    // Check if it's a GitHub merge commit e.g. "Merge pull request #12 from ..."
    const isMergeCommit = subject.startsWith('Merge pull request') || subject.startsWith('Merge branch');
    return {
      hash,
      raw: subject,
      type: isMergeCommit ? 'merge' : 'other',
      scope: null,
      isBreaking: hasBreakingFooter,
      description: subject,
      body,
    };
  }

  const [, rawType, scope, exclamation, description] = match;
  const type = rawType.toLowerCase();
  const isBreaking = Boolean(exclamation) || hasBreakingFooter;

  return {
    hash,
    raw: subject,
    type,
    scope: scope ? scope.trim() : null,
    isBreaking,
    description: description.trim(),
    body,
  };
}

/**
 * Calculate the next Semantic Version based on parsed commits
 */
export function calculateNextVersion(currentVersion, parsedCommits) {
  const clean = (currentVersion || '0.1.0').replace(/^v/, '');
  const [major, minor, patch] = clean.split('.').map((num) => parseInt(num, 10) || 0);

  let hasBreaking = false;
  let hasFeat = false;
  let hasFix = false;

  for (const c of parsedCommits) {
    if (c.type === 'merge') continue; // Skip merge header lines
    if (c.isBreaking) {
      hasBreaking = true;
    } else if (c.type === 'feat') {
      hasFeat = true;
    } else if (c.type === 'fix' || c.type === 'perf' || c.type === 'refactor') {
      hasFix = true;
    }
  }

  if (hasBreaking) {
    // Breaking change: bump major, reset minor and patch to 0
    return `${major + 1}.0.0`;
  }

  if (hasFeat) {
    // Feat: bump minor, reset patch to 0
    return `${major}.${minor + 1}.0`;
  }

  if (hasFix) {
    // Fix: bump patch
    return `${major}.${minor}.${patch + 1}`;
  }

  // If there are other changes (chore, docs, style), bump patch
  const meaningfulCommits = parsedCommits.filter((c) => c.type !== 'merge');
  if (meaningfulCommits.length > 0) {
    return `${major}.${minor}.${patch + 1}`;
  }

  // No changes
  return `${major}.${minor}.${patch}`;
}

/**
 * Get next Release Candidate tag: vX.Y.Z-rc.1, vX.Y.Z-rc.2, ...
 */
export function getNextRcTag(targetVersion, existingTags = []) {
  const cleanVersion = targetVersion.replace(/^v/, '');
  const prefix = `v${cleanVersion}-rc.`;

  const numbers = existingTags
    .filter((t) => t.startsWith(prefix))
    .map((t) => {
      const suffix = t.slice(prefix.length);
      return parseInt(suffix, 10);
    })
    .filter((n) => !isNaN(n));

  if (numbers.length === 0) {
    return `${prefix}1`;
  }

  const max = Math.max(...numbers);
  return `${prefix}${max + 1}`;
}

/**
 * Find all Release Candidate tags for a specific target version
 * e.g. targetVersion "0.2.0" -> ["v0.2.0-rc.1", "v0.2.0-rc.2"]
 */
export function getRcTagsForVersion(targetVersion, existingTags = []) {
  const cleanVersion = targetVersion.replace(/^v/, '');
  const prefix = `v${cleanVersion}-rc.`;
  return existingTags.filter((t) => t.startsWith(prefix));
}

/**
 * Filter tags to find the latest stable SemVer tag (e.g. v0.1.0, not -rc)
 */
export function getLatestStableTag(tags = []) {
  const stableTags = tags
    .filter((t) => /^v\d+\.\d+\.\d+$/.test(t))
    .sort((a, b) => {
      const [majA, minA, patA] = a.replace('v', '').split('.').map(Number);
      const [majB, minB, patB] = b.replace('v', '').split('.').map(Number);
      if (majA !== majB) return majA - majB;
      if (minA !== minB) return minA - minB;
      return patA - patB;
    });

  return stableTags.length > 0 ? stableTags[stableTags.length - 1] : null;
}

/**
 * Generate Markdown section for CHANGELOG.md
 */
export function generateChangelogSection(version, dateStr, parsedCommits, repoUrl = REPO_URL) {
  const breaking = parsedCommits.filter((c) => c.isBreaking);
  const feats = parsedCommits.filter((c) => c.type === 'feat' && !c.isBreaking);
  const fixes = parsedCommits.filter((c) => c.type === 'fix' && !c.isBreaking);
  const others = parsedCommits.filter((c) => !c.isBreaking && c.type !== 'feat' && c.type !== 'fix' && c.type !== 'merge');

  let md = `## [${version}] - ${dateStr}\n\n`;

  if (breaking.length > 0) {
    md += `### 🚨 Breaking Changes\n\n`;
    for (const c of breaking) {
      const scope = c.scope ? `**${c.scope}**: ` : '';
      const hashLink = c.hash ? ` ([${c.hash.slice(0, 7)}](${repoUrl}/commit/${c.hash}))` : '';
      md += `- ${scope}${c.description}${hashLink}\n`;
      if (c.body && /BREAKING[- ]CHANGE:/i.test(c.body)) {
        const detail = c.body.replace(/^[\s\S]*?BREAKING[- ]CHANGE:\s*/i, '').trim();
        if (detail) {
          md += `  > **Aviso de Quebra:** ${detail}\n`;
        }
      }
    }
    md += '\n';
  }

  if (feats.length > 0) {
    md += `### ✨ Features\n\n`;
    for (const c of feats) {
      const scope = c.scope ? `**${c.scope}**: ` : '';
      const hashLink = c.hash ? ` ([${c.hash.slice(0, 7)}](${repoUrl}/commit/${c.hash}))` : '';
      md += `- ${scope}${c.description}${hashLink}\n`;
    }
    md += '\n';
  }

  if (fixes.length > 0) {
    md += `### 🐛 Bug Fixes\n\n`;
    for (const c of fixes) {
      const scope = c.scope ? `**${c.scope}**: ` : '';
      const hashLink = c.hash ? ` ([${c.hash.slice(0, 7)}](${repoUrl}/commit/${c.hash}))` : '';
      md += `- ${scope}${c.description}${hashLink}\n`;
    }
    md += '\n';
  }

  if (others.length > 0) {
    md += `### 🧰 Maintenance & Other Changes\n\n`;
    for (const c of others) {
      const typeLabel = c.type !== 'other' ? `*(${c.type})* ` : '';
      const scope = c.scope ? `**${c.scope}**: ` : '';
      const hashLink = c.hash ? ` ([${c.hash.slice(0, 7)}](${repoUrl}/commit/${c.hash}))` : '';
      md += `- ${typeLabel}${scope}${c.description}${hashLink}\n`;
    }
    md += '\n';
  }

  return md;
}

/**
 * Read git tags from repository
 */
export function getGitTags() {
  try {
    const output = execSync('git tag -l', { encoding: 'utf8', cwd: REPO_ROOT });
    return output
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean);
  } catch (err) {
    console.warn('[SEMVER-RELEASE] Aviso ao ler tags do git:', err.message);
    return [];
  }
}

/**
 * Get git commits since a tag (or all commits if no tag)
 */
export function getCommitsSinceTag(tag) {
  try {
    const range = tag ? `${tag}..HEAD` : 'HEAD';
    // Delimiter for parsing hash, subject, body: __COMMIT_SEP__ and __BODY_SEP__
    const logCmd = `git log ${range} --format="%H%x1f%s%x1f%b%x1e"`;
    const output = execSync(logCmd, { encoding: 'utf8', cwd: REPO_ROOT });

    const rawCommits = output.split('\x1e').filter((c) => c.trim().length > 0);
    return rawCommits.map((raw) => {
      const [hash, subject, body] = raw.split('\x1f');
      return {
        hash: (hash || '').trim(),
        subject: (subject || '').trim(),
        body: (body || '').trim(),
      };
    });
  } catch (err) {
    console.warn('[SEMVER-RELEASE] Aviso ao ler histórico git:', err.message);
    return [];
  }
}

/**
 * Check if the current commit on main is from a merged Pull Request
 */
export function isPullRequestMerge() {
  // 1. Check explicit environment override
  if (process.env.IS_PR_MERGE === 'true') return true;
  if (process.env.IS_PR_MERGE === 'false') return false;

  // 2. Check GitHub Actions context
  const eventName = process.env.GITHUB_EVENT_NAME;
  if (eventName === 'pull_request') return true;

  const currentSha = process.env.GITHUB_SHA || execSync('git rev-parse HEAD', { encoding: 'utf8', cwd: REPO_ROOT }).trim();

  // 3. Inspect commit message for standard PR merge markers
  try {
    const commitMsg = execSync(`git log -1 --format="%s" ${currentSha}`, { encoding: 'utf8', cwd: REPO_ROOT }).trim();
    if (/Merge pull request #\d+/i.test(commitMsg)) return true;
    if (/\(#\d+\)$/.test(commitMsg)) return true; // Squash merge commit e.g. "feat: add stuff (#12)"
  } catch (e) {
    // Ignore error
  }

  // 4. Check via GitHub CLI if available in the CI runner
  try {
    const prCheck = execSync(`gh pr list --state merged --search "${currentSha}" --json number -q '.[0].number'`, {
      encoding: 'utf8',
      cwd: REPO_ROOT,
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
    if (prCheck && prCheck !== 'null') return true;
  } catch (e) {
    // gh CLI might not be authenticated locally
  }

  return false;
}

/**
 * Update version in package.json files and manifest.json
 */
export function updatePackageVersions(newVersion) {
  const filesToUpdate = [
    path.join(REPO_ROOT, 'package.json'),
    path.join(REPO_ROOT, 'packages/core/package.json'),
    path.join(REPO_ROOT, 'packages/client/package.json'),
    path.join(REPO_ROOT, 'packages/cli/package.json'),
    path.join(REPO_ROOT, 'packages/extension/manifest.json'),
  ];

  for (const filePath of filesToUpdate) {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const json = JSON.parse(content);
      json.version = newVersion;
      fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');
      console.log(`[SEMVER-RELEASE] Atualizado ${path.relative(REPO_ROOT, filePath)} -> ${newVersion}`);
    }
  }
}

/**
 * Prepend new changelog section to CHANGELOG.md
 */
export function updateChangelogFile(changelogSection) {
  const changelogPath = path.join(REPO_ROOT, 'CHANGELOG.md');
  const header = `# Changelog

Todas as mudanças notáveis no projeto **BackOverrides** são documentadas neste arquivo de acordo com as diretrizes do [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) e [Semantic Versioning](https://semver.org/lang/pt-BR/).

`;

  let existing = '';
  if (fs.existsSync(changelogPath)) {
    existing = fs.readFileSync(changelogPath, 'utf8');
    // Remove initial header if present
    existing = existing.replace(/^# Changelog[\s\S]*?(?=## \[)/, '');
  }

  const finalContent = header + changelogSection + '\n' + existing.trim() + '\n';
  fs.writeFileSync(changelogPath, finalContent, 'utf8');
  console.log(`[SEMVER-RELEASE] CHANGELOG.md atualizado com sucesso.`);
}

/**
 * Set GitHub Action step outputs
 */
function setGithubOutput(key, value) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    fs.appendFileSync(outputFile, `${key}=${value}\n`, 'utf8');
  }
  console.log(`[OUTPUT] ${key}=${value}`);
}

/**
 * Main execution handler
 */
export async function main() {
  const mode = process.argv[2] || 'check';
  const allTags = getGitTags();
  const latestStable = getLatestStableTag(allTags) || 'v0.1.0';
  const rawCommits = getCommitsSinceTag(latestStable);
  const parsedCommits = rawCommits.map(parseCommit);

  console.log(`[SEMVER-RELEASE] Modo: ${mode}`);
  console.log(`[SEMVER-RELEASE] Última tag estável: ${latestStable}`);
  console.log(`[SEMVER-RELEASE] Commits encontrados desde ${latestStable}: ${rawCommits.length}`);

  const targetVersion = calculateNextVersion(latestStable, parsedCommits);
  const nextRcTag = getNextRcTag(targetVersion, allTags);
  const dateStr = new Date().toISOString().split('T')[0];

  if (mode === 'check') {
    console.log(`[SEMVER-RELEASE] Próxima versão estável calculada: v${targetVersion}`);
    console.log(`[SEMVER-RELEASE] Próximo Release Candidate: ${nextRcTag}`);
    console.log('\n--- Commits Analisados ---');
    for (const c of parsedCommits) {
      const breakingTag = c.isBreaking ? ' [BREAKING]' : '';
      console.log(`- (${c.type}) ${c.scope ? `[${c.scope}] ` : ''}${c.description}${breakingTag}`);
    }
    return;
  }

  if (mode === 'rc') {
    console.log(`[SEMVER-RELEASE] Gerando Release Candidate: ${nextRcTag}`);
    const changelogSection = generateChangelogSection(nextRcTag, dateStr, parsedCommits);
    const notesFile = path.join(REPO_ROOT, 'RELEASE_NOTES.md');
    fs.writeFileSync(notesFile, changelogSection, 'utf8');

    setGithubOutput('should_release', 'true');
    setGithubOutput('tag_name', nextRcTag);
    setGithubOutput('version', targetVersion);
    setGithubOutput('is_prerelease', 'true');
    setGithubOutput('release_notes_file', notesFile);
    return;
  }

  if (mode === 'final') {
    // Check if this push to main is a direct commit or from a merged PR
    const isFromPR = isPullRequestMerge();

    if (!isFromPR && process.env.FORCE_RELEASE !== 'true') {
      console.log('======================================================================');
      console.log('[SEMVER-RELEASE] 🛑 Commit direto na branch main detectado.');
      console.log('[SEMVER-RELEASE] Regra SemVer: Commits diretos na main NÃO geram versão ou tag.');
      console.log('[SEMVER-RELEASE] Para gerar uma nova versão, abra e aprove um Pull Request.');
      console.log('======================================================================');
      setGithubOutput('should_release', 'false');
      setGithubOutput('skip_reason', 'direct_commit_to_main');
      return;
    }

    if (rawCommits.length === 0) {
      console.log('[SEMVER-RELEASE] Nenhum commit novo desde a última versão estável.');
      setGithubOutput('should_release', 'false');
      setGithubOutput('skip_reason', 'no_new_commits');
      return;
    }

    const finalTag = `v${targetVersion}`;
    console.log(`[SEMVER-RELEASE] ✅ PR Merge detectado! Gerando versão final estável: ${finalTag}`);

    // Update package.json files and manifest.json
    updatePackageVersions(targetVersion);

    // Generate changelog section and update CHANGELOG.md
    const changelogSection = generateChangelogSection(finalTag, dateStr, parsedCommits);
    updateChangelogFile(changelogSection);

    const notesFile = path.join(REPO_ROOT, 'RELEASE_NOTES.md');
    fs.writeFileSync(notesFile, changelogSection, 'utf8');

    const rcTags = getRcTagsForVersion(targetVersion, allTags);
    console.log(`[SEMVER-RELEASE] Release Candidates associados a v${targetVersion}: ${rcTags.length > 0 ? rcTags.join(' ') : 'nenhum'}`);

    setGithubOutput('should_release', 'true');
    setGithubOutput('tag_name', finalTag);
    setGithubOutput('version', targetVersion);
    setGithubOutput('rc_tags', rcTags.join(' '));
    setGithubOutput('is_prerelease', 'false');
    setGithubOutput('release_notes_file', notesFile);
    return;
  }

  if (mode === 'list-rc') {
    const v = process.argv[3] || targetVersion;
    const rcTags = getRcTagsForVersion(v, allTags);
    console.log(rcTags.join(' '));
    return;
  }

  if (mode === 'clean-rc') {
    const v = process.argv[3] || targetVersion;
    const rcTags = getRcTagsForVersion(v, allTags);
    console.log(`[SEMVER-RELEASE] Tags RC para remoção (versão v${v}): ${rcTags.length > 0 ? rcTags.join(' ') : 'nenhuma'}`);
    for (const tag of rcTags) {
      try {
        console.log(`[SEMVER-RELEASE] Deletando tag remota: ${tag}`);
        execSync(`git push origin --delete ${tag}`, { stdio: 'inherit' });
      } catch (e) {
        console.warn(`[SEMVER-RELEASE] Aviso ao deletar tag ${tag}:`, e.message);
      }
    }
    return;
  }

  if (mode === 'changelog') {
    const changelogSection = generateChangelogSection(`v${targetVersion}`, dateStr, parsedCommits);
    console.log(changelogSection);
    return;
  }

  console.error(`[SEMVER-RELEASE] Modo desconhecido: ${mode}`);
  process.exit(1);
}

// Execute directly if run via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('[SEMVER-RELEASE] Erro fatal:', err);
    process.exit(1);
  });
}

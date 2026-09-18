import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCommit,
  calculateNextVersion,
  getNextRcTag,
  getRcTagsForVersion,
  getLatestStableTag,
  generateChangelogSection,
} from '../scripts/semver-release.mjs';

describe('Semantic Versioning & Conventional Commits Parser', () => {
  it('parses standard conventional feat and fix commits', () => {
    const feat = parseCommit({
      hash: 'abc1234',
      subject: 'feat(core): add dynamic routing filter',
    });
    assert.equal(feat.type, 'feat');
    assert.equal(feat.scope, 'core');
    assert.equal(feat.description, 'add dynamic routing filter');
    assert.equal(feat.isBreaking, false);

    const fix = parseCommit({
      hash: 'def5678',
      subject: 'fix: resolve cors null origin header',
    });
    assert.equal(fix.type, 'fix');
    assert.equal(fix.scope, null);
    assert.equal(fix.description, 'resolve cors null origin header');
    assert.equal(fix.isBreaking, false);
  });

  it('detects breaking change with exclamation mark in subject', () => {
    const breaking = parseCommit({
      hash: 'b123456',
      subject: 'feat(client)!: change setupBackOverrides configuration signature',
    });
    assert.equal(breaking.type, 'feat');
    assert.equal(breaking.scope, 'client');
    assert.equal(breaking.isBreaking, true);
  });

  it('detects breaking change in commit body footer', () => {
    const breakingFooter = parseCommit({
      hash: 'bf12345',
      subject: 'fix: update default port',
      body: 'BREAKING CHANGE: default port changed from 3000 to 8080.',
    });
    assert.equal(breakingFooter.type, 'fix');
    assert.equal(breakingFooter.isBreaking, true);
  });

  it('identifies GitHub merge commits', () => {
    const merge = parseCommit({
      hash: 'm123456',
      subject: 'Merge pull request #42 from feat/cool-stuff',
    });
    assert.equal(merge.type, 'merge');
  });
});

describe('calculateNextVersion', () => {
  it('increments patch for fix commits', () => {
    const commits = [
      parseCommit({ subject: 'fix(core): resolve race condition' }),
      parseCommit({ subject: 'docs: update readme' }),
    ];
    const next = calculateNextVersion('0.1.0', commits);
    assert.equal(next, '0.1.1');
  });

  it('increments minor and resets patch to 0 for feat commits', () => {
    const commits = [
      parseCommit({ subject: 'feat(cli): add interactive dashboard' }),
    ];
    const next = calculateNextVersion('0.1.4', commits);
    assert.equal(next, '0.2.0');
  });

  it('resets patch to 0 when minor is bumped even with simultaneous fixes', () => {
    const commits = [
      parseCommit({ subject: 'feat(extension): support safari' }),
      parseCommit({ subject: 'fix(core): handle undefined header' }),
    ];
    const next = calculateNextVersion('0.1.7', commits);
    // User requirement: "levando em consideração que minor up zera patch, mas precisa estar listado no changelog"
    assert.equal(next, '0.2.0');
  });

  it('increments major and resets minor and patch to 0 for breaking changes', () => {
    const commits = [
      parseCommit({ subject: 'feat(core)!: redesign plugin api' }),
      parseCommit({ subject: 'feat: add telemetry' }),
      parseCommit({ subject: 'fix: fix memory leak' }),
    ];
    const next = calculateNextVersion('0.2.5', commits);
    assert.equal(next, '1.0.0');

    const nextFromV1 = calculateNextVersion('1.3.2', commits);
    assert.equal(nextFromV1, '2.0.0');
  });
});

describe('getNextRcTag', () => {
  it('returns rc.1 when no prior RC exists for the target version', () => {
    const tag = getNextRcTag('0.2.0', ['v0.1.0', 'v0.1.1']);
    assert.equal(tag, 'v0.2.0-rc.1');
  });

  it('increments RC number sequentially', () => {
    const tag = getNextRcTag('0.2.0', ['v0.1.0', 'v0.2.0-rc.1', 'v0.2.0-rc.2']);
    assert.equal(tag, 'v0.2.0-rc.3');
  });

  it('correctly isolates RC numbers by target version', () => {
    const tag = getNextRcTag('0.1.1', ['v0.1.0', 'v0.2.0-rc.1', 'v0.2.0-rc.2']);
    assert.equal(tag, 'v0.1.1-rc.1');
  });
});

describe('getRcTagsForVersion', () => {
  it('returns all RC tags matching the target version', () => {
    const tags = ['v0.1.0', 'v0.2.0-rc.1', 'v0.2.0-rc.2', 'v0.2.0-rc.3', 'v0.3.0-rc.1', 'v0.2.0'];
    const rcs = getRcTagsForVersion('0.2.0', tags);
    assert.deepEqual(rcs, ['v0.2.0-rc.1', 'v0.2.0-rc.2', 'v0.2.0-rc.3']);
  });

  it('handles version string with leading v prefix', () => {
    const tags = ['v0.2.0-rc.1', 'v0.2.0-rc.2'];
    const rcs = getRcTagsForVersion('v0.2.0', tags);
    assert.deepEqual(rcs, ['v0.2.0-rc.1', 'v0.2.0-rc.2']);
  });

  it('returns empty array when no matching RC tags exist', () => {
    const tags = ['v0.1.0', 'v0.2.0', 'v0.3.0-rc.1'];
    const rcs = getRcTagsForVersion('0.2.0', tags);
    assert.deepEqual(rcs, []);
  });
});

describe('getLatestStableTag', () => {
  it('finds the latest stable version and ignores RC tags', () => {
    const tags = ['v0.1.0', 'v0.2.0-rc.1', 'v0.2.0-rc.2', 'v0.1.1'];
    const latest = getLatestStableTag(tags);
    assert.equal(latest, 'v0.1.1');
  });

  it('correctly sorts versions with multi-digit numbers', () => {
    const tags = ['v0.1.0', 'v0.2.0', 'v0.10.0', 'v0.9.0'];
    const latest = getLatestStableTag(tags);
    assert.equal(latest, 'v0.10.0');
  });
});

describe('generateChangelogSection', () => {
  it('groups breaking changes, features, and fixes separately', () => {
    const commits = [
      parseCommit({
        hash: '1111111',
        subject: 'feat(core)!: change proxy engine',
        body: 'BREAKING CHANGE: node 16 is no longer supported.',
      }),
      parseCommit({
        hash: '2222222',
        subject: 'feat(cli): add colorful logger',
      }),
      parseCommit({
        hash: '3333333',
        subject: 'fix(extension): fix manifest permissions',
      }),
      parseCommit({
        hash: '4444444',
        subject: 'chore: update dependencies',
      }),
    ];

    const changelog = generateChangelogSection('v1.0.0', '2026-09-18', commits);

    assert.ok(changelog.includes('## [v1.0.0] - 2026-09-18'));
    assert.ok(changelog.includes('### 🚨 Breaking Changes'));
    assert.ok(changelog.includes('**Aviso de Quebra:** node 16 is no longer supported.'));
    assert.ok(changelog.includes('### ✨ Features'));
    assert.ok(changelog.includes('**cli**: add colorful logger'));
    assert.ok(changelog.includes('### 🐛 Bug Fixes'));
    assert.ok(changelog.includes('**extension**: fix manifest permissions'));
    assert.ok(changelog.includes('### 🧰 Maintenance & Other Changes'));
    assert.ok(changelog.includes('update dependencies'));
  });
});

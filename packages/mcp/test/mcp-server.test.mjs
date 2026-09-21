import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  createBackOverridesMcpServer,
  getBackOverridesStatus,
  listRules,
  addRule,
  toggleRule,
  testRoute,
  getExtensionInfo,
  getSnippets,
  configureMcp,
  findRepoRoot,
} from '../dist/index.js';

describe('BackOverrides MCP Server & Tools', () => {
  const repoRoot = findRepoRoot();

  it('instantiates McpServer with correct identity and metadata', () => {
    const server = createBackOverridesMcpServer();
    assert.ok(server, 'Server instance should be created');
  });

  describe('getBackOverridesStatus', () => {
    it('returns structured status information', async () => {
      const status = await getBackOverridesStatus(repoRoot);
      assert.equal(typeof status.running, 'boolean');
      assert.ok(status.status === 'online' || status.status === 'offline');
      assert.ok(status.message.length > 0);
      if (status.runtimeFile) {
        assert.ok(status.runtimeFile.includes('.back-overrides-runtime.json'));
      }
    });
  });

  describe('listRules', () => {
    it('reads configuration and decorates rules with resolved targets', async () => {
      const result = await listRules(undefined, repoRoot);
      assert.ok(result.configFile.endsWith('back-overrides.json'));
      assert.equal(typeof result.remote, 'string');
      assert.equal(typeof result.local, 'string');
      assert.equal(typeof result.corsEnabled, 'boolean');
      assert.ok(Array.isArray(result.rules));
      assert.ok(result.totalCount >= 1);

      const firstRule = result.rules[0];
      assert.ok(firstRule.path);
      assert.ok(Array.isArray(firstRule.methods));
      assert.ok(firstRule.resolvedTarget);
    });
  });

  describe('addRule and toggleRule in temporary config', () => {
    it('adds a rule and toggles its disabled status', async () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'back-overrides-mcp-test-'));
      const tempConfig = path.join(tempDir, 'back-overrides.json');

      fs.writeFileSync(
        tempConfig,
        JSON.stringify({
          port: 8888,
          remote: 'https://api.example.com',
          local: 'http://localhost:3000',
          overrides: [],
        }, null, 2),
        'utf-8'
      );

      // Add a rule
      const addRes = await addRule({
        path: '/v1/test/endpoint',
        methods: ['POST', 'GET'],
        description: 'Test rule created by MCP test',
        configPath: tempConfig,
      });

      assert.equal(addRes.success, true);
      assert.equal(addRes.totalCount, 1);
      assert.equal(addRes.rule.path, '/v1/test/endpoint');

      // Toggle rule to disabled
      const toggleRes = await toggleRule({
        pathOrIndex: 0,
        disabled: true,
        configPath: tempConfig,
      });

      assert.equal(toggleRes.success, true);
      assert.equal(toggleRes.rule.disabled, true);

      // Toggle rule back to active
      const toggleRes2 = await toggleRule({
        pathOrIndex: '/v1/test/endpoint',
        disabled: false,
        configPath: tempConfig,
      });

      assert.equal(toggleRes2.success, true);
      assert.equal(toggleRes2.rule.disabled, false);

      // Clean up
      fs.rmSync(tempDir, { recursive: true, force: true });
    });
  });

  describe('testRoute', () => {
    it('correctly matches and simulates OAuth override route', async () => {
      const matchTest = await testRoute({
        url: 'https://api.corporate-cloud.io/bff/core/v1/oauth2/authorize',
        method: 'GET',
        cwd: repoRoot,
      });

      assert.equal(matchTest.matched, true);
      assert.equal(matchTest.action, 'OVERRIDE_LOCAL');
      assert.ok(matchTest.targetUrl.startsWith('http://localhost:8080'));
      assert.ok(matchTest.explanation.includes('MATCHES rule'));
      assert.equal(matchTest.cors.enabled, true);
      assert.ok(matchTest.cors.sampleResponseHeaders['Access-Control-Allow-Origin']);
    });

    it('identifies unmapped endpoints as passthrough to remote', async () => {
      const passthroughTest = await testRoute({
        url: 'https://api.corporate-cloud.io/api/unmapped/resource/123',
        method: 'GET',
        cwd: repoRoot,
      });

      assert.equal(matchTestAction(passthroughTest), 'PASSTHROUGH_REMOTE');
      assert.ok(passthroughTest.explanation.includes('does NOT match'));
    });

    function matchTestAction(res) {
      return res.action;
    }
  });

  describe('getExtensionInfo', () => {
    it('returns extension directory, manifest details and instructions', async () => {
      const info = await getExtensionInfo(repoRoot);
      assert.ok(info.extensionPath.endsWith('packages/extension'));
      assert.equal(info.manifest.manifest_version, 3);
      assert.ok(info.manifest.permissions.includes('declarativeNetRequest'));
      assert.ok(info.installInstructions.step1.includes('chrome://extensions'));
      assert.ok(info.installInstructions.step4.includes('packages/extension'));
      assert.ok(info.quickLaunchCommand.includes('--load-extension'));
    });
  });

  describe('getSnippets', () => {
    it('generates devtools, html and import snippets', async () => {
      const snippets = await getSnippets(8888, repoRoot);
      assert.equal(snippets.port, 8888);
      assert.ok(snippets.snippets.devtoolsConsole.includes('http://localhost:8888/__back-overrides/client.js'));
      assert.ok(snippets.snippets.indexHtmlTag.includes('<script src='));
      assert.ok(snippets.snippets.npmModuleImport.includes('@back-overrides/client'));
      assert.ok(snippets.comparison.extensionBenefits.length >= 2);
    });
  });

  describe('configureMcp', () => {
    it('creates or updates .vscode/mcp.json in workspace', async () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'back-overrides-vscode-test-'));
      const result = await configureMcp(tempDir);

      assert.equal(result.success, true);
      assert.ok(fs.existsSync(result.vscodeMcpFile));

      const parsed = JSON.parse(fs.readFileSync(result.vscodeMcpFile, 'utf-8'));
      assert.ok(parsed.mcpServers['back-overrides']);
      assert.equal(parsed.mcpServers['back-overrides'].command, 'node');
      assert.deepEqual(parsed.mcpServers['back-overrides'].args, ['packages/mcp/dist/index.js']);

      // Clean up
      fs.rmSync(tempDir, { recursive: true, force: true });
    });
  });
});

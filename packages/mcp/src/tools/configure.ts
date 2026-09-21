import fs from 'node:fs';
import path from 'node:path';
import { getProjectPaths } from '../utils/paths.js';

export interface ConfigureMcpResult {
  success: boolean;
  vscodeMcpFile: string;
  createdOrUpdated: boolean;
  configs: {
    githubCopilotVsCode: Record<string, any>;
    claudeDesktop: Record<string, any>;
    cursor: Record<string, any>;
  };
  message: string;
}

/**
 * Creates or updates .vscode/mcp.json for GitHub Copilot in VS Code.
 */
export async function configureMcp(cwd?: string): Promise<ConfigureMcpResult> {
  const paths = getProjectPaths(cwd);

  const mcpServerConfig = {
    command: 'node',
    args: ['packages/mcp/dist/index.js'],
  };

  const copilotConfig = {
    mcpServers: {
      'back-overrides': mcpServerConfig,
    },
  };

  const claudeDesktopConfig = {
    mcpServers: {
      'back-overrides': {
        command: 'node',
        args: [path.resolve(paths.repoRoot, 'packages/mcp/dist/index.js')],
      },
    },
  };

  const cursorConfig = {
    mcpServers: {
      'back-overrides': mcpServerConfig,
    },
  };

  // Ensure .vscode directory exists
  if (!fs.existsSync(paths.vscodeDir)) {
    fs.mkdirSync(paths.vscodeDir, { recursive: true });
  }

  let existing: Record<string, any> = {};
  if (fs.existsSync(paths.vscodeMcpFile)) {
    try {
      existing = JSON.parse(fs.readFileSync(paths.vscodeMcpFile, 'utf-8'));
    } catch {
      existing = {};
    }
  }

  if (!existing.mcpServers) {
    existing.mcpServers = {};
  }

  existing.mcpServers['back-overrides'] = mcpServerConfig;

  fs.writeFileSync(paths.vscodeMcpFile, JSON.stringify(existing, null, 2) + '\n', 'utf-8');

  return {
    success: true,
    vscodeMcpFile: paths.vscodeMcpFile,
    createdOrUpdated: true,
    configs: {
      githubCopilotVsCode: copilotConfig,
      claudeDesktop: claudeDesktopConfig,
      cursor: cursorConfig,
    },
    message: `Configured .vscode/mcp.json successfully at ${paths.vscodeMcpFile}. GitHub Copilot Chat can now auto-connect to BackOverrides.`,
  };
}

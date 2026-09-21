import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Discovers the BackOverrides repository root directory.
 */
export function findRepoRoot(startDir?: string): string {
  let current = startDir || process.cwd();

  // 1. Try checking if current or parents contain packages/core and packages/cli
  for (let i = 0; i < 6; i++) {
    const pkgJsonPath = path.join(current, 'package.json');
    const packagesDir = path.join(current, 'packages');
    if (fs.existsSync(pkgJsonPath) && fs.existsSync(packagesDir)) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  // 2. Fallback using import.meta.url
  try {
    const currentFilePath = fileURLToPath(import.meta.url);
    const candidate = path.resolve(path.dirname(currentFilePath), '../../../');
    if (fs.existsSync(path.join(candidate, 'packages'))) {
      return candidate;
    }
  } catch {
    // ignore
  }

  return process.cwd();
}

export function getProjectPaths(cwd?: string) {
  const repoRoot = findRepoRoot(cwd);
  const extensionPath = path.resolve(repoRoot, 'packages/extension');
  const cliDistPath = path.resolve(repoRoot, 'packages/cli/dist/cli.js');
  const cliSourcePath = path.resolve(repoRoot, 'packages/cli/src/cli.ts');
  const runtimePath = path.resolve(repoRoot, '.back-overrides-runtime.json');
  const defaultConfigFile = path.resolve(repoRoot, 'back-overrides.json');
  const vscodeDir = path.resolve(repoRoot, '.vscode');
  const vscodeMcpFile = path.resolve(vscodeDir, 'mcp.json');

  return {
    repoRoot,
    extensionPath,
    cliDistPath,
    cliSourcePath,
    runtimePath,
    defaultConfigFile,
    vscodeDir,
    vscodeMcpFile,
  };
}

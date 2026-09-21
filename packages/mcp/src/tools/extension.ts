import fs from 'node:fs';
import path from 'node:path';
import { getProjectPaths } from '../utils/paths.js';
import { launchBrowserWithExtension, type LaunchBrowserResult } from '../browser-launcher.js';
import { getBackOverridesStatus } from './status.js';

export interface ExtensionInfoResult {
  extensionPath: string;
  manifest: {
    name: string;
    version: string;
    manifest_version: number;
    description: string;
    permissions: string[];
    host_permissions: string[];
  };
  proxyStatus: {
    online: boolean;
    cliUrl?: string;
    rulesCount?: number;
  };
  installInstructions: {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
  };
  quickLaunchCommand: string;
}

export interface LaunchBrowserToolOptions {
  url?: string;
  browser?: 'chrome' | 'brave' | 'edge' | 'chromium';
  isolatedProfile?: boolean;
  cwd?: string;
}

/**
 * Returns extension details, manifest info, and installation steps.
 */
export async function getExtensionInfo(cwd?: string): Promise<ExtensionInfoResult> {
  const paths = getProjectPaths(cwd);
  const manifestPath = path.join(paths.extensionPath, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Extension manifest not found at: ${manifestPath}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const status = await getBackOverridesStatus(paths.repoRoot);

  const quickLaunchCmd = `open -na "Google Chrome" --args --load-extension="${paths.extensionPath}" "${status.cliUrl || 'http://localhost:8888'}/__back-overrides/status"`;

  return {
    extensionPath: paths.extensionPath,
    manifest: {
      name: manifest.name,
      version: manifest.version,
      manifest_version: manifest.manifest_version,
      description: manifest.description,
      permissions: manifest.permissions || [],
      host_permissions: manifest.host_permissions || [],
    },
    proxyStatus: {
      online: status.running,
      cliUrl: status.cliUrl,
      rulesCount: status.rulesCount,
    },
    installInstructions: {
      step1: 'Abra seu navegador Chromium (Google Chrome, Brave ou Edge) e acesse: chrome://extensions/',
      step2: 'No canto superior direito da página, ative o switch "Modo do desenvolvedor" (Developer mode).',
      step3: `Clique no botão "Carregar sem compactação" (Load unpacked) no canto superior esquerdo.`,
      step4: `Selecione a pasta da extensão: ${paths.extensionPath}`,
    },
    quickLaunchCommand: quickLaunchCmd,
  };
}

/**
 * Launches Chrome or Chromium browser with the extension automatically loaded.
 */
export async function launchBrowser(options: LaunchBrowserToolOptions = {}): Promise<LaunchBrowserResult> {
  const paths = getProjectPaths(options.cwd);
  const status = await getBackOverridesStatus(paths.repoRoot);

  const targetUrl = options.url || (status.cliUrl ? `${status.cliUrl}/__back-overrides/status` : 'http://localhost:8888/__back-overrides/status');

  return launchBrowserWithExtension({
    extensionPath: paths.extensionPath,
    url: targetUrl,
    browser: options.browser,
    isolatedProfile: options.isolatedProfile,
  });
}

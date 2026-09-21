import { exec, spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

export interface LaunchBrowserOptions {
  extensionPath: string;
  url?: string;
  browser?: 'chrome' | 'brave' | 'edge' | 'chromium';
  isolatedProfile?: boolean;
}

export interface LaunchBrowserResult {
  success: boolean;
  command: string;
  message: string;
  browser: string;
  platform: string;
}

/**
 * Resolves the browser application name or binary based on platform.
 */
function resolveBrowserCommand(
  browserType: 'chrome' | 'brave' | 'edge' | 'chromium',
  platform: NodeJS.Platform
): { appName: string; binary: string } {
  if (platform === 'darwin') {
    switch (browserType) {
      case 'brave':
        return { appName: 'Brave Browser', binary: '/Applications/Brave Browser.app' };
      case 'edge':
        return { appName: 'Microsoft Edge', binary: '/Applications/Microsoft Edge.app' };
      case 'chromium':
        return { appName: 'Chromium', binary: '/Applications/Chromium.app' };
      case 'chrome':
      default:
        return { appName: 'Google Chrome', binary: '/Applications/Google Chrome.app' };
    }
  }

  if (platform === 'win32') {
    switch (browserType) {
      case 'brave':
        return { appName: 'brave', binary: 'brave.exe' };
      case 'edge':
        return { appName: 'msedge', binary: 'msedge.exe' };
      case 'chromium':
        return { appName: 'chromium', binary: 'chromium.exe' };
      case 'chrome':
      default:
        return { appName: 'chrome', binary: 'chrome.exe' };
    }
  }

  // Linux
  switch (browserType) {
    case 'brave':
      return { appName: 'brave-browser', binary: 'brave-browser' };
    case 'edge':
      return { appName: 'microsoft-edge', binary: 'microsoft-edge' };
    case 'chromium':
      return { appName: 'chromium-browser', binary: 'chromium-browser' };
    case 'chrome':
    default:
      return { appName: 'google-chrome', binary: 'google-chrome' };
  }
}

/**
 * Launches the browser with the BackOverrides extension preloaded via --load-extension.
 */
export async function launchBrowserWithExtension(
  options: LaunchBrowserOptions
): Promise<LaunchBrowserResult> {
  const platform = os.platform();
  const browserType = options.browser || 'chrome';
  const targetUrl = options.url || 'http://localhost:8888/__back-overrides/status';
  const resolvedExtensionPath = path.resolve(options.extensionPath);

  if (!fs.existsSync(resolvedExtensionPath)) {
    throw new Error(`Extension path does not exist at: ${resolvedExtensionPath}`);
  }

  const { appName, binary } = resolveBrowserCommand(browserType, platform);

  const chromeArgs: string[] = [
    `--load-extension=${resolvedExtensionPath}`,
    '--no-first-run',
    '--no-default-browser-check',
  ];

  if (options.isolatedProfile) {
    const tempDir = path.join(os.tmpdir(), `back-overrides-${browserType}-profile`);
    chromeArgs.push(`--user-data-dir=${tempDir}`);
  }

  chromeArgs.push(targetUrl);

  let commandStr = '';

  if (platform === 'darwin') {
    // On macOS, 'open -na "Google Chrome" --args ...' launches an instance with the specified args
    const escapedArgs = chromeArgs.map((arg) => `"${arg}"`).join(' ');
    commandStr = `open -na "${appName}" --args ${escapedArgs}`;

    return new Promise((resolve) => {
      exec(commandStr, (err) => {
        if (err) {
          resolve({
            success: false,
            command: commandStr,
            message: `Failed to open ${appName}: ${err.message}. You can run manually: ${commandStr}`,
            browser: appName,
            platform,
          });
        } else {
          resolve({
            success: true,
            command: commandStr,
            message: `Successfully launched ${appName} with BackOverrides extension preloaded. Target: ${targetUrl}`,
            browser: appName,
            platform,
          });
        }
      });
    });
  }

  if (platform === 'win32') {
    commandStr = `start ${binary} ${chromeArgs.join(' ')}`;
    return new Promise((resolve) => {
      exec(commandStr, (err) => {
        if (err) {
          resolve({
            success: false,
            command: commandStr,
            message: `Failed to open ${binary}: ${err.message}`,
            browser: binary,
            platform,
          });
        } else {
          resolve({
            success: true,
            command: commandStr,
            message: `Launched ${binary} with extension. Target: ${targetUrl}`,
            browser: binary,
            platform,
          });
        }
      });
    });
  }

  // Linux
  commandStr = `${binary} ${chromeArgs.join(' ')}`;
  return new Promise((resolve) => {
    const child = spawn(binary, chromeArgs, {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();

    child.on('error', (err) => {
      resolve({
        success: false,
        command: commandStr,
        message: `Failed to spawn ${binary}: ${err.message}`,
        browser: binary,
        platform,
      });
    });

    // Give process a moment to trigger error if binary not found
    setTimeout(() => {
      resolve({
        success: true,
        command: commandStr,
        message: `Launched ${binary} with extension. Target: ${targetUrl}`,
        browser: binary,
        platform,
      });
    }, 400);
  });
}

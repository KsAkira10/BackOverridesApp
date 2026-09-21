import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { clearRuntimeInfo, getActiveRuntimeInfo } from '@back-overrides/cli';
import { getProjectPaths } from '../utils/paths.js';
import { getBackOverridesStatus } from './status.js';

export interface StartServerOptions {
  configPath?: string;
  port?: number;
  remote?: string;
  local?: string;
  cwd?: string;
}

export interface LifecycleResult {
  success: boolean;
  message: string;
  pid?: number;
  port?: number;
  cliUrl?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Starts the BackOverrides proxy in background.
 */
export async function startBackOverridesServer(
  options: StartServerOptions = {}
): Promise<LifecycleResult> {
  const paths = getProjectPaths(options.cwd);
  const currentStatus = await getBackOverridesStatus(paths.repoRoot);

  if (currentStatus.running && currentStatus.port) {
    return {
      success: true,
      message: `BackOverrides proxy is already running on port ${currentStatus.port} (PID: ${currentStatus.pid}).`,
      port: currentStatus.port,
      pid: currentStatus.pid,
      cliUrl: currentStatus.cliUrl,
    };
  }

  // Ensure CLI dist exists
  if (!fs.existsSync(paths.cliDistPath)) {
    throw new Error(
      `BackOverrides CLI dist file not found at ${paths.cliDistPath}. Please run 'npm run build' first.`
    );
  }

  const args: string[] = [paths.cliDistPath];
  if (options.configPath) {
    args.push('-c', options.configPath);
  } else if (fs.existsSync(paths.defaultConfigFile)) {
    args.push('-c', paths.defaultConfigFile);
  }

  if (options.port) {
    args.push('-p', String(options.port));
  }
  if (options.remote) {
    args.push('-r', options.remote);
  }
  if (options.local) {
    args.push('-l', options.local);
  }

  const child = spawn(process.execPath, args, {
    cwd: paths.repoRoot,
    detached: true,
    stdio: 'ignore',
  });
  child.unref();

  // Poll for runtime info
  const startTime = Date.now();
  while (Date.now() - startTime < 3500) {
    await sleep(250);
    const active = getActiveRuntimeInfo(paths.repoRoot);
    if (active) {
      return {
        success: true,
        message: `BackOverrides proxy started successfully on port ${active.port} (PID: ${active.pid}).`,
        port: active.port,
        pid: active.pid,
        cliUrl: active.cliUrl,
      };
    }
  }

  return {
    success: false,
    message: 'BackOverrides proxy was spawned but did not record an active runtime state within 3.5s.',
  };
}

/**
 * Stops the running BackOverrides proxy.
 */
export async function stopBackOverridesServer(cwd?: string): Promise<LifecycleResult> {
  const paths = getProjectPaths(cwd);
  const active = getActiveRuntimeInfo(paths.repoRoot);

  if (!active) {
    return {
      success: false,
      message: 'No active BackOverrides proxy process found to stop.',
    };
  }

  try {
    process.kill(active.pid, 'SIGTERM');
  } catch (err: any) {
    clearRuntimeInfo(paths.repoRoot);
    return {
      success: true,
      message: `Process ${active.pid} was already dead. Cleaned up runtime state.`,
    };
  }

  // Wait briefly and verify process died
  await sleep(400);
  clearRuntimeInfo(paths.repoRoot);

  return {
    success: true,
    message: `BackOverrides proxy (PID: ${active.pid}, Port: ${active.port}) was successfully stopped.`,
    pid: active.pid,
    port: active.port,
  };
}

/**
 * Restarts the BackOverrides proxy.
 */
export async function restartBackOverridesServer(
  options: StartServerOptions = {}
): Promise<LifecycleResult> {
  const paths = getProjectPaths(options.cwd);
  await stopBackOverridesServer(paths.repoRoot);
  await sleep(500);
  return startBackOverridesServer(options);
}

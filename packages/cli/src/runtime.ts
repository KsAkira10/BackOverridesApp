import fs from 'node:fs';
import path from 'node:path';

export const RUNTIME_FILENAME = '.back-overrides-runtime.json';

export interface RuntimeInfo {
  pid: number;
  port: number;
  cliUrl: string;
  startedAt: number;
}

/**
 * Saves runtime state of the active BackOverrides proxy instance.
 */
export function saveRuntimeInfo(info: RuntimeInfo, cwd: string = process.cwd()): void {
  try {
    const filePath = path.resolve(cwd, RUNTIME_FILENAME);
    fs.writeFileSync(filePath, JSON.stringify(info, null, 2), 'utf-8');
  } catch {
    // Non-critical, ignore write errors
  }
}

/**
 * Clears the runtime state file.
 */
export function clearRuntimeInfo(cwd: string = process.cwd()): void {
  try {
    const filePath = path.resolve(cwd, RUNTIME_FILENAME);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Non-critical
  }
}

/**
 * Reads the active runtime state file if the recorded process is still running.
 */
export function getActiveRuntimeInfo(cwd: string = process.cwd()): RuntimeInfo | null {
  try {
    const filePath = path.resolve(cwd, RUNTIME_FILENAME);
    if (!fs.existsSync(filePath)) return null;

    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as RuntimeInfo;

    if (!parsed || typeof parsed.port !== 'number' || typeof parsed.pid !== 'number') {
      clearRuntimeInfo(cwd);
      return null;
    }

    // Check if the process is still alive
    try {
      process.kill(parsed.pid, 0);
      return parsed;
    } catch {
      // Process has died, stale runtime file
      clearRuntimeInfo(cwd);
      return null;
    }
  } catch {
    return null;
  }
}

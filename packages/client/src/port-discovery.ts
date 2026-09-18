import { DEFAULT_PORT_SCAN_RANGE, DEFAULT_PROXY_PORT } from '@back-overrides/core';

export interface PortDiscoveryOptions {
  preferredPort?: number;
  searchRange?: number;
  timeoutMs?: number;
  host?: string;
}

/**
 * Checks if a BackOverrides server is running on a given host and port.
 */
export async function checkBackOverridesPort(
  port: number,
  host: string = 'localhost',
  timeoutMs: number = 300
): Promise<boolean> {
  const tryEndpoint = async (endpoint: string): Promise<boolean> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`http://${host}:${port}${endpoint}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data && typeof data === 'object') {
          if (endpoint.includes('status')) {
            const obj = data as { status?: string; app?: string };
            return obj.status === 'ok' || obj.app === 'back-overrides';
          }
          const obj = data as { remote?: string; overrides?: unknown[] };
          return typeof obj.remote === 'string' || Array.isArray(obj.overrides);
        }
      }
      return false;
    } catch {
      return false;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // Try fast /status first, fallback to /rules
  const statusOk = await tryEndpoint('/__back-overrides/status');
  if (statusOk) return true;

  return tryEndpoint('/__back-overrides/rules');
}

/**
 * Automatically discovers the active BackOverrides proxy port by probing ports
 * starting from preferredPort up to preferredPort + searchRange.
 */
export async function discoverCliUrl(options: PortDiscoveryOptions = {}): Promise<string> {
  const preferredPort = options.preferredPort ?? DEFAULT_PROXY_PORT;
  const searchRange = options.searchRange ?? DEFAULT_PORT_SCAN_RANGE;
  const host = options.host ?? 'localhost';
  const timeoutMs = options.timeoutMs ?? 300;

  // 1. First probe preferred port
  const isPreferredActive = await checkBackOverridesPort(preferredPort, host, timeoutMs);
  if (isPreferredActive) {
    return `http://${host}:${preferredPort}`;
  }

  // 2. Scan remaining ports in range sequentially
  for (let offset = 1; offset < searchRange; offset++) {
    const candidatePort = preferredPort + offset;
    const isActive = await checkBackOverridesPort(candidatePort, host, timeoutMs);
    if (isActive) {
      return `http://${host}:${candidatePort}`;
    }
  }

  // Fallback to preferred port if none responded
  return `http://${host}:${preferredPort}`;
}

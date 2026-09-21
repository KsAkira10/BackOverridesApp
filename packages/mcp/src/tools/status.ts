import http from 'node:http';
import { getActiveRuntimeInfo } from '@back-overrides/cli';
import { getProjectPaths } from '../utils/paths.js';

export interface BackOverridesStatusResult {
  running: boolean;
  status: 'online' | 'offline';
  port?: number;
  pid?: number;
  cliUrl?: string;
  uptimeSeconds?: number;
  remote?: string;
  local?: string;
  rulesCount?: number;
  rulesEndpoint?: string;
  statusEndpoint?: string;
  runtimeFile?: string;
  message: string;
}

function pingEndpoint(url: string, timeoutMs = 800): Promise<{ ok: boolean; data?: any }> {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const req = http.request(
        {
          hostname: parsed.hostname,
          port: parsed.port,
          path: parsed.pathname,
          method: 'GET',
          timeout: timeoutMs,
          headers: { Accept: 'application/json' },
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
              try {
                const parsed = JSON.parse(body);
                resolve({ ok: true, data: parsed });
              } catch {
                resolve({ ok: true });
              }
            } else {
              resolve({ ok: false });
            }
          });
        }
      );

      req.on('error', () => resolve({ ok: false }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ ok: false });
      });
      req.end();
    } catch {
      resolve({ ok: false });
    }
  });
}

/**
 * Checks the status of the BackOverrides server.
 */
export async function getBackOverridesStatus(cwd?: string): Promise<BackOverridesStatusResult> {
  const paths = getProjectPaths(cwd);
  const runtime = getActiveRuntimeInfo(paths.repoRoot);

  if (runtime) {
    const statusUrl = `http://localhost:${runtime.port}/__back-overrides/status`;
    const rulesUrl = `http://localhost:${runtime.port}/__back-overrides/rules`;

    const ping = await pingEndpoint(statusUrl);
    const rulesPing = await pingEndpoint(rulesUrl);

    const uptime = Math.floor((Date.now() - runtime.startedAt) / 1000);
    const rulesCount = Array.isArray(rulesPing.data?.overrides) ? rulesPing.data.overrides.length : undefined;
    const remote = rulesPing.data?.remote || ping.data?.remote;
    const local = rulesPing.data?.local;

    return {
      running: true,
      status: 'online',
      port: runtime.port,
      pid: runtime.pid,
      cliUrl: runtime.cliUrl || `http://localhost:${runtime.port}`,
      uptimeSeconds: uptime,
      remote,
      local,
      rulesCount,
      rulesEndpoint: rulesUrl,
      statusEndpoint: statusUrl,
      runtimeFile: paths.runtimePath,
      message: `BackOverrides proxy is running on port ${runtime.port} (PID: ${runtime.pid}, Uptime: ${uptime}s, ${rulesCount ?? 0} active rule(s)).`,
    };
  }

  // Probe default port 8888 in case started without runtime tracking
  const probe8888 = await pingEndpoint('http://localhost:8888/__back-overrides/status');
  if (probe8888.ok) {
    const rulesPing = await pingEndpoint('http://localhost:8888/__back-overrides/rules');
    return {
      running: true,
      status: 'online',
      port: 8888,
      cliUrl: 'http://localhost:8888',
      remote: rulesPing.data?.remote || probe8888.data?.remote,
      local: rulesPing.data?.local,
      rulesCount: Array.isArray(rulesPing.data?.overrides) ? rulesPing.data.overrides.length : undefined,
      rulesEndpoint: 'http://localhost:8888/__back-overrides/rules',
      statusEndpoint: 'http://localhost:8888/__back-overrides/status',
      runtimeFile: paths.runtimePath,
      message: 'BackOverrides proxy detected on port 8888 (running without runtime state file).',
    };
  }

  return {
    running: false,
    status: 'offline',
    runtimeFile: paths.runtimePath,
    message: 'BackOverrides proxy is currently offline. Use back_overrides_start to launch it.',
  };
}

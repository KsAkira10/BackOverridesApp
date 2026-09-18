import dns from 'node:dns';
import http from 'node:http';
import pc from 'picocolors';
import { DEFAULT_PROXY_PORT, type BackOverridesConfig } from '@back-overrides/core';
import { Logger } from './logger.js';
import { ProxyHandler } from './proxy-handler.js';
import { findAvailablePort } from './port-finder.js';
import { clearRuntimeInfo, saveRuntimeInfo } from './runtime.js';

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

export interface ProxyServerInstance {
  server: http.Server;
  logger: Logger;
  handler: ProxyHandler;
  close: () => Promise<void>;
  port: number;
}

export function createProxyServer(config: BackOverridesConfig): ProxyServerInstance {
  const logger = new Logger(config.verbose, config.silent);
  const handler = new ProxyHandler(config, logger);

  const server = http.createServer((req, res) => {
    handler.handleRequest(req, res);
  });

  const port = config.port ?? DEFAULT_PROXY_PORT;

  const close = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      clearRuntimeInfo();
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  };

  return {
    server,
    logger,
    handler,
    close,
    port,
  };
}

export async function startProxyServer(config: BackOverridesConfig): Promise<ProxyServerInstance> {
  const requestedPort = config.port ?? DEFAULT_PROXY_PORT;

  if (config.autoPort !== false) {
    try {
      const resolvedPort = await findAvailablePort(requestedPort);
      if (resolvedPort !== requestedPort) {
        if (!config.silent) {
          console.warn(pc.yellow(`\n⚠️  Port ${requestedPort} is already in use by another application.`));
          console.log(pc.green(`🔄 Automatically switching proxy to available port: ${pc.bold(resolvedPort)}\n`));
        }
        config.port = resolvedPort;
      }
    } catch {
      // If port finding fails, proceed to attempt requestedPort and let server error handler catch
    }
  }

  const instance = createProxyServer(config);

  return new Promise((resolve, reject) => {
    instance.server.once('error', reject);

    instance.server.listen(instance.port, () => {
      saveRuntimeInfo({
        pid: process.pid,
        port: instance.port,
        cliUrl: `http://localhost:${instance.port}`,
        startedAt: Date.now(),
      });

      const hasAuthRules = (config.overrides || []).some((o) => {
        const p = (o.path || '').toLowerCase();
        return p.includes('authorize') || p.includes('login') || p.includes('sso') || p.includes('saml');
      });

      instance.logger.banner({
        port: instance.port,
        remote: config.remote,
        local: config.local || 'http://localhost:3000',
        rulesCount: config.overrides?.length || 0,
        corsEnabled: config.cors?.enabled !== false,
        hasAuthRules,
      });

      // Handle termination signals
      const onSignal = () => {
        console.log('\nShutting down BackOverrides proxy...');
        clearRuntimeInfo();
        instance.close().then(() => {
          process.exit(0);
        });
      };

      process.once('SIGINT', onSignal);
      process.once('SIGTERM', onSignal);

      resolve(instance);
    });
  });
}

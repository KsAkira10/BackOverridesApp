import type { BackOverridesConfig } from '@back-overrides/core';
import { setupFetchInterceptor } from './fetch-interceptor.js';
import { fetchRulesFromCli } from './sync.js';
import type { ClientInitOptions, InterceptorControl } from './types.js';

export * from './types.js';
export * from './fetch-interceptor.js';
export * from './service-worker.js';
export * from './sync.js';

/**
 * Initializes BackOverrides in the current browser window.
 * If config is omitted, it automatically fetches the active rules from the CLI proxy.
 */
export async function setupBackOverrides(
  options: ClientInitOptions = {}
): Promise<InterceptorControl> {
  let config: BackOverridesConfig;

  const cliUrl = options.cliUrl || 'http://localhost:8888';

  if (options.config) {
    config = options.config;
  } else {
    config = await fetchRulesFromCli(cliUrl);
  }

  const proxyUrl = options.routeViaProxy !== false ? cliUrl : undefined;
  const control = setupFetchInterceptor(config, {
    debug: options.debug,
    proxyUrl,
  });

  if (options.autoSync) {
    const cliUrl = options.cliUrl || 'http://localhost:8888';
    const intervalMs = options.syncIntervalMs || 5000;

    setInterval(async () => {
      if (!control.isActive()) return;
      try {
        const latestConfig = await fetchRulesFromCli(cliUrl);
        control.updateConfig(latestConfig);
      } catch {
        // Silently ignore sync failures during dev
      }
    }, intervalMs);
  }

  return control;
}

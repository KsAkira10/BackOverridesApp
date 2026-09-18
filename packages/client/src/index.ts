import type { BackOverridesConfig } from '@back-overrides/core';
import { setupFetchInterceptor } from './fetch-interceptor.js';
import { fetchRulesFromCli } from './sync.js';
import { discoverCliUrl } from './port-discovery.js';
import type { ClientInitOptions, InterceptorControl } from './types.js';

export * from './types.js';
export * from './fetch-interceptor.js';
export * from './service-worker.js';
export * from './sync.js';
export * from './port-discovery.js';

/**
 * Initializes BackOverrides in the current browser window.
 * If config is omitted, it automatically fetches active rules from the CLI proxy,
 * dynamically discovering the running port if 8888 is busy.
 */
export async function setupBackOverrides(
  options: ClientInitOptions = {}
): Promise<InterceptorControl> {
  let config: BackOverridesConfig;
  let activeCliUrl = options.cliUrl;

  if (!activeCliUrl) {
    activeCliUrl = await discoverCliUrl();
  }

  if (options.config) {
    config = options.config;
  } else {
    try {
      config = await fetchRulesFromCli(activeCliUrl);
    } catch (err) {
      // If initial fetch failed and user did not specify a custom url, try discovery fallback
      if (!options.cliUrl || options.cliUrl === 'http://localhost:8888') {
        const discovered = await discoverCliUrl();
        if (discovered !== activeCliUrl) {
          activeCliUrl = discovered;
          config = await fetchRulesFromCli(activeCliUrl);
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }
  }

  const proxyUrl = options.routeViaProxy !== false ? activeCliUrl : undefined;
  const control = setupFetchInterceptor(config, {
    debug: options.debug,
    proxyUrl,
  });

  if (options.autoSync) {
    const intervalMs = options.syncIntervalMs || 5000;

    setInterval(async () => {
      if (!control.isActive()) return;
      try {
        const latestConfig = await fetchRulesFromCli(activeCliUrl);
        control.updateConfig(latestConfig);
      } catch {
        // Attempt port rediscovery in case proxy restarted on another port
        try {
          const freshCliUrl = await discoverCliUrl();
          if (freshCliUrl !== activeCliUrl) {
            activeCliUrl = freshCliUrl;
            const latestConfig = await fetchRulesFromCli(activeCliUrl);
            control.updateConfig(latestConfig);
          }
        } catch {
          // Silently ignore sync failures during dev
        }
      }
    }, intervalMs);
  }

  return control;
}

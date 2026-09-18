import type { BackOverridesConfig } from '@back-overrides/core';

/**
 * Fetches the active configuration and rules from a running BackOverrides CLI proxy.
 */
export async function fetchRulesFromCli(cliUrl: string = 'http://localhost:8888'): Promise<BackOverridesConfig> {
  const url = `${cliUrl.replace(/\/+$/, '')}/__back-overrides/rules`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch BackOverrides rules from ${url}: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as BackOverridesConfig;
}

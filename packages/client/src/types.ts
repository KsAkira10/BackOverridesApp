import type { BackOverridesConfig } from '@back-overrides/core';

export interface ClientInitOptions {
  /**
   * Static BackOverrides configuration.
   * If not provided, configuration is fetched from the CLI proxy URL.
   */
  config?: BackOverridesConfig;
  /**
   * URL of the running BackOverrides CLI proxy.
   * Default: http://localhost:8888.
   */
  cliUrl?: string;
  /**
   * Automatically synchronize rules from the CLI proxy periodically.
   * Default: false.
   */
  autoSync?: boolean;
  /**
   * Interval in milliseconds for autoSync polling.
   * Default: 5000ms.
   */
  syncIntervalMs?: number;
  /**
   * Enable console logs when requests are intercepted.
   * Default: true.
   */
  debug?: boolean;
  /**
   * Route intercepted requests through the BackOverrides CLI proxy to automatically
   * inject CORS and Private Network Access headers, eliminating CORS errors on localhost.
   * Default: true.
   */
  routeViaProxy?: boolean;
}

export interface InterceptorControl {
  /**
   * Update the rules actively used by the interceptor.
   */
  updateConfig: (newConfig: BackOverridesConfig) => void;
  /**
   * Restore original fetch and XMLHttpRequest methods.
   */
  restore: () => void;
  /**
   * Check if the interceptor is currently active.
   */
  isActive: () => boolean;
}

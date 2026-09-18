import { setupBackOverrides, setupFetchInterceptor } from './index.js';
import type { BackOverridesConfig } from '@back-overrides/core';

declare global {
  interface Window {
    __BACK_OVERRIDES_CLI_URL?: string;
    __BACK_OVERRIDES__?: unknown;
    __BACK_OVERRIDES_INITIAL_CONFIG__?: BackOverridesConfig;
  }
}

// 1. Synchronous patch on line 1 if initial config was embedded by proxy
if (typeof window !== 'undefined' && window.__BACK_OVERRIDES_INITIAL_CONFIG__) {
  const cliUrl = window.__BACK_OVERRIDES_CLI_URL || 'http://localhost:8888';
  try {
    const ctrl = setupFetchInterceptor(window.__BACK_OVERRIDES_INITIAL_CONFIG__, {
      debug: true,
      proxyUrl: cliUrl,
    });
    window.__BACK_OVERRIDES__ = ctrl;
  } catch {}
}

(async () => {
  if (typeof window === 'undefined') return;

  const cliUrl = window.__BACK_OVERRIDES_CLI_URL || 'http://localhost:8888';
  const initialConfig = window.__BACK_OVERRIDES_INITIAL_CONFIG__;

  try {
    const control = await setupBackOverrides({
      cliUrl,
      config: initialConfig,
      autoSync: true,
      debug: true,
    });

    window.__BACK_OVERRIDES__ = control;

    console.log(
      '%c⚡ [BackOverrides] In-Browser Interceptor Activated!\n' +
        `%cConnected to CLI at: %c${cliUrl}\n` +
        '%cEndpoints matching configured rules will be transparently redirected to localhost without changing remote URLs in your frontend code.\n' +
        'To deactivate at any time: window.__BACK_OVERRIDES__.restore()',
      'background: #0ea5e9; color: #ffffff; font-weight: bold; font-size: 13px; padding: 4px 8px; border-radius: 4px;',
      'color: #9ca3af; font-size: 11px;',
      'color: #38bdf8; font-weight: bold; font-size: 11px;',
      'color: #6b7280; font-size: 10px;'
    );
  } catch (err: unknown) {
    const error = err as Error;
    console.warn(
      `[BackOverrides] Could not connect to CLI at ${cliUrl} (${error.message}). ` +
        'Make sure "npx back-overrides" is running.'
    );
  }
})();

export default setupBackOverrides;
export { setupBackOverrides };

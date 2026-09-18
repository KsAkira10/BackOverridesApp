import { defineConfig } from 'tsup';

export default defineConfig([
  // Library entry
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: { resolve: true },
    clean: true,
    target: 'es2022',
    noExternal: ['@back-overrides/core'],
  },
  // Browser standalone bundle (for <script> injection, DevTools console and dynamic import)
  {
    entry: {
      'back-overrides': 'src/standalone.ts',
    },
    format: ['iife', 'esm'],
    globalName: 'BackOverridesClient',
    target: 'es2022',
    minify: true,
    noExternal: ['@back-overrides/core'],
  },
]);

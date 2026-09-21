import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  target: 'node18',
  external: ['@back-overrides/core', '@back-overrides/cli'],
  outExtension() {
    return {
      js: '.js',
      dts: '.d.ts',
    };
  },
  banner: {
    js: '#!/usr/bin/env node',
  },
});

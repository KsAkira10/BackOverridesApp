import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  target: 'node18',
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

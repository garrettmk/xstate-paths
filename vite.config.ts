/// <reference types="vite/client" />

import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'xstate-paths',
      fileName: format => `xstate-paths.${format}.js`
    },
    rollupOptions: {
      external: ['xstate'],
    }
  }
});
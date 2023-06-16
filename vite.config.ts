/// <reference types="vite/client" />

import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'xstate-paths',
      fileName: format => `xstate-paths.${format}.js`
    }
  }
});
/// <reference types="vite/client" />

import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    dts({
      insertTypesEntry: true,
      exclude: ['src/tests', 'src/examples']
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'xstate-paths',
      fileName: format => ({
        es: 'xstate-paths.es.js',
        umd: 'xstate-paths.umd.cjs',
      }[format])
    },
    rollupOptions: {
      external: ['xstate'],
    }
  }
});
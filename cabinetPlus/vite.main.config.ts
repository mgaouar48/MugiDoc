import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  mode: process.env.NODE_ENV,
  root: path.resolve(__dirname, 'src/main'),
  build: {
    outDir: path.resolve(__dirname, 'dist/main'),
    lib: {
      entry: 'main.ts',
      formats: ['cjs'],
      fileName: () => 'main.cjs',
    },
    rollupOptions: {
      external: [
        'electron',
        'path',
        'fs',
        'os',
        'crypto',
        'bcryptjs',
        'better-sqlite3',
        'express',
        'cors',
        /^node:.*/
      ],
    },
    emptyOutDir: true,
    target: 'node18',
    minify: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
});

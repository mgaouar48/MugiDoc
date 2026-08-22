import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  mode: process.env.NODE_ENV,
  root: path.resolve(__dirname, 'src/preload'),
  build: {
    outDir: path.resolve(__dirname, 'dist/preload'),
    lib: {
      entry: 'preload.ts',
      formats: ['cjs'],
      fileName: () => 'preload.cjs',
    },
    rollupOptions: {
      external: ['electron'],
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

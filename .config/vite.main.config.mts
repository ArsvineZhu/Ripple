import { defineConfig } from 'vite';
export default defineConfig({
  build: {
    minify: true,
    reportCompressedSize: false,
    lib: { entry: 'src/main/index.ts', fileName: () => 'main.cjs', formats: ['cjs'] },
  },
});

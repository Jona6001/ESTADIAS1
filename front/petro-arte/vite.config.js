import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  base: '/ESTADIAS1/',
    build: {
    outDir: 'docs',
  },
  plugins: [react()],
});

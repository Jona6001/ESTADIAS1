import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/ESTADIAS1/', // <-- esto es correcto para tu repo
  build: {
    outDir: 'docs',    // <-- esto es correcto para GitHub Pages
  },
  plugins: [react()],
});
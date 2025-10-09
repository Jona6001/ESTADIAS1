import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/ESTADIAS1/', // <-- debe ser igual al nombre del repo
  build: {
    outDir: '../../docs', // <-- genera el build en la carpeta docs en la raíz de front
  },
  plugins: [react()],
});
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, /api is proxied to the Spring Boot service so the browser stays same-origin (no CORS needed).
// Override the target with VITE_API_TARGET, e.g. VITE_API_TARGET=http://qa-host:8080 npm run dev
const target = process.env.VITE_API_TARGET || 'http://localhost:8080';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': { target, changeOrigin: true } } },
});

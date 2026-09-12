import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Where the Express API lives during local development. The browser always
  // calls the relative path `/api`; this proxy forwards it to the backend so we
  // avoid CORS and cookie-domain headaches in dev.
  const apiProxy = env.VITE_API_PROXY || 'http://localhost:5000';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiProxy,
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 4173,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      // Split the big vendor libraries out of the app bundle so the initial
      // load stays lean as the app grows toward 100+ vehicles / many pages.
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'query-vendor': ['@tanstack/react-query'],
          },
        },
      },
    },
  };
});

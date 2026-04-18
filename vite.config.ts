import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');

  // Local backend URL (Express + MongoDB). Used by the dev proxy.
  const localBackend = 'http://localhost:3005';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      // Expose the API base URL to the frontend bundle
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
        env.VITE_API_BASE_URL || 'https://aquagrow.onrender.com/api'
      ),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // React core — rarely changes, long cache life
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            // Animation library
            'vendor-motion': ['motion'],
            // Charts — large, isolate separately
            'vendor-recharts': ['recharts'],
            // D3 utilities used by recharts / custom viz
            'vendor-d3': ['d3'],
            // Icon set — large SVG bundle
            'vendor-lucide': ['lucide-react'],
            // Google GenAI SDK
            'vendor-genai': ['@google/genai'],
            // Markdown renderer
            'vendor-markdown': ['react-markdown'],
          },
        },
      },
      // Raise the warning threshold slightly — chart apps are naturally heavier
      chunkSizeWarningLimit: 600,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // ── Dev proxy: /api/* → local Express server (MongoDB-backed) ──────────
      // This lets the admin panel hit your local backend during development
      // without changing any production code. Set VITE_API_BASE_URL in .env
      // to switch between local and production.
      proxy: {
        '/api': {
          target: localBackend,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});

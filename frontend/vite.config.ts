import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isPages = mode === 'pages' || process.env.GITHUB_PAGES === 'true'
  const base = isPages ? '/csmcrm/' : (process.env.VITE_BASE_PATH || '/')

  return {
  base,
  plugins: [
    react(),
    {
      name: 'html-base-path',
      transformIndexHtml(html: string) {
        return html.replace(/%BASE_URL%/g, base);
      },
    },
  ],
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://backend:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  optimizeDeps: {
    force: true,
    include: ['react', 'react-dom']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom']
        }
      }
    }
  },
  define: {
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || (process.env.VITE_API_BASE_URL ? `${String(process.env.VITE_API_BASE_URL).replace(/\/$/, '')}/api` : '') || 'http://localhost:3004/api')
  }
  };
}); 
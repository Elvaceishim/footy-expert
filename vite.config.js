import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  console.log('🔧 Vite Config - Environment variables:', {
    mode,
    VITE_OPENROUTER_API_KEY: env.VITE_OPENROUTER_API_KEY ? `PRESENT (${env.VITE_OPENROUTER_API_KEY.length} chars)` : 'MISSING'
  });

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  }
})

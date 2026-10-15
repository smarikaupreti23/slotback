import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In development, /api calls are proxied to the local FastAPI server,
// so no backend URL (or secret) is needed in the browser code.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // フロントから /api へのリクエストを Express サーバー（3001番）へ転送する
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})

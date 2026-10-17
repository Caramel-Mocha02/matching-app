import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // フロントから /api へのリクエストを Express サーバー（通常は3001番）へ転送する
    // API_PROXY_TARGET を指定すると転送先を変えられる（Playwright のテストでは別の番号のサーバーを使う）
    proxy: {
      '/api': process.env.API_PROXY_TARGET ?? 'http://localhost:3001',
    },
  },
})

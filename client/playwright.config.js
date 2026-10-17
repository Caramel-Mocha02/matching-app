// Playwright（ブラウザを自動で操作するテスト）の設定。
// 実行：client フォルダで npm run test:e2e
// 普段の開発用サーバーとぶつからないよう、テスト専用の番号でサーバーを起動する。
import { defineConfig } from '@playwright/test'
import { API_PORT, WEB_PORT, E2E_USERS } from './e2e/helpers.js'

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 20_000 },
  workers: 1, // 同じテスト用アカウントを使うので、1つずつ順番に実行する
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: './e2e/global-setup.js', // テスト用アカウントを作る
  globalTeardown: './e2e/global-teardown.js', // テスト用アカウントを消す
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    channel: 'chrome', // パソコンに入っている Chrome を使う（追加のダウンロード不要）
    locale: 'ja-JP',
    viewport: { width: 1280, height: 900 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      // テスト用の Express サーバー。運営者はテスト用の運営者アカウントだけにし、
      // Claude API は使わない（料金がかからないよう、説明文は定型文にする）
      command: 'node index.js',
      cwd: '../server',
      port: API_PORT,
      env: { PORT: String(API_PORT), ADMIN_EMAILS: E2E_USERS.admin.email, ANTHROPIC_API_KEY: '' },
      reuseExistingServer: false,
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort`,
      port: WEB_PORT,
      env: { API_PROXY_TARGET: `http://localhost:${API_PORT}` },
      reuseExistingServer: false,
    },
  ],
})

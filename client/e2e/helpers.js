// テストで共通して使う設定と処理
import { createClient } from '@supabase/supabase-js'
import { expect } from '@playwright/test'

export const API_PORT = 3101
export const WEB_PORT = 5180
export const PASSWORD = 'e2e-password-123'

// テスト用の一時アカウント（テストの前に作り、後で消す）
export const E2E_USERS = {
  user: { email: 'e2e-user@example.com', nickname: 'E2Eユーザー' }, // 診断済み・年齢確認はまだ
  admin: { email: 'e2e-admin@example.com', nickname: 'E2E運営' }, // 運営者
  withdraw: { email: 'e2e-withdraw@example.com', nickname: 'E2E退会' }, // 退会のテスト用
}

// Secret key を使う Supabase の接続（テスト用アカウントの準備・後片付けに使う）
export function adminClient() {
  process.loadEnvFile(new URL('../../server/.env', import.meta.url).pathname)
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } })
}

// 画面からログインする
export async function login(page, email) {
  await page.goto('/login')
  await page.getByLabel('メールアドレス').fill(email)
  await page.getByLabel('パスワード').fill(PASSWORD)
  await page.getByRole('button', { name: 'ログイン', exact: true }).click()
  await expect(page).toHaveURL(/\/diagnosis/)
}

// 診断画面の左側のステップ一覧から、指定したステップへ移動する。
// ボタンの名前は「3 外見 0/10」（未完了）や「外見 10/10」（完了済みは番号の代わりにチェックマーク）になる
export async function openStep(page, title) {
  await page.getByRole('button', { name: new RegExp(`^\\d*\\s*${title}\\s*(\\d+/\\d+|任意)?$`) }).first().click()
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
}

// 1×1 の小さな PNG 画像（書類のアップロードのテストに使う）
export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

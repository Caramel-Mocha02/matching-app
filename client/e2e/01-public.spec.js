// ログインしていない人が見る画面
import { test, expect } from '@playwright/test'

test('トップ画面が表示される', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /相性の良い人に/ })).toBeVisible()
  await expect(page.getByRole('link', { name: '無料で相性診断をはじめる' })).toBeVisible()
})

test('ログインしていないと、診断画面からログイン画面に移動する', async ({ page }) => {
  await page.goto('/diagnosis')
  await expect(page).toHaveURL(/\/login/)
})

test('新規登録で短いパスワードを入れると、エラーが出る', async ({ page }) => {
  await page.goto('/signup')
  await page.getByLabel('メールアドレス').fill('short-password@example.com')
  await page.getByLabel(/パスワード/).fill('123')
  await page.getByRole('button', { name: '登録する' }).click()
  await expect(page.getByText('パスワードは6文字以上で入力してください。')).toBeVisible()
})

test('間違ったパスワードではログインできない', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('メールアドレス').fill('e2e-user@example.com')
  await page.getByLabel('パスワード').fill('wrong-password')
  await page.getByRole('button', { name: 'ログイン', exact: true }).click()
  await expect(page.getByText('メールアドレスまたはパスワードが正しくありません。')).toBeVisible()
})

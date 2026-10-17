// メッセージ：おすすめの相手に、いいねを待たずにメッセージを送れる
import { test, expect } from '@playwright/test'
import { E2E_USERS, login } from './helpers.js'

test('おすすめの相手にメッセージを送ると、やりとりと一覧に表示される', async ({ page }) => {
  await login(page, E2E_USERS.user.email)
  await page.goto('/matches')
  await page.locator('.MuiCard-root', { hasText: 'おすすめ 1位' }).getByRole('link', { name: 'メッセージ' }).click()
  await expect(page).toHaveURL(/\/messages\/.+/)

  const text = `E2Eテストのメッセージ ${Date.now()}`
  await page.getByPlaceholder('メッセージを入力').fill(text)
  await page.getByRole('button', { name: '送信' }).click()
  await expect(page.getByText(text, { exact: true })).toBeVisible()
  // 左の一覧にも、最後のメッセージとして表示される
  await expect(page.getByText(`あなた：${text}`)).toBeVisible()
})

// 退会：確認の文字を入れないと押せない → 退会するとトップに戻り、もうログインできない
import { test, expect } from '@playwright/test'
import { E2E_USERS, login, PASSWORD } from './helpers.js'

test('退会すると、データが消えてログインできなくなる', async ({ page }) => {
  await login(page, E2E_USERS.withdraw.email)
  await page.getByRole('link', { name: 'アカウント' }).click()
  await page.getByRole('button', { name: '退会する' }).click()

  const dialog = page.getByRole('dialog')
  const confirmButton = dialog.getByRole('button', { name: '退会する' })
  await expect(confirmButton).toBeDisabled() // 確認の文字を入れるまでは押せない
  await dialog.getByLabel(/確認のため/).fill('退会する')
  await confirmButton.click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByText('退会が完了しました。ご利用ありがとうございました。')).toBeVisible()

  // 同じメールアドレスとパスワードでは、もうログインできない
  await page.goto('/login')
  await page.getByLabel('メールアドレス').fill(E2E_USERS.withdraw.email)
  await page.getByLabel('パスワード').fill(PASSWORD)
  await page.getByRole('button', { name: 'ログイン', exact: true }).click()
  await expect(page.getByText('メールアドレスまたはパスワードが正しくありません。')).toBeVisible()
})

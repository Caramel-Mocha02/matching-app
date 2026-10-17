// 年齢確認とメッセージ：確認前は送れない → 書類を提出 → 運営者が承認 → 送れるようになる
import { test, expect } from '@playwright/test'
import { E2E_USERS, login, TINY_PNG } from './helpers.js'

test.describe.configure({ mode: 'serial' }) // 上から順に、前のテストの結果を引き継いで進める

let chatUrl // おすすめ1位の相手とのチャット画面

test('年齢確認の前は、メッセージを送れず案内が出る', async ({ page }) => {
  await login(page, E2E_USERS.user.email)
  await page.goto('/matches')
  await page.locator('.MuiCard-root', { hasText: 'おすすめ 1位' }).getByRole('link', { name: 'メッセージ' }).click()
  await expect(page).toHaveURL(/\/messages\/.+/)
  chatUrl = new URL(page.url()).pathname
  await expect(page.getByText('メッセージを送るには、年齢確認が必要です。')).toBeVisible()
  await expect(page.getByPlaceholder('メッセージを入力')).toHaveCount(0)
})

test('18歳未満の生年月日では提出できない', async ({ page }) => {
  await login(page, E2E_USERS.user.email)
  await page.goto('/age-verification')
  await page.getByTestId('id-document-input').setInputFiles({ name: 'id.png', mimeType: 'image/png', buffer: TINY_PNG })
  const tooYoung = new Date()
  tooYoung.setFullYear(tooYoung.getFullYear() - 17)
  await page.getByLabel('生年月日').fill(tooYoung.toISOString().slice(0, 10))
  await page.getByRole('button', { name: '提出する' }).click()
  await expect(page.getByText('18歳未満の方はご利用いただけません。')).toBeVisible()
})

test('書類を提出すると「確認中」になる', async ({ page }) => {
  await login(page, E2E_USERS.user.email)
  await page.goto('/age-verification')
  await page.getByTestId('id-document-input').setInputFiles({ name: 'id.png', mimeType: 'image/png', buffer: TINY_PNG })
  await page.getByLabel('生年月日').fill('1995-04-01')
  await page.getByRole('button', { name: '提出する' }).click()
  await expect(page.getByText('確認中', { exact: true })).toBeVisible()
  // 確認中のあいだも、メッセージは送れない
  await page.goto(chatUrl)
  await expect(page.getByText(/年齢確認の書類を確認中です/)).toBeVisible()
})

test('運営者でない人は、審査画面を使えない', async ({ page }) => {
  await login(page, E2E_USERS.user.email)
  await page.goto('/admin/age-verifications')
  await expect(page.getByText('運営者のみ利用できます。')).toBeVisible()
})

test('運営者が審査画面で承認する', async ({ page }) => {
  await login(page, E2E_USERS.admin.email)
  await page.goto('/account')
  await page.getByRole('link', { name: /年齢確認の審査画面へ/ }).click()
  const request = page.locator('.MuiCard-root', { hasText: E2E_USERS.user.email })
  await expect(request.getByText('1995-04-01')).toBeVisible()
  await expect(request.getByRole('img', { name: '本人確認書類' })).toBeVisible()
  await request.getByRole('button', { name: '承認する' }).click()
  await expect(page.locator('.MuiCard-root', { hasText: E2E_USERS.user.email })).toHaveCount(0)
})

test('承認されると、メッセージを送れる', async ({ page }) => {
  await login(page, E2E_USERS.user.email)
  await page.goto('/account')
  await expect(page.getByText('確認済み', { exact: true })).toBeVisible()

  await page.goto(chatUrl)
  const text = `E2Eテストのメッセージ ${Date.now()}`
  await page.getByPlaceholder('メッセージを入力').fill(text)
  await page.getByRole('button', { name: '送信' }).click()
  await expect(page.getByText(text)).toBeVisible()
  // 左の一覧にも、最後のメッセージとして表示される
  await expect(page.getByText(`あなた：${text}`)).toBeVisible()
})

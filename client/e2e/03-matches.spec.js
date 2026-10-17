// おすすめ（マッチング結果）：表示・横長のレイアウト・説明文・いいね
import { test, expect } from '@playwright/test'
import { E2E_USERS, login } from './helpers.js'

test.beforeEach(async ({ page }) => {
  await login(page, E2E_USERS.user.email)
})

test('おすすめが表示され、点数と説明文（良い点・注意点）がある', async ({ page }) => {
  await page.getByRole('link', { name: 'おすすめ' }).first().click()
  const first = page.locator('.MuiCard-root', { hasText: 'おすすめ 1位' })
  await expect(first).toBeVisible()
  await expect(first.getByText(/^(とても良い|良い|ふつう|低め)$/).first()).toBeVisible() // 点数の言葉
  await expect(first.getByText('相性が良いポイント').last()).toBeVisible() // 説明文の見出し
  await expect(first.getByText('注意したいポイント').last()).toBeVisible()
})

test('PC 幅では、説明文が点数の右側に並ぶ（横長の表示）', async ({ page }) => {
  await page.goto('/matches')
  const first = page.locator('.MuiCard-root', { hasText: 'おすすめ 1位' })
  const score = await first.getByText('相性', { exact: true }).boundingBox()
  const reason = await first.getByText('おすすめの理由').boundingBox()
  expect(reason.x).toBeGreaterThan(score.x) // 右側にある
})

test('いいねを押すと「いいね済み」になる', async ({ page }) => {
  await page.goto('/matches')
  const first = page.locator('.MuiCard-root', { hasText: 'おすすめ 1位' })
  await first.getByRole('button', { name: 'いいね', exact: true }).click()
  await expect(first.getByRole('button', { name: /いいね済み|お互いにいいね/ })).toBeVisible()
})

test.describe('スマホ幅', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('説明文が点数の下に並び、画面下部にメニューが出る', async ({ page }) => {
    await page.goto('/matches')
    const first = page.locator('.MuiCard-root', { hasText: 'おすすめ 1位' })
    const score = await first.getByText('相性', { exact: true }).boundingBox()
    const reason = await first.getByText('おすすめの理由').boundingBox()
    expect(reason.y).toBeGreaterThan(score.y) // 下にある
    await expect(page.locator('.MuiBottomNavigation-root')).toBeVisible()
  })
})

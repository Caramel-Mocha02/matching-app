// 診断：ステップの表示・「自分」と「お相手」をまとめた項目・自動保存
import { test, expect } from '@playwright/test'
import { E2E_USERS, login, openStep } from './helpers.js'

test.beforeEach(async ({ page }) => {
  await login(page, E2E_USERS.user.email)
})

// 外見のステップの「体型」の項目（自分の体型と、お相手の好みが入っている枠）
const bodyTypeItem = (page) =>
  page.locator('div', { has: page.getByText('体型', { exact: true }) }).filter({ hasText: 'お相手の好み' }).last()

test('全8ステップと進み具合が表示される', async ({ page }) => {
  const nav = page.locator('.MuiCard-root').first() // 左側のステップ一覧
  for (const title of ['基本情報', '結婚について', '外見', '清潔感', '性格・内面', '会話', '生活価値観', '確認']) {
    await expect(nav.getByText(title, { exact: true })).toBeVisible()
  }
  await expect(page.getByText(/\d+ \/ \d+ 項目/).first()).toBeVisible()
})

test('外見のステップで「あなた」と「お相手の好み」が1つの項目にまとまっている', async ({ page }) => {
  await openStep(page, '外見')
  const item = bodyTypeItem(page)
  await expect(item.getByLabel('あなた')).toBeVisible() // 自分の体型を選ぶ欄
  await expect(item.getByText('お相手の好み')).toBeVisible()
  await expect(item.getByRole('button', { name: '好き' }).first()).toBeVisible()
})

test('回答を変えると自動で保存され、再読み込みしても残っている', async ({ page }) => {
  await openStep(page, '外見')
  // 体型の「細身」の行の「好き」を押す
  const slimLike = () =>
    bodyTypeItem(page).locator('div', { has: page.getByText('細身', { exact: true }) }).last().getByRole('button', { name: '好き' })
  await slimLike().click()
  await expect(page.getByText(/保存済み/)).toBeVisible()

  await page.reload()
  await openStep(page, '外見')
  await expect(slimLike()).toHaveAttribute('aria-pressed', 'true')
})

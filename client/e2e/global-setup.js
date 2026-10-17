// テストの前に、テスト用の一時アカウントを作る。
// 一般ユーザーは、テストユーザー「はると」の診断の回答を写して「診断済み」にしておく（年齢確認はまだ）。
import { adminClient, E2E_USERS, PASSWORD } from './helpers.js'
import globalTeardown from './global-teardown.js'

export default async function globalSetup() {
  await globalTeardown() // 前回のテストの残りがあれば消す
  const admin = adminClient()

  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const source = list.users.find((u) => u.email === 'test-user-01@example.com')
  if (!source) throw new Error('テストユーザー（test-user-01）がいません。server フォルダで npm run seed を実行してください。')
  const { data: profile } = await admin.from('profiles').select('*').eq('id', source.id).single()
  const { data: preferences } = await admin.from('preferences').select('*').eq('id', source.id).single()
  for (const row of [profile, preferences]) {
    delete row.created_at
    delete row.updated_at
  }

  for (const { email, nickname } of Object.values(E2E_USERS)) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { dummy: true }, // npm run seed で作り直したときにも消えるよう、テストユーザーの目印を付ける
    })
    if (error) throw error
    const id = data.user.id
    // 必須条件は外しておく（おすすめが0人にならないように）
    const { error: e1 } = await admin.from('profiles').insert({ ...profile, id, nickname, photo_paths: [] })
    if (e1) throw e1
    const { error: e2 } = await admin.from('preferences').insert({ ...preferences, id, must_conditions: {} })
    if (e2) throw e2
  }
}

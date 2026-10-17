// テストの後に、テスト用の一時アカウントと、そのアカウントが残したデータを消す
import { adminClient, E2E_USERS } from './helpers.js'

export default async function globalTeardown() {
  const admin = adminClient()
  const emails = Object.values(E2E_USERS).map((u) => u.email)
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 })

  for (const user of data.users.filter((u) => emails.includes(u.email))) {
    // 写真は自動では消えないので先に消す（いいね・メッセージなどはアカウント削除で消える）
    const { data: files } = await admin.storage.from('avatars').list(user.id)
    if (files?.length) await admin.storage.from('avatars').remove(files.map((f) => `${user.id}/${f.name}`))
    await admin.auth.admin.deleteUser(user.id)
  }
}

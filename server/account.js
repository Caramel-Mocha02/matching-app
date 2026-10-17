// 退会（アカウントの削除）。
// ログインのアカウント（auth.users）を消すと、データベースの設定（on delete cascade）によって
// プロフィール・希望条件・マッチング結果・いいね・メッセージも自動で削除される。
// 写真（Storage）は自動では消えないので、先に削除しておく。
import { supabaseAdmin } from './lib/supabaseAdmin.js'

export async function deleteAccount(userId) {
  // 1. 写真を削除する（avatars/ユーザーID/ の中身をすべて）
  const { data: files, error: listError } = await supabaseAdmin.storage.from('avatars').list(userId, { limit: 1000 })
  if (listError) throw listError
  if (files.length > 0) {
    const { error: removeError } = await supabaseAdmin.storage.from('avatars').remove(files.map((f) => `${userId}/${f.name}`))
    if (removeError) throw removeError
  }

  // 2. ログインのアカウントを削除する（関係するデータもまとめて消える）
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (error) throw error
}

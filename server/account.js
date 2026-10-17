// 退会（アカウントの削除）。
// ログインのアカウント（auth.users）を消すと、データベースの設定（on delete cascade）によって
// プロフィール・希望条件・マッチング結果・いいね・メッセージ・年齢確認の状態も自動で削除される。
// 写真と本人確認書類（Storage）は自動では消えないので、先に削除しておく。
import { supabaseAdmin } from './lib/supabaseAdmin.js'

// 保存場所（バケット）の中の、そのユーザーのフォルダを空にする
async function removeUserFolder(bucket, userId) {
  const { data: files, error: listError } = await supabaseAdmin.storage.from(bucket).list(userId, { limit: 1000 })
  if (listError) throw listError
  if (files.length === 0) return
  const { error } = await supabaseAdmin.storage.from(bucket).remove(files.map((f) => `${userId}/${f.name}`))
  if (error) throw error
}

export async function deleteAccount(userId) {
  // 1. 写真と本人確認書類を削除する
  await removeUserFolder('avatars', userId)
  await removeUserFolder('id-documents', userId)

  // 2. ログインのアカウントを削除する（関係するデータもまとめて消える）
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (error) throw error
}

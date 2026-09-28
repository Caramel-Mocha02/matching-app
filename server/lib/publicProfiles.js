// 他のユーザーに見せてよいプロフィール項目だけを取り出す処理（おすすめ・いいね・メッセージで共通）
import { supabaseAdmin } from './supabaseAdmin.js'

// id の一覧から、公開用のプロフィールを取得する → { [id]: { partnerId, nickname, age, ... } }
export async function getPublicProfiles(ids) {
  if (ids.length === 0) return {}

  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, nickname, age, occupation, prefecture, annual_income, avatar_path')
    .in('id', ids)
  if (error) throw error

  // 写真は非公開の場所にあるので、1時間だけ有効な閲覧用 URL をまとめて発行する
  const avatarPaths = profiles.map((p) => p.avatar_path).filter(Boolean)
  const avatarUrlByPath = {}
  if (avatarPaths.length > 0) {
    const { data: signed } = await supabaseAdmin.storage.from('avatars').createSignedUrls(avatarPaths, 60 * 60)
    for (const s of signed ?? []) avatarUrlByPath[s.path] = s.signedUrl
  }

  return Object.fromEntries(
    profiles.map((p) => [
      p.id,
      {
        partnerId: p.id,
        nickname: p.nickname,
        avatarUrl: avatarUrlByPath[p.avatar_path] ?? null,
        age: p.age,
        occupation: p.occupation,
        prefecture: p.prefecture,
        annualIncome: p.annual_income,
      },
    ]),
  )
}

// 自分に関係するいいねの状態 → { liked: 自分がいいねした相手の Set, likedMe: 自分にいいねした相手の Set }
export async function getLikeSets(userId) {
  const { data, error } = await supabaseAdmin
    .from('likes')
    .select('from_user, to_user')
    .or(`from_user.eq.${userId},to_user.eq.${userId}`)
  if (error) throw error
  return {
    liked: new Set(data.filter((l) => l.from_user === userId).map((l) => l.to_user)),
    likedMe: new Set(data.filter((l) => l.to_user === userId).map((l) => l.from_user)),
  }
}

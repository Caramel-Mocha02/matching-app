import { supabase } from './supabase.js'

// 自分のプロフィールを取得する（まだ無ければ null）
export async function fetchProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return data
}

// プロフィールを保存する。upsert = 行が無ければ作成、あれば更新
export async function saveProfile(userId, values) {
  const { error } = await supabase
    .from('profiles')
    .upsert({ ...values, id: userId, updated_at: new Date().toISOString() })
  if (error) throw error
}

import { supabase } from './supabase.js'

// 診断データを保存するテーブル。どちらも id = ログインユーザーの ID
const TABLES = ['profiles', 'preferences']

// 自分の診断データをまとめて取得する → { profiles: {...}, preferences: {...} }
export async function fetchDiagnosis(userId) {
  const result = {}
  for (const table of TABLES) {
    const { data, error } = await supabase.from(table).select('*').eq('id', userId).maybeSingle()
    if (error) throw error
    result[table] = data ?? {} // まだ行が無ければ空のオブジェクト
  }
  return result
}

// 1つのテーブルに保存する。upsert = 行が無ければ作成、あれば更新
export async function saveToTable(table, userId, values) {
  const { error } = await supabase
    .from(table)
    .upsert({ ...values, id: userId, updated_at: new Date().toISOString() })
  if (error) throw error
}

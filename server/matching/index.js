// マッチング全体の流れ：データ取得 → 必須条件で絞り込み → スコア計算 → 上位を保存
import { supabaseAdmin } from '../lib/supabaseAdmin.js'
import { filterCandidates } from './filter.js'
import { scoreMatch } from './score.js'

const MAX_RESULTS = 5

// 全ユーザーの profiles と preferences を取得し、{ id, profile, preferences } の形にまとめる
async function loadAllUsers() {
  const [profilesRes, preferencesRes] = await Promise.all([
    supabaseAdmin.from('profiles').select('*'),
    supabaseAdmin.from('preferences').select('*'),
  ])
  if (profilesRes.error) throw profilesRes.error
  if (preferencesRes.error) throw preferencesRes.error

  const preferencesById = Object.fromEntries(preferencesRes.data.map((p) => [p.id, p]))
  return profilesRes.data.map((profile) => ({
    id: profile.id,
    profile,
    preferences: preferencesById[profile.id] ?? {},
  }))
}

// 診断を最後まで終えているか（性格・会話・生活価値観が入っていればOK）
const hasCompletedDiagnosis = (user) =>
  ['personality', 'communication', 'lifestyle'].every((key) => Object.keys(user.profile[key] ?? {}).length > 0)

export async function findMatches(userId) {
  const users = await loadAllUsers()
  const me = users.find((u) => u.id === userId)
  if (!me || !hasCompletedDiagnosis(me)) {
    const error = new Error('診断がまだ完了していません。')
    error.status = 400
    throw error
  }

  // 1. 必須条件で絞り込み（Phase 7）
  const others = users.filter((u) => u.id !== userId && hasCompletedDiagnosis(u))
  const candidates = filterCandidates(me, others)

  // 2〜9. 相性スコアを計算し、高い順に並べる（Phase 8）
  const scored = candidates
    .map((c) => ({ partner: c, ...scoreMatch(me, c) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, MAX_RESULTS)

  // 10. 結果を保存する（前回の結果は削除して作り直す）
  const { error: deleteError } = await supabaseAdmin.from('matching_results').delete().eq('user_id', userId)
  if (deleteError) throw deleteError
  if (scored.length > 0) {
    const { error: insertError } = await supabaseAdmin.from('matching_results').insert(
      scored.map((r, i) => ({
        user_id: userId,
        partner_id: r.partner.id,
        rank: i + 1,
        total_score: r.total,
        category_scores: r.categoryScores,
        details: r.details,
      })),
    )
    if (insertError) throw insertError
  }

  // 画面に返すのは、公開してよい項目だけ
  return {
    candidateCount: candidates.length,
    matches: scored.map((r, i) => ({
      rank: i + 1,
      partnerId: r.partner.id,
      nickname: r.partner.profile.nickname,
      age: r.partner.profile.age,
      occupation: r.partner.profile.occupation,
      prefecture: r.partner.profile.prefecture,
      annualIncome: r.partner.profile.annual_income,
      totalScore: r.total,
      categoryScores: r.categoryScores,
      details: r.details,
    })),
  }
}

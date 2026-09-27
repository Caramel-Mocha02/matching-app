// マッチング全体の流れ：データ取得 → 必須条件で絞り込み → スコア計算 → 上位を保存
import { supabaseAdmin } from '../lib/supabaseAdmin.js'
import { filterCandidates, countExclusions } from './filter.js'
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

// 保存済みの結果を取り出す（画面を開いたとき用。計算し直さないので速く、AI の説明文も残る）
export async function getSavedMatches(userId) {
  const { data: results, error } = await supabaseAdmin
    .from('matching_results')
    .select('*')
    .eq('user_id', userId)
    .order('rank')
  if (error) throw error
  if (results.length === 0) return { matches: [] }

  // 相手のプロフィールのうち、画面に出してよい項目だけを取得する
  const { data: partners, error: partnerError } = await supabaseAdmin
    .from('profiles')
    .select('id, nickname, age, occupation, prefecture, annual_income, avatar_path')
    .in('id', results.map((r) => r.partner_id))
  if (partnerError) throw partnerError
  const partnerById = Object.fromEntries(partners.map((p) => [p.id, p]))

  // 写真は非公開の場所にあるので、1時間だけ有効な閲覧用 URL をまとめて発行する
  const avatarPaths = partners.map((p) => p.avatar_path).filter(Boolean)
  const avatarUrlByPath = {}
  if (avatarPaths.length > 0) {
    const { data: signed } = await supabaseAdmin.storage.from('avatars').createSignedUrls(avatarPaths, 60 * 60)
    for (const s of signed ?? []) avatarUrlByPath[s.path] = s.signedUrl
  }

  return {
    calculatedAt: results[0].created_at,
    matches: results.map((r) => {
      const p = partnerById[r.partner_id] ?? {}
      return {
        rank: r.rank,
        partnerId: r.partner_id,
        nickname: p.nickname,
        avatarUrl: avatarUrlByPath[p.avatar_path] ?? null,
        age: p.age,
        occupation: p.occupation,
        prefecture: p.prefecture,
        annualIncome: p.annual_income,
        totalScore: r.total_score,
        categoryScores: r.category_scores,
        details: r.details,
        explanation: r.explanation,
      }
    }),
  }
}

// マッチングを計算し直して保存し、結果を返す
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

  const saved = await getSavedMatches(userId)
  return {
    ...saved,
    candidateCount: candidates.length,
    exclusions: countExclusions(me, others), // 0人のときに「どの条件で除外されたか」を表示するため
  }
}

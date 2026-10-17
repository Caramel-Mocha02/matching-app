// 年齢確認：書類の提出・運営による審査・状態の確認。
// 状態（age_verifications テーブル）を書き換えられるのはサーバーだけ。ユーザーは読むことしかできない。
import { supabaseAdmin } from './lib/supabaseAdmin.js'

const MIN_AGE = 18
const BUCKET = 'id-documents'

// 運営者かどうか（server/.env の ADMIN_EMAILS にカンマ区切りで書いたメールアドレス）
export const isAdmin = (email) =>
  (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean).includes(email?.toLowerCase())

// 生年月日から、今日時点の満年齢を計算する
export function ageFrom(birthDate, today = new Date()) {
  const b = new Date(`${birthDate}T00:00:00`)
  let age = today.getFullYear() - b.getFullYear()
  const hadBirthday = today.getMonth() > b.getMonth() || (today.getMonth() === b.getMonth() && today.getDate() >= b.getDate())
  if (!hadBirthday) age--
  return age
}

const badRequest = (message) => Object.assign(new Error(message), { status: 400 })

// 自分の状態 → { ageVerification: { status, note, submittedAt } または null, isAdmin }
export async function getMyStatus(user) {
  const { data, error } = await supabaseAdmin
    .from('age_verifications')
    .select('status, note, submitted_at, reviewed_at')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) throw error
  return {
    ageVerification: data && { status: data.status, note: data.note, submittedAt: data.submitted_at, reviewedAt: data.reviewed_at },
    isAdmin: isAdmin(user.email),
  }
}

// 書類を提出する（画像はブラウザから Storage にアップロード済み。ここでは保存場所と生年月日を受け取る）
export async function submitVerification(userId, { documentPath, birthDate }) {
  if (typeof documentPath !== 'string' || !documentPath.startsWith(`${userId}/`)) throw badRequest('書類の画像を選んでください。')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate ?? '') || Number.isNaN(new Date(birthDate).getTime())) {
    throw badRequest('生年月日を正しく入力してください。')
  }
  if (ageFrom(birthDate) < MIN_AGE) throw badRequest('18歳未満の方はご利用いただけません。')

  const { data: current } = await supabaseAdmin.from('age_verifications').select('status, document_path').eq('user_id', userId).maybeSingle()
  if (current?.status === 'verified') throw badRequest('年齢確認はすでに完了しています。')
  // 出し直しの場合は、前回の書類を削除する
  if (current?.document_path && current.document_path !== documentPath) {
    await supabaseAdmin.storage.from(BUCKET).remove([current.document_path])
  }

  const { error } = await supabaseAdmin.from('age_verifications').upsert({
    user_id: userId,
    status: 'pending',
    document_path: documentPath,
    birth_date: birthDate,
    note: null,
    submitted_at: new Date().toISOString(),
    reviewed_at: null,
  })
  if (error) throw error
}

// 【運営者用】審査待ちの一覧（書類の画像は10分だけ見られる URL を付ける）
export async function listPending() {
  const { data: rows, error } = await supabaseAdmin
    .from('age_verifications')
    .select('user_id, document_path, birth_date, submitted_at')
    .eq('status', 'pending')
    .order('submitted_at')
  if (error) throw error
  if (rows.length === 0) return { items: [] }

  const [{ data: profiles }, { data: signed }] = await Promise.all([
    supabaseAdmin.from('profiles').select('id, nickname, age').in('id', rows.map((r) => r.user_id)),
    supabaseAdmin.storage.from(BUCKET).createSignedUrls(rows.map((r) => r.document_path).filter(Boolean), 60 * 10),
  ])
  const profileById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))
  const urlByPath = Object.fromEntries((signed ?? []).map((s) => [s.path, s.signedUrl]))

  const items = await Promise.all(
    rows.map(async (r) => {
      const { data } = await supabaseAdmin.auth.admin.getUserById(r.user_id)
      return {
        userId: r.user_id,
        email: data?.user?.email ?? '',
        nickname: profileById[r.user_id]?.nickname ?? '（未登録）',
        profileAge: profileById[r.user_id]?.age ?? null,
        birthDate: r.birth_date,
        ageFromBirthDate: r.birth_date ? ageFrom(r.birth_date) : null,
        submittedAt: r.submitted_at,
        documentUrl: urlByPath[r.document_path] ?? null,
      }
    }),
  )
  return { items }
}

// 【運営者用】承認または差し戻し。どちらの場合も、書類の画像はここで削除する
export async function reviewVerification(userId, { approve, note }) {
  const { data: row, error } = await supabaseAdmin.from('age_verifications').select('status, document_path').eq('user_id', userId).maybeSingle()
  if (error) throw error
  if (!row || row.status !== 'pending') throw badRequest('審査待ちの申請が見つかりません。')

  if (row.document_path) await supabaseAdmin.storage.from(BUCKET).remove([row.document_path])
  const { error: updateError } = await supabaseAdmin
    .from('age_verifications')
    .update({
      status: approve ? 'verified' : 'rejected',
      note: approve ? null : (note || '書類を確認できませんでした。もう一度提出してください。'),
      document_path: null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
  if (updateError) throw updateError
}
